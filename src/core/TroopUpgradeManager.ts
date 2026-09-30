import type { GameState, TroopId } from './GameState';
import { GameConfig } from '../config/GameConfig';

export interface TroopDetails {
    id: TroopId;
    name: string;
    icon: string;
    role: string;
    level: number;
    maxLevel: number;
    currentHp: number;
    nextHp: number;
    currentDps: number;
    nextDps: number;
    upgradeCost: number;
    canAfford: boolean;
    canUpgrade: boolean;
    blockerReason: string | null;
    rankTitle: string;
}

const TROOP_UPGRADE_CONFIG: Record<TroopId, { baseCost: number; baseHp: number; baseDps: number; role: string }> = {
    infantry: { baseCost: 150, baseHp: 60, baseDps: 16, role: 'Guerrero de combate cuerpo a cuerpo' },
    archers: { baseCost: 250, baseHp: 30, baseDps: 14, role: 'Tiradores de largo alcance' },
    cavalry: { baseCost: 400, baseHp: 170, baseDps: 20, role: 'Veloz, prioriza defensas enemigas' },
    mages: { baseCost: 650, baseHp: 45, baseDps: 50, role: 'Unidad voladora con daño de área' },
    catapults: { baseCost: 1000, baseHp: 160, baseDps: 90, role: 'Asedio destructivo contra murallas' },
    healers: { baseCost: 800, baseHp: 80, baseDps: 25, role: 'Sana y acompaña a las tropas aliadas' },
};

const RANK_TITLES = ['Recluta', 'Veterano', 'Élite', 'Campeón', 'Maestro', 'Gran Mariscal', 'Mítico'];

export class TroopUpgradeManager {
    static getRankTitle(level: number): string {
        const idx = Math.min(Math.max(0, level - 1), RANK_TITLES.length - 1);
        return RANK_TITLES[idx];
    }

    static getMaxLevel(state: GameState): number {
        // Limited by Blacksmith level or Town Hall level (minimum 3, max 10)
        const blacksmithLevel = (state.upgrades.attackPower || 0) + 1;
        const townhallLevel = state.level || 1;
        return Math.max(2, Math.min(10, Math.max(blacksmithLevel, townhallLevel)));
    }

    static getUpgradeCost(troopId: TroopId, currentLevel: number): number {
        const base = TROOP_UPGRADE_CONFIG[troopId]?.baseCost || 200;
        return Math.round(base * Math.pow(1.6, currentLevel - 1));
    }

    static getStatMultiplier(level: number): number {
        return 1 + (level - 1) * 0.22; // +22% HP and DPS per level
    }

    static getTroopDetails(state: GameState, troopId: TroopId): TroopDetails {
        const levels = state.troopLevels || {};
        const currentLevel = levels[troopId] || 1;
        const maxLevel = this.getMaxLevel(state);
        const config = TROOP_UPGRADE_CONFIG[troopId];
        const baseInfo = GameConfig.troops[troopId];

        const mult = this.getStatMultiplier(currentLevel);
        const nextMult = this.getStatMultiplier(currentLevel + 1);

        const currentHp = Math.round(config.baseHp * mult);
        const nextHp = Math.round(config.baseHp * nextMult);
        const currentDps = Math.round(config.baseDps * mult);
        const nextDps = Math.round(config.baseDps * nextMult);

        const cost = this.getUpgradeCost(troopId, currentLevel);
        const canAfford = state.coins >= cost;
        const isMax = currentLevel >= maxLevel;

        let blockerReason: string | null = null;
        if (isMax) {
            blockerReason = currentLevel >= 10 ? 'Nivel máximo alcanzado' : 'Mejora la Herrería o el Ayuntamiento';
        } else if (!canAfford) {
            blockerReason = `Faltan 🪙 ${(cost - state.coins).toLocaleString()} de oro`;
        }

        return {
            id: troopId,
            name: baseInfo.name,
            icon: troopId === 'infantry' ? '⚔️' : troopId === 'archers' ? '🏹' : troopId === 'cavalry' ? '🐎' : troopId === 'mages' ? '🧙' : troopId === 'catapults' ? '💣' : '✨',
            role: config.role,
            level: currentLevel,
            maxLevel,
            currentHp,
            nextHp,
            currentDps,
            nextDps,
            upgradeCost: cost,
            canAfford,
            canUpgrade: !isMax && canAfford,
            blockerReason,
            rankTitle: this.getRankTitle(currentLevel),
        };
    }

    static canUpgrade(state: GameState, troopId: TroopId): boolean {
        const details = this.getTroopDetails(state, troopId);
        return details.canUpgrade;
    }

    static upgradeTroop(state: GameState, troopId: TroopId): GameState {
        const details = this.getTroopDetails(state, troopId);
        if (!details.canUpgrade) return state;

        const nextCoins = state.coins - details.upgradeCost;
        const currentLevels = { ...(state.troopLevels || {}) };
        const nextLevel = (currentLevels[troopId] || 1) + 1;

        return {
            ...state,
            coins: nextCoins,
            troopLevels: {
                ...currentLevels,
                [troopId]: nextLevel,
            },
        };
    }
}
