import type { FriendshipRow, PvpService } from './PvpService';
import { supabase } from '../supabaseClient';
import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { createSystemVillage, hashString, isSameOrCloneVillage } from './BotFactory';

/**
 * Online backend using Supabase's REST API (tables defined in supabase/schema.sql).
 * Enabled when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 */
export class SupabasePvpService implements PvpService {
    readonly mode = 'online' as const;
    private readonly baseUrl: string;
    private readonly key: string;

    private playerId = '';
    private villageToken = '';
    private warnedMigration = false;

    constructor(url: string, key: string) {
        // Accept both the project URL and the REST URL (.../rest/v1/)
        this.baseUrl = url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1';
        this.key = key;
    }

    setIdentity(playerId: string, villageToken: string) {
        this.playerId = playerId;
        this.villageToken = villageToken;
    }

    /** Signed-in players send their session so the server knows their account (auth.uid()). */
    private async authHeader(): Promise<Record<string, string>> {
        try {
            const session = supabase ? (await supabase.auth.getSession()).data.session : null;
            if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
        } catch { /* no session */ }
        // Legacy anon keys are JWTs and go in Authorization too;
        // new publishable keys (sb_publishable_...) only go in apikey.
        return this.key.startsWith('eyJ') ? { Authorization: `Bearer ${this.key}` } : {};
    }

