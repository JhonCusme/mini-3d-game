import { GameConfig } from '../../config/GameConfig';
import { emptyTroops, type DefenseLogEntry, type GameState, type TroopCounts, type TroopId } from '../GameState';
import { GodManager } from '../GodManager';
import { HeroManager } from '../HeroManager';
import { VillageManager } from '../VillageManager';
import type { AttackArmy, AttackRecord, PvpBattleResult, VillageSnapshot } from './PvpTypes';
import type { PvpOutcome } from './PvpRules';
import { lootableCoins } from './PvpRules';

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];
const MAX_LOG = 30;

const sum = (t: TroopCounts) => TROOP_IDS.reduce((s, id) => s + (t[id] || 0), 0);

export class PvpManager {
    static totalTroops(state: GameState): number {
        return sum(state.troops) + sum(state.garrison);
    }

    /** Moves troops between the army (attack) and the garrison (defense). */
    static moveTroops(state: GameState, troopId: TroopId, amount: number, to: 'garrison' | 'army'): GameState {
        const from = to === 'garrison' ? state.troops : state.garrison;
        const moved = Math.max(0, Math.min(amount, from[troopId] || 0));
        if (moved === 0) return state;
        const troops = { ...state.troops, [troopId]: state.troops[troopId] + (to === 'army' ? moved : -moved) };
        const garrison = { ...state.garrison, [troopId]: state.garrison[troopId] + (to === 'garrison' ? moved : -moved) };
        return { ...state, troops, garrison };
    }

    static buildSnapshot(state: GameState, userId?: string): VillageSnapshot {
        return {
            playerId: state.playerId,
            userId,
            name: state.playerName || 'Héroe',
            avatar: state.playerAvatar,
            kingdom: state.playerKingdom,
            level: state.level,
            heroLevel: state.heroLevel,
            trophies: state.trophies,
            garrison: { ...state.garrison },
            defenseGod: state.defenseGod,
            defenseGodLevel: state.defenseGod ? GodManager.getLevel(state, state.defenseGod) : 0,
            wallsLevel: state.upgrades.walls || 0,
            armorLevel: state.upgrades.troopHealth || 0,
            attackLevel: state.upgrades.attackPower || 0,
            lootableCoins: lootableCoins(state.coins, state.level),
            shieldUntil: state.shieldUntil,
            updatedAt: Date.now(),
            layout: state.village.filter(b => b.level > 0).map(b => ({ type: b.type, level: b.level, x: b.x, z: b.z })),
        };
    }

    static buildArmy(state: GameState, selection: TroopCounts): AttackArmy {
        const troops = emptyTroops();
        for (const id of TROOP_IDS) troops[id] = Math.max(0, Math.min(selection[id] || 0, state.troops[id] || 0));
        const heroReady = (state.heroRecoveringUntil || 0) <= Date.now();
        return {
            troops,
            god: state.attackGod,
            godLevel: state.attackGod ? GodManager.getLevel(state, state.attackGod) : 0,
            heroLevel: state.heroLevel,
            heroAvailable: heroReady,
            attackLevel: state.upgrades.attackPower || 0,
            armorLevel: state.upgrades.troopHealth || 0,
            critLevel: state.upgrades.critRate || 0,
            kingdom: state.playerKingdom,
            troopLevels: state.troopLevels,
        };
    }

    static canAttack(state: GameState, selection: TroopCounts): boolean {
        return state.energy >= GameConfig.pvp.energyCost && (sum(this.buildArmy(state, selection).troops) > 0 || (state.heroRecoveringUntil || 0) <= Date.now());
    }

    static applyAttack(state: GameState, result: PvpBattleResult, outcome: PvpOutcome): GameState {
        const troops = { ...state.troops };
        for (const id of TROOP_IDS) troops[id] = Math.max(0, troops[id] - result.attackerLosses[id]);
        let heroRecoveringUntil = state.heroRecoveringUntil;
        if (result.heroDied) {
            heroRecoveringUntil = Date.now() + HeroManager.heroRecoveryDuration(state.heroLevel) * 1000;
        }
        return {
            ...state,
            troops,
            heroRecoveringUntil,
            energy: state.energy - GameConfig.pvp.energyCost,
            coins: Math.min(VillageManager.maxGoldCapacity(state), state.coins + outcome.coinsStolen),
            trophies: Math.max(0, state.trophies + outcome.attackerTrophiesDelta),
            pvpWins: state.pvpWins + (result.won ? 1 : 0),
            pvpLosses: state.pvpLosses + (result.won ? 0 : 1),
            shieldUntil: 0, // attacking breaks your shield
        };
    }

    static buildAttackRecord(state: GameState, opponent: VillageSnapshot, result: PvpBattleResult, outcome: PvpOutcome): AttackRecord {
        return {
            id: `atk_${state.playerId}_${result.seed}_${Date.now()}`,
            attackerId: state.playerId,
            attackerName: state.playerName || 'Héroe',
            attackerTrophies: state.trophies,
            defenderId: opponent.playerId,
            attackerWon: result.won,
            stars: result.stars,
            coinsStolen: outcome.coinsStolen,
            defenderTrophiesDelta: outcome.defenderTrophiesDelta,
            defenderLosses: result.defenderLosses,
            createdAt: Date.now(),
        };
    }

    /** Applies attacks received while away: lost coins, fallen defenders, trophies and log. */
    static applyDefenseRecords(state: GameState, records: AttackRecord[], checkedAt: number): GameState {
        let next: GameState = { ...state, lastDefenseCheck: checkedAt };
        if (records.length === 0) return next;

        const known = new Set(state.defenseLog.map(e => e.id));
        const entries: DefenseLogEntry[] = [];
        for (const r of records) {
            if (known.has(r.id)) continue;
            const garrison = { ...next.garrison };
            const lost: Partial<TroopCounts> = {};
            for (const id of TROOP_IDS) {
                const l = Math.min(garrison[id], r.defenderLosses[id] || 0);
                garrison[id] -= l;
                if (l > 0) lost[id] = l;
            }
            const coinsLost = Math.min(Math.floor(next.coins), r.coinsStolen);
            next = {
                ...next,
                garrison,
                coins: next.coins - coinsLost,
                trophies: Math.max(0, next.trophies + r.defenderTrophiesDelta),
                shieldUntil: r.attackerWon ? Math.max(next.shieldUntil, r.createdAt + GameConfig.pvp.shieldMs) : next.shieldUntil,
            };
            entries.push({
                id: r.id,
                attackerId: r.attackerId,
                attackerName: r.attackerName,
                attackerTrophies: r.attackerTrophies,
                won: !r.attackerWon,
                coinsLost,
                trophiesDelta: r.defenderTrophiesDelta,
                garrisonLost: lost,
                timestamp: r.createdAt,
                seen: false,
                revenged: false,
            });
        }
        return { ...next, defenseLog: [...entries.reverse(), ...state.defenseLog].slice(0, MAX_LOG) };
    }

    static markLogSeen(state: GameState): GameState {
        if (state.defenseLog.every(e => e.seen)) return state;
        return { ...state, defenseLog: state.defenseLog.map(e => ({ ...e, seen: true })) };
    }
}
