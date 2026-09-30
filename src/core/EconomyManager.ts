import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { VillageManager } from './VillageManager';

export class EconomyManager {
    static tick(state: GameState): GameState {
        const newState = { ...state };

        // Energy regeneration logic
        if (newState.energy < GameConfig.maxEnergy) {
            const timeSinceLastUpdate = Date.now() - (newState.lastEnergyUpdate || Date.now());
            const energyToRecover = Math.floor(timeSinceLastUpdate / GameConfig.energyRegenTickMs);
            
            if (energyToRecover > 0) {
                newState.energy = Math.min(GameConfig.maxEnergy, newState.energy + energyToRecover);
                // Update lastEnergyUpdate leaving the remainder
                newState.lastEnergyUpdate = Date.now() - (timeSinceLastUpdate % GameConfig.energyRegenTickMs);
            }
        } else {
            newState.lastEnergyUpdate = Date.now();
        }

        // Gold is produced by the mine and collected by tapping it
        return VillageManager.completeUpgrades(VillageManager.produce(newState, GameConfig.tickRateMs / 1000));
    }

    static canAfford(state: GameState, cost: number, currency: 'coins' | 'gems' = 'coins'): boolean {
        return state[currency] >= cost;
    }

    static spend(state: GameState, cost: number, currency: 'coins' | 'gems' = 'coins'): GameState {
        if (!this.canAfford(state, cost, currency)) return state;
        return {
            ...state,
            [currency]: state[currency] - cost
        };
    }
}