    /** Calls a secure database function (see supabase/migrations/002_secure_writes.sql). */
    private async rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
        try {
            return await this.request<T>(`/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
        } catch (e) {
            if (!this.warnedMigration && String(e).includes('PGRST202')) {
                this.warnedMigration = true;
                console.error('PvP: faltan las funciones seguras en Supabase. Ejecuta supabase/migrations/002_secure_writes.sql en el SQL Editor.');
            }
            throw e;
        }
    }

    private static isClientOnlyVillage(id: string): boolean {
        return !id || id.startsWith('bot_') || id.startsWith('system_') || id.startsWith('rival_') || id.startsWith('campaign_');
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                apikey: this.key,
                ...(await this.authHeader()),
                'Content-Type': 'application/json',
                ...(init.headers || {}),
            },
        });
        if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
        const text = await res.text();
        return (text ? JSON.parse(text) : null) as T;
    }

    private getRecentOpponents(): string[] {
        try {
            const raw = localStorage.getItem('mini_recent_opponents');
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private recordRecentOpponent(id: string) {
        try {
            const list = this.getRecentOpponents().filter(x => x !== id);
            list.unshift(id);
            localStorage.setItem('mini_recent_opponents', JSON.stringify(list.slice(0, 10)));
        } catch { /* ignore */ }
    }

    /**
     * Publishes village state.
     * Keeps village available for asynchronous defense while saving current session timestamp.
     * Automatically cleans up any lower-level duplicate accounts from the same user/name.
     */
    async publishVillage(snapshot: VillageSnapshot, isOnline = true): Promise<void> {
        const now = Date.now();
        const payloadSnapshot: VillageSnapshot = {
            ...snapshot,
            onlineUntil: isOnline ? now + 90_000 : 0,
            updatedAt: now,
        };
        // The server keeps any longer shield or battle lock, and retires this
        // account's other (lower level) villages.
        await this.rpc('publish_village', {
            p_id: snapshot.playerId,
            p_token: this.villageToken,
            p_name: (snapshot.name || 'Héroe').slice(0, 40),
            p_trophies: Math.max(0, Math.floor(snapshot.trophies || 0)),
            p_shield: new Date(snapshot.shieldUntil || 0).toISOString(),
            p_snapshot: payloadSnapshot,
        });
    }

    /**
     * Finds rival villages:
     * 1. Never returns the current player (checks playerId, userId, and name).
     * 2. Finds all registered human players without narrow trophy fences.
     * 3. Rotates through available opponents to prevent consecutive duplicates.
     * 4. Seamlessly supplements with realistic rival villages if needed.
     */
    async findOpponents(me: VillageSnapshot, count: number, refresh: number): Promise<VillageSnapshot[]> {
        const nowMs = Date.now();

        // 1. Fetch real villages without narrow trophy barriers so all human players are found
        const params = new URLSearchParams({
            select: 'snapshot',
            id: `neq.${me.playerId}`,
            order: 'updated_at.desc',
            limit: '50',
        });

        let players: VillageSnapshot[] = [];
        try {
            const rows = await this.request<{ snapshot: VillageSnapshot }[]>(`/villages?${params}`);
            players = (rows || []).map(r => r.snapshot).filter(Boolean);
        } catch (e) {
            console.warn('PvP: could not load online opponents', e);
        }

        // 2. Strict filters:
        // - Cannot be self or identical user
        // - Cannot be deleted or deactivated duplicates
        // - Cannot be locked in battle by another player right now (3-minute lock)
        // - Cannot have active post-defeat defense shield (> 60s in future)
        const validPlayers = players.filter(p => {
            if (!p || !p.playerId) return false;
            if (p.isDeleted || (p.name && p.name.startsWith('[BORRADO'))) return false;
            if (isSameOrCloneVillage(p, me)) return false;
            if (p.underAttackUntil && p.underAttackUntil > nowMs) return false;
            if (p.shieldUntil && p.shieldUntil > nowMs + 60_000) return false;
            return true;
        });

        // 3. Smart Anti-Duplication & Rotation:
        const recentOpponents = this.getRecentOpponents();
        const notRecent = validPlayers.filter(p => !recentOpponents.includes(p.playerId));
        const recentlySeen = validPlayers.filter(p => recentOpponents.includes(p.playerId));

        const seed = hashString(`${me.playerId}:${refresh}:${nowMs}`);
        const sortByTrophiesAndJitter = (list: VillageSnapshot[]) => {
            return list.sort((a, b) => {
                const diffA = Math.abs(a.trophies - me.trophies);
                const diffB = Math.abs(b.trophies - me.trophies);
                if (Math.abs(diffA - diffB) < 200) {
                    return (hashString(a.playerId) ^ seed) - (hashString(b.playerId) ^ seed);
                }
                return diffA - diffB;
            });
        };

        const sortedCandidates = [
            ...sortByTrophiesAndJitter(notRecent),
            ...recentlySeen.sort((a, b) => recentOpponents.indexOf(b.playerId) - recentOpponents.indexOf(a.playerId)),
        ];

        const picked: VillageSnapshot[] = [];
        for (const candidate of sortedCandidates) {
            if (picked.length >= count) break;
            picked.push(candidate);
            this.recordRecentOpponent(candidate.playerId);
        }

        // 4. Supplement with realistic rival villages if needed
        for (let i = picked.length; i < count; i++) {
            picked.push(createSystemVillage(seed + i * 7919, me.trophies, me.kingdom));
        }

        return picked;
    }

    /**
     * Locks a village when an attack starts so other players cannot attack it at the same time.
     * Returns false when someone else is already attacking it (or it is shielded).
     */
    async lockVillageForAttack(defenderId: string): Promise<boolean> {
        if (SupabasePvpService.isClientOnlyVillage(defenderId)) return true;
        try {
            return await this.rpc<boolean>('lock_village', {
                p_defender: defenderId, p_attacker: this.playerId, p_token: this.villageToken,
            });
        } catch (e) {
            console.warn('PvP: could not lock village for attack', e);
            return false;
        }
    }

    /** Releases our battle lock if we leave before attacking. */
    async unlockVillage(defenderId: string): Promise<void> {
        if (SupabasePvpService.isClientOnlyVillage(defenderId)) return;
        try {
            await this.rpc('unlock_village', {
                p_defender: defenderId, p_attacker: this.playerId, p_token: this.villageToken,
            });
        } catch (e) {
            console.warn('PvP: could not unlock village', e);
        }
    }

    async fetchVillage(playerId: string): Promise<VillageSnapshot | null> {
        try {
            const rows = await this.request<{ snapshot: VillageSnapshot }[]>(
                `/villages?id=eq.${encodeURIComponent(playerId)}&select=snapshot&limit=1`
            );
            return rows && rows.length > 0 ? rows[0].snapshot : null;
        } catch (e) {
            console.warn('PvP: could not fetch village', playerId, e);
            return null;
        }
    }

    async searchPlayers(query: string, excludeId: string): Promise<VillageSnapshot[]> {
        const clean = query.trim();
        if (!clean) return [];
        try {
            const byName = await this.request<{ snapshot: VillageSnapshot }[]>(
                `/villages?id=neq.${encodeURIComponent(excludeId)}&name=ilike.*${encodeURIComponent(clean)}*&select=snapshot&limit=15`
            );
            const list = (byName || []).map(r => r.snapshot).filter(s => Boolean(s && s.playerId && s.playerId !== excludeId && !s.isDeleted && !s.name?.startsWith('[BORRADO')));
            if (list.length > 0) return list;

            const byId = await this.request<{ snapshot: VillageSnapshot }[]>(
                `/villages?id=eq.${encodeURIComponent(clean)}&select=snapshot&limit=1`
            );
            return (byId || []).map(r => r.snapshot).filter(s => Boolean(s && s.playerId && s.playerId !== excludeId && !s.isDeleted && !s.name?.startsWith('[BORRADO')));
        } catch (e) {
            console.warn('PvP: player search failed', e);
            return [];
        }
    }

    async getRecentRealPlayers(excludeId: string, limit = 10): Promise<VillageSnapshot[]> {
        try {
            const rows = await this.request<{ snapshot: VillageSnapshot }[]>(
                `/villages?id=neq.${encodeURIComponent(excludeId)}&order=updated_at.desc&select=snapshot&limit=${limit}`
            );
            return (rows || []).map(r => r.snapshot).filter(s => Boolean(s && !s.isBot && s.playerId !== excludeId && !s.isDeleted && !s.name?.startsWith('[BORRADO')));
        } catch (e) {
            console.warn('PvP: could not load recent players', e);
            return [];
        }
    }

    async reportAttack(record: AttackRecord): Promise<void> {
        if (SupabasePvpService.isClientOnlyVillage(record.defenderId)) return;
        // The server checks we hold the battle lock, caps the loot and sets the defender's shield
        await this.rpc('report_attack', {
            p_attacker: this.playerId, p_token: this.villageToken, p_record: record,
        });
    }

    // ---------- Friends ----------

    async sendFriendRequest(targetId: string, info: Record<string, unknown>): Promise<void> {
        await this.rpc('send_friend_request', {
            p_from: this.playerId, p_token: this.villageToken, p_to: targetId, p_info: info,
        });
    }

    async respondFriendRequest(requestId: string, accept: boolean): Promise<void> {
        await this.rpc('respond_friend_request', {
            p_me: this.playerId, p_token: this.villageToken, p_request_id: requestId, p_accept: accept,
        });
    }

    async removeFriend(friendId: string): Promise<void> {
        await this.rpc('remove_friend', { p_me: this.playerId, p_token: this.villageToken, p_friend: friendId });
    }

    async fetchFriendships(playerId: string): Promise<FriendshipRow[]> {
        const id = encodeURIComponent(playerId);
        return await this.request<FriendshipRow[]>(
            `/friendships?or=(sender_id.eq.${id},receiver_id.eq.${id})&select=id,sender_id,receiver_id,status,sender_info,created_at&order=created_at.desc&limit=200`
        ) || [];
    }

    async fetchAttacksAgainst(playerId: string, since: number): Promise<AttackRecord[]> {
        const params = new URLSearchParams({
            select: 'record',
            defender_id: `eq.${playerId}`,
            created_at: `gt.${new Date(since || 0).toISOString()}`,
            order: 'created_at.asc',
        });
        const rows = await this.request<{ record: AttackRecord }[]>(`/attacks?${params}`);
        return rows.map(r => r.record);
    }
}
