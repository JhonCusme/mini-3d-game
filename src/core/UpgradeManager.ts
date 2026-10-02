import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { EconomyManager } from './EconomyManager';

export class UpgradeManager {
    static getCost(upgradeId: keyof typeof GameConfig.upgrades, currentLevel: number): number {
        const config = GameConfig.upgrades[upgradeId];
        return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel));
    }

    static purchase(state: GameState, upgradeId: keyof typeof GameConfig.upgrades): GameState {
        const currentLevel = state.upgrades[upgradeId] || 0;
        const cost = this.getCost(upgradeId, currentLevel);

        if (EconomyManager.canAfford(state, cost, 'coins')) {
            let newState = EconomyManager.spend(state, cost, 'coins');
            newState = {
                ...newState,
                upgrades: {
                    ...newState.upgrades,
                    [upgradeId]: currentLevel + 1
                }
            };
            return newState;
        }
        return state;
    }

    static getTroopCapacity(state: GameState): number {
        const capacityLevel = state.upgrades.troopCapacity || 0;
        const config = GameConfig.upgrades.troopCapacity;
        return 10 + Math.floor(capacityLevel * config.effectBase * config.effectMultiplier); // Base capacity is 10
    }

    static isTroopUnlocked(state: GameState, troopId: keyof typeof GameConfig.troops): boolean {
        const config = GameConfig.troops[troopId] as { unlockTerritory?: number; unlockBarracksLevel?: number };
        if (!config) return true;
        const barracksLevel = (state.upgrades.troopCapacity || 0) + 1;
        const territoryUnlocked = state.territoryProgress >= (config.unlockTerritory ?? 0);
        const barracksUnlocked = barracksLevel >= (config.unlockBarracksLevel ?? 1);
        return territoryUnlocked || barracksUnlocked;
    }

    static getUnlockRequirementText(troopId: keyof typeof GameConfig.troops): string {
        const config = GameConfig.troops[troopId] as { unlockTerritory?: number; unlockBarracksLevel?: number };
        if (!config || (config.unlockTerritory ?? 0) === 0) return 'Disponible al inicio';
        return `Conquista Territorio ${(config.unlockTerritory ?? 0) + 1} o Cuartel Nv.${config.unlockBarracksLevel ?? 1}`;
    }

    static trainTroop(state: GameState, troopId: keyof typeof GameConfig.troops): GameState {
        if (!this.isTroopUnlocked(state, troopId)) {
            return state;
        }

        const currentTotalTroops = Object.values(state.troops).reduce((a, b) => a + b, 0)
            + Object.values(state.garrison || {}).reduce((a, b) => a + b, 0);
        const maxCapacity = this.getTroopCapacity(state);

        if (currentTotalTroops >= maxCapacity) {
            return state; // Reached max capacity
        }

        const cost = GameConfig.troops[troopId].cost;
        if (EconomyManager.canAfford(state, cost, 'coins')) {
            let newState = EconomyManager.spend(state, cost, 'coins');
            newState = {
                ...newState,
                troops: {
                    ...newState.troops,
                    [troopId]: (newState.troops[troopId] || 0) + 1
                }
            };
            return newState;
        }

        return state;
    }
}
