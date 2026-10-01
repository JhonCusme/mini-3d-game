import type { PvpService } from './PvpService';
import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { createSystemVillage, hashString } from './BotFactory';
import { GameConfig } from '../../config/GameConfig';

const TROPHY_RANGE = 350;

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

    /**
     * Publishes village state.
     * When player is active in the game (`isOnline = true`), sets onlineUntil and
     * a temporary protection window so nobody can attack them while they are playing.
     */
    async publishVillage(snapshot: VillageSnapshot, isOnline = true): Promise<void> {
        const now = Date.now();
        // While playing, protect the village with an active session window (90s)
        const onlineUntil = isOnline ? now + 90_000 : 0;
        const effectiveShield = Math.max(snapshot.shieldUntil || 0, onlineUntil);

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
     * 1. Never returns the current player (checks playerId AND name).
     * 2. Excludes players currently online in the game, under attack, or shielded.
     * 3. If no valid human rivals exist, falls back to a rich System Village (NPC).
     */
    async findOpponents(me: VillageSnapshot, count: number, refresh: number): Promise<VillageSnapshot[]> {
        const nowMs = Date.now();
        const nowIso = new Date(nowMs).toISOString();

        const params = new URLSearchParams({
            select: 'snapshot',
            id: `neq.${me.playerId}`,
            shield_until: `lt.${nowIso}`,
            order: 'updated_at.desc',
            limit: '30',
        });
        params.append('trophies', `gte.${Math.max(0, me.trophies - TROPHY_RANGE)}`);
        params.append('trophies', `lte.${me.trophies + TROPHY_RANGE}`);

        let players: VillageSnapshot[] = [];
        try {
            const rows = await this.request<{ snapshot: VillageSnapshot }[]>(`/villages?${params}`);
            players = (rows || []).map(r => r.snapshot).filter(Boolean);
        } catch (e) {
            console.warn('PvP: could not load online opponents', e);
        }

        const myName = (me.name || '').trim().toLowerCase();

        // Strict filters:
        // - Cannot be self (by playerId OR name)
        // - Cannot be currently shielded, online in game, or under attack by someone else
        const validPlayers = players.filter(p => {
            if (!p || !p.playerId) return false;
            if (p.playerId === me.playerId) return false;
            if ((p.name || '').trim().toLowerCase() === myName) return false;
            if (p.shieldUntil && p.shieldUntil > nowMs) return false;
            if (p.onlineUntil && p.onlineUntil > nowMs) return false;
            if (p.underAttackUntil && p.underAttackUntil > nowMs) return false;
            return true;
        });

        // Shuffle deterministically per refresh so "search again" shows other rivals
        const seed = hashString(`${me.playerId}:${refresh}:${nowMs}`);
        validPlayers.sort((a, b) => (hashString(a.playerId) ^ seed) - (hashString(b.playerId) ^ seed));
        const picked = validPlayers.slice(0, count);

        // If no real human opponents available, generate rich System Villages (NPC)
        for (let i = picked.length; i < count; i++) {
            picked.push(createSystemVillage(seed + i * 7919, me.trophies));
        }

        return picked;
    }

    /**
     * Locks a village when an attack starts so other players cannot attack it concurrently.
     */
    async lockVillageForAttack(defenderId: string): Promise<boolean> {
        if (!defenderId || defenderId.startsWith('bot_') || defenderId.startsWith('system_')) {
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
        if (!defenderId || defenderId.startsWith('bot_') || defenderId.startsWith('system_')) {
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
