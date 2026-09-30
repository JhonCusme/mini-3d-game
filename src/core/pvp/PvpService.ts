import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { LocalPvpService } from './LocalPvpService';
import { SupabasePvpService } from './SupabasePvpService';

/**
 * Backend for asynchronous multiplayer. Villages are published as snapshots,
 * attackers fight a snapshot and report the result so the defender sees it later.
 */
export interface PvpService {
    readonly mode: 'local' | 'online';
    publishVillage(snapshot: VillageSnapshot): Promise<void>;
    findOpponents(me: VillageSnapshot, count: number, refresh: number): Promise<VillageSnapshot[]>;
    reportAttack(record: AttackRecord): Promise<void>;
    fetchAttacksAgainst(playerId: string, since: number): Promise<AttackRecord[]>;
}

function createService(): PvpService {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (url && key) return new SupabasePvpService(url, key);
    return new LocalPvpService();
}

export const pvpService: PvpService = createService();
