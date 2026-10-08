import type { GameState, TroopId } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { UpgradeManager } from './UpgradeManager';

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
    isUnlocked: boolean;
    unlockRequirementText: string;
    blockerReason: string | null;
    rankTitle: string;
}

const TROOP_UPGRADE_CONFIG: Record<TroopId, { baseCost: number; baseHp: number; baseDps: number; role: string }> = {
    infantry: { baseCost: 150, baseHp: 60, baseDps: 16, role: 'Guerrero de combate cuerpo a cuerpo' },
    archers: { baseCost: 250, baseHp: 30, baseDps: 14, role: 'Tiradores de largo alcance' },
    knight: { baseCost: 300, baseHp: 130, baseDps: 18, role: 'Tanque noble con armadura de placas y mandoble' },
    cavalry: { baseCost: 400, baseHp: 170, baseDps: 20, role: 'Carga veloz a caballo, flanqueo de defensas' },
    mages: { baseCost: 650, baseHp: 45, baseDps: 50, role: 'Unidad voladora con daño de área' },
    catapults: { baseCost: 1000, baseHp: 160, baseDps: 90, role: 'Asedio destructivo contra murallas' },
    healers: { baseCost: 800, baseHp: 80, baseDps: 25, role: 'Sana y acompaña a las tropas aliadas' },
    skeletons: { baseCost: 120, baseHp: 30, baseDps: 18, role: 'Horda ágil de pequeños esqueletos' },
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
        const isUnlocked = UpgradeManager.isTroopUnlocked(state, troopId);
        const unlockRequirementText = UpgradeManager.getUnlockRequirementText(troopId);

        let blockerReason: string | null = null;
        if (!isUnlocked) {
            blockerReason = `🔒 ${unlockRequirementText}`;
        } else if (isMax) {
            blockerReason = currentLevel >= 10 ? 'Nivel máximo alcanzado' : 'Mejora la Herrería o el Ayuntamiento';
        } else if (!canAfford) {
            blockerReason = `Faltan 🪙 ${(cost - state.coins).toLocaleString()} de oro`;
        }

        return {
            id: troopId,
            name: baseInfo.name,
            icon: troopId === 'infantry' ? '⚔️' : troopId === 'archers' ? '🏹' : troopId === 'knight' ? '🛡️' : troopId === 'cavalry' ? '🐎' : troopId === 'mages' ? '🧙' : troopId === 'catapults' ? '💣' : troopId === 'skeletons' ? '💀' : '✨',
            role: config.role,
            level: currentLevel,
            maxLevel,
            currentHp,
            nextHp,
            currentDps,
            nextDps,
            upgradeCost: cost,
            canAfford,
            canUpgrade: isUnlocked && !isMax && canAfford,
            isUnlocked,
            unlockRequirementText,
            blockerReason,
            rankTitle: this.getRankTitle(currentLevel),
        };
    }

    static researchDuration(nextLevel: number): number {
        const table = [0, 45, 120, 300, 900, 1800, 3600, 7200, 14400, 28800];
        return table[Math.min(nextLevel - 1, table.length - 1)] || 60;
    }

    static canUpgrade(state: GameState, troopId: TroopId): boolean {
        if (!UpgradeManager.isTroopUnlocked(state, troopId)) return false;
        if (state.troopUpgradesUntil?.[troopId]) return false;
        const details = this.getTroopDetails(state, troopId);
        return details.canUpgrade;
    }

    static upgradeTroop(state: GameState, troopId: TroopId, now = Date.now()): GameState {
        if (!UpgradeManager.isTroopUnlocked(state, troopId)) return state;
        const details = this.getTroopDetails(state, troopId);
        if (!details.canUpgrade || state.troopUpgradesUntil?.[troopId]) return state;

        const nextCoins = state.coins - details.upgradeCost;
        const currentLevels = { ...(state.troopLevels || {}) };
        const nextLevel = (currentLevels[troopId] || 1) + 1;
        const durationSec = this.researchDuration(nextLevel);
        const until = now + durationSec * 1000;

        return {
            ...state,
            coins: nextCoins,
            troopUpgradesUntil: {
                ...(state.troopUpgradesUntil || {}),
                [troopId]: until,
            },
        };
    }

    static finishTroopWithGems(state: GameState, troopId: TroopId, now = Date.now()): GameState {
        const until = state.troopUpgradesUntil?.[troopId];
        if (!until || until <= now) return state;
        const cost = Math.max(1, Math.ceil((until - now) / 60000));
        if (state.gems < cost) return state;

        const currentLevels = { ...(state.troopLevels || {}) };
        const nextLevel = (currentLevels[troopId] || 1) + 1;
        const nextUpgradesUntil = { ...(state.troopUpgradesUntil || {}) };
        delete nextUpgradesUntil[troopId];

        return {
            ...state,
            gems: state.gems - cost,
            troopLevels: {
                ...currentLevels,
                [troopId]: nextLevel,
            },
            troopUpgradesUntil: nextUpgradesUntil,
        };
    }

    static completeTroopUpgrades(state: GameState, now = Date.now()): GameState {
        if (!state.troopUpgradesUntil) return state;
        let changed = false;
        const newUpgradesUntil = { ...state.troopUpgradesUntil };
        const newLevels = { ...(state.troopLevels || {}) };

        for (const [idStr, until] of Object.entries(newUpgradesUntil)) {
            const id = idStr as TroopId;
            if (until && until <= now) {
                newLevels[id] = (newLevels[id] || 1) + 1;
                delete newUpgradesUntil[id];
                changed = true;
            }
        }

        if (!changed) return state;
        return {
            ...state,
            troopLevels: newLevels,
            troopUpgradesUntil: newUpgradesUntil,
        };
    }
}
