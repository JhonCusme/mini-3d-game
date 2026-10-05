import type { PvpService } from './PvpService';
import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { createSystemVillage, hashString, isSameOrCloneVillage } from './BotFactory';
import { GameConfig } from '../../config/GameConfig';

/**
 * Online backend using Supabase's REST API (tables defined in supabase/schema.sql).
 * Enabled when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.
 */
export class SupabasePvpService implements PvpService {
    readonly mode = 'online' as const;
    private readonly baseUrl: string;
    private readonly key: string;

    constructor(url: string, key: string) {
        // Accept both the project URL and the REST URL (.../rest/v1/)
        this.baseUrl = url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '') + '/rest/v1';
        this.key = key;
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                apikey: this.key,
                // Legacy anon keys are JWTs and go in Authorization too;
                // new publishable keys (sb_publishable_...) only go in apikey.
                ...(this.key.startsWith('eyJ') ? { Authorization: `Bearer ${this.key}` } : {}),
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
     */
    async publishVillage(snapshot: VillageSnapshot, isOnline = true): Promise<void> {
        const now = Date.now();
        const onlineUntil = isOnline ? now + 90_000 : 0;
        // Shield only applies if explicitly granted (post-defeat defense shield or store protection)
        const effectiveShield = snapshot.shieldUntil || 0;

        const payloadSnapshot: VillageSnapshot = {
            ...snapshot,
            onlineUntil,
            updatedAt: now,
        };

        await this.request('/villages?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({
                id: snapshot.playerId,
                name: snapshot.name,
                trophies: snapshot.trophies,
                shield_until: new Date(effectiveShield).toISOString(),
                snapshot: payloadSnapshot,
                updated_at: new Date(now).toISOString(),
            }),
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
        // - Cannot be locked in battle by another player right now (3-minute lock)
        // - Cannot have active post-defeat defense shield (> 60s in future)
        const validPlayers = players.filter(p => {
            if (!p || !p.playerId) return false;
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
     * Locks a village when an attack starts so other players cannot attack it concurrently.
     */
    async lockVillageForAttack(defenderId: string): Promise<boolean> {
        if (!defenderId || defenderId.startsWith('bot_') || defenderId.startsWith('system_') || defenderId.startsWith('rival_')) {
            return true;
        }
        try {
            const lockUntil = new Date(Date.now() + 180_000).toISOString(); // 3-minute battle lock
            await this.request(`/villages?id=eq.${encodeURIComponent(defenderId)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ shield_until: lockUntil }),
            });
            return true;
        } catch (e) {
            console.warn('PvP: could not lock village for attack', e);
            return false;
        }
    }

    /**
     * Unlocks a village if the attacker retreats early or cancels.
     */
    async unlockVillage(defenderId: string): Promise<void> {
        if (!defenderId || defenderId.startsWith('bot_') || defenderId.startsWith('system_') || defenderId.startsWith('rival_')) {
            return;
        }
        try {
            await this.request(`/villages?id=eq.${encodeURIComponent(defenderId)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ shield_until: new Date().toISOString() }),
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
            const list = (byName || []).map(r => r.snapshot).filter(s => Boolean(s && s.playerId && s.playerId !== excludeId));
            if (list.length > 0) return list;

            const byId = await this.request<{ snapshot: VillageSnapshot }[]>(
                `/villages?id=eq.${encodeURIComponent(clean)}&select=snapshot&limit=1`
            );
            return (byId || []).map(r => r.snapshot).filter(s => Boolean(s && s.playerId && s.playerId !== excludeId));
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
            return (rows || []).map(r => r.snapshot).filter(s => Boolean(s && !s.isBot && s.playerId !== excludeId));
        } catch (e) {
            console.warn('PvP: could not load recent players', e);
            return [];
        }
    }

    async updateVillageSnapshot(playerId: string, patch: Partial<VillageSnapshot>): Promise<boolean> {
        try {
            const current = await this.fetchVillage(playerId);
            if (!current) return false;
            const updated: VillageSnapshot = { ...current, ...patch, updatedAt: Date.now() };
            await this.request(`/villages?id=eq.${encodeURIComponent(playerId)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({
                    snapshot: updated,
                    updated_at: new Date().toISOString(),
                }),
            });
            return true;
        } catch (e) {
            console.warn('PvP: could not update village snapshot', e);
            return false;
        }
    }

    async reportAttack(record: AttackRecord): Promise<void> {
        if (record.defenderId.startsWith('bot_') || record.defenderId.startsWith('system_')) return;
        await this.request('/attacks', {
            method: 'POST',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
                id: record.id,
                attacker_id: record.attackerId,
                defender_id: record.defenderId,
                record,
                created_at: new Date(record.createdAt).toISOString(),
            }),
        });
        // Protect the defender right away so they aren't farmed before they come back
        if (record.attackerWon) {
            await this.request(`/villages?id=eq.${encodeURIComponent(record.defenderId)}`, {
                method: 'PATCH',
                headers: { Prefer: 'return=minimal' },
                body: JSON.stringify({ shield_until: new Date(record.createdAt + GameConfig.pvp.shieldMs).toISOString() }),
            });
        } else {
            // Unlock if defender won
            await this.unlockVillage(record.defenderId);
        }
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
