import type { GameState, GodId } from './GameState';
import { GameConfig } from '../config/GameConfig';

export type GodConfig = (typeof GameConfig.gods)[GodId];

/** Numeric effects of a god at a given level, used by the PvP simulation. */
export interface GodEffects {
    attackBonus: number;   // +% damage
    lightning: number;     // flat damage dealt before round 1
    heal: number;          // share of losses revived each round
    wallBonus: number;     // +% wall HP (defense only)
    hpBonus: number;       // +% troop HP
    critChance: number;    // chance of double damage per round
}

export const NO_GOD_EFFECTS: GodEffects = { attackBonus: 0, lightning: 0, heal: 0, wallBonus: 0, hpBonus: 0, critChance: 0 };

export class GodManager {
    static getLevel(state: GameState, godId: GodId): number {
        return state.gods[godId] || 0;
    }

    static isUnlocked(state: GameState, godId: GodId): boolean {
        return this.getLevel(state, godId) > 0;
    }

    static meetsUnlockRequirement(state: GameState, godId: GodId): boolean {
        return state.territoryProgress >= GameConfig.gods[godId].unlockTerritory;
    }

    static canUnlock(state: GameState, godId: GodId): boolean {
        return !this.isUnlocked(state, godId)
            && this.meetsUnlockRequirement(state, godId)
            && state.gems >= GameConfig.gods[godId].unlockGems;
    }

    static unlock(state: GameState, godId: GodId): GameState {
        if (!this.canUnlock(state, godId)) return state;
        return {
            ...state,
            gems: state.gems - GameConfig.gods[godId].unlockGems,
            gods: { ...state.gods, [godId]: 1 },
            // Auto-equip the first god so it is immediately useful
            attackGod: state.attackGod ?? godId,
            defenseGod: state.defenseGod ?? godId,
        };
    }

    static getLevelUpCost(level: number): number {
        return Math.floor(GameConfig.godLevelUpBaseGems * Math.pow(GameConfig.godLevelUpMultiplier, level - 1));
    }

    static canLevelUp(state: GameState, godId: GodId): boolean {
        const level = this.getLevel(state, godId);
        return level > 0 && level < GameConfig.godMaxLevel && state.gems >= this.getLevelUpCost(level);
    }

    static levelUp(state: GameState, godId: GodId): GameState {
        if (!this.canLevelUp(state, godId)) return state;
        const level = this.getLevel(state, godId);
        return {
            ...state,
            gems: state.gems - this.getLevelUpCost(level),
            gods: { ...state.gods, [godId]: level + 1 },
        };
    }

    static equip(state: GameState, slot: 'attack' | 'defense', godId: GodId | null): GameState {
        if (godId && !this.isUnlocked(state, godId)) return state;
        return slot === 'attack' ? { ...state, attackGod: godId } : { ...state, defenseGod: godId };
    }

    static getEffects(godId: GodId | null, level: number): GodEffects {
        if (!godId || level <= 0) return NO_GOD_EFFECTS;
        const g = GameConfig.gods[godId];
        const l = level - 1;
        const e = { ...NO_GOD_EFFECTS };
        if ('attackBonusBase' in g) e.attackBonus = g.attackBonusBase + g.attackBonusPerLevel * l;
        if ('lightningBase' in g) e.lightning = g.lightningBase + g.lightningPerLevel * l;
        if ('healBase' in g) e.heal = g.healBase + g.healPerLevel * l;
        if ('wallBonusBase' in g) e.wallBonus = g.wallBonusBase + g.wallBonusPerLevel * l;
        if ('hpBonusBase' in g) e.hpBonus = g.hpBonusBase + g.hpBonusPerLevel * l;
        if ('critBase' in g) e.critChance = g.critBase + g.critPerLevel * l;
        return e;
    }

    /** Short human-readable summary of what the god does at a level. */
    static describeEffects(godId: GodId, level: number): string[] {
        const e = this.getEffects(godId, Math.max(1, level));
        const pct = (n: number) => `${Math.round(n * 100)}%`;
        const out: string[] = [];
        if (e.attackBonus) out.push(`+${pct(e.attackBonus)} de ataque`);
        if (e.lightning) out.push(`Rayo inicial de ${e.lightning} de daño`);
        if (e.heal) out.push(`Revive ${pct(e.heal)} de las bajas`);
        if (e.wallBonus) out.push(`+${pct(e.wallBonus)} vida de murallas`);
        if (e.hpBonus) out.push(`+${pct(e.hpBonus)} vida de tropas`);
        if (e.critChance) out.push(`${pct(e.critChance)} de golpe crítico`);
        return out;
    }
}
