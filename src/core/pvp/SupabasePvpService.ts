import type { PvpService } from './PvpService';
import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { createBotVillage, hashString } from './BotFactory';
import { GameConfig } from '../../config/GameConfig';

const TROPHY_RANGE = 250;

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
                Authorization: `Bearer ${this.key}`,
                'Content-Type': 'application/json',
                ...(init.headers || {}),
            },
        });
        if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
        const text = await res.text();
        return (text ? JSON.parse(text) : null) as T;
    }

    async publishVillage(snapshot: VillageSnapshot): Promise<void> {
        await this.request('/villages?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({
                id: snapshot.playerId,
                name: snapshot.name,
                trophies: snapshot.trophies,
                shield_until: new Date(snapshot.shieldUntil).toISOString(),
                snapshot,
                updated_at: new Date().toISOString(),
            }),
        });
    }

    async findOpponents(me: VillageSnapshot, count: number, refresh: number): Promise<VillageSnapshot[]> {
        const now = new Date().toISOString();
        const params = new URLSearchParams({
            select: 'snapshot',
            id: `neq.${me.playerId}`,
            shield_until: `lt.${now}`,
            order: 'updated_at.desc',
            limit: '30',
        });
        params.append('trophies', `gte.${Math.max(0, me.trophies - TROPHY_RANGE)}`);
        params.append('trophies', `lte.${me.trophies + TROPHY_RANGE}`);

        let players: VillageSnapshot[] = [];
        try {
            const rows = await this.request<{ snapshot: VillageSnapshot }[]>(`/villages?${params}`);
            players = rows.map(r => r.snapshot);
        } catch (e) {
            console.warn('PvP: could not load online opponents', e);
        }

        // Shuffle deterministically per refresh so "search again" shows other rivals
        const seed = hashString(`${me.playerId}:${refresh}`);
        players.sort((a, b) => (hashString(a.playerId) ^ seed) - (hashString(b.playerId) ^ seed));
        const picked = players.slice(0, count);

        // Fill with bots while there are not enough real players around your trophies
        for (let i = picked.length; i < count; i++) picked.push(createBotVillage(seed + i * 7919, me.trophies));
        return picked;
    }

    async reportAttack(record: AttackRecord): Promise<void> {
        if (record.defenderId.startsWith('bot_')) return;
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
