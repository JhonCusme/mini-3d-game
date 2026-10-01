import type { PvpService } from './PvpService';
import type { AttackRecord, VillageSnapshot } from './PvpTypes';
import { createBotArmy, createSystemVillage, hashString } from './BotFactory';
import { simulatePvpBattle, mulberry32 } from './PvpBattle';
import { computeOutcome } from './PvpRules';

const SNAPSHOT_KEY = 'mini_kingdom_pvp_snapshot';
const RAID_MIN_GAP_MS = 20 * 60 * 1000;
const RAID_EVERY_MS = 90 * 60 * 1000;
const MAX_RAIDS = 3;

/**
 * Offline stand-in for the online backend: rivals are generated bots/system villages and,
 * while you are away, bots raid the defense you left prepared.
 */
export class LocalPvpService implements PvpService {
    readonly mode = 'local' as const;

    async publishVillage(snapshot: VillageSnapshot, isOnline = true): Promise<void> {
        try {
            const now = Date.now();
            const withOnline: VillageSnapshot = {
                ...snapshot,
                onlineUntil: isOnline ? now + 90_000 : 0,
                updatedAt: now,
            };
            localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(withOnline));
        } catch { /* storage unavailable */ }
    }

    async findOpponents(me: VillageSnapshot, count: number, refresh: number): Promise<VillageSnapshot[]> {
        const base = hashString(`${me.playerId}:${refresh}:${Date.now()}`);
        return Array.from({ length: count }, (_, i) => createSystemVillage(base + i * 7919, me.trophies));
    }

    async lockVillageForAttack(): Promise<boolean> {
        return true;
    }

    async unlockVillage(): Promise<void> {
        // Local system villages don't need persistent locking
    }

    async reportAttack(): Promise<void> {
        // Bots don't need to be notified
    }

    async fetchAttacksAgainst(playerId: string, since: number): Promise<AttackRecord[]> {
        const now = Date.now();
        if (!since || now - since < RAID_MIN_GAP_MS) return [];

        let snapshot: VillageSnapshot | null = null;
        try {
            const raw = localStorage.getItem(SNAPSHOT_KEY);
            snapshot = raw ? JSON.parse(raw) : null;
        } catch { /* ignore */ }
        if (!snapshot || snapshot.playerId !== playerId) return [];

        const rng = mulberry32(hashString(`${playerId}:${since}`));
        const elapsed = now - since;
        const raids = Math.min(MAX_RAIDS, Math.floor(elapsed / RAID_EVERY_MS) + (rng() < 0.5 ? 1 : 0));

        const records: AttackRecord[] = [];
        let village = { ...snapshot, garrison: { ...snapshot.garrison } };
        for (let i = 0; i < raids; i++) {
            const seed = Math.floor(rng() * 2 ** 31);
            const bot = createBotArmy(seed, village.trophies);
            const result = simulatePvpBattle(bot.army, village, seed);
            const outcome = computeOutcome(result, bot.trophies, village.trophies, village.lootableCoins);
            records.push({
                id: `raid_${seed}`,
                attackerId: `bot_${seed}`,
                attackerName: bot.name,
                attackerTrophies: bot.trophies,
                defenderId: playerId,
                attackerWon: result.won,
                stars: result.stars,
                coinsStolen: outcome.coinsStolen,
                defenderTrophiesDelta: outcome.defenderTrophiesDelta,
                defenderLosses: result.defenderLosses,
                createdAt: since + Math.floor(elapsed * (i + 1) / (raids + 1)),
            });
            // Next raid hits what is left
            for (const id of Object.keys(village.garrison) as (keyof typeof village.garrison)[]) {
                village.garrison[id] = Math.max(0, village.garrison[id] - result.defenderLosses[id]);
            }
            village = {
                ...village,
                trophies: Math.max(0, village.trophies + outcome.defenderTrophiesDelta),
                lootableCoins: Math.max(0, village.lootableCoins - outcome.coinsStolen),
            };
        }
        return records;
    }
}
