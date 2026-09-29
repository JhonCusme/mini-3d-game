import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';

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

        // Generate passive coins
        const economyLevel = newState.upgrades.economy || 0;
        const upgradeConfig = GameConfig.upgrades.economy;
        // Total passive coins = base + (level * effectBase * multiplier)
        let coinGain = GameConfig.coinsPerTick;
        if (economyLevel > 0) {
            coinGain += (economyLevel * upgradeConfig.effectBase) * upgradeConfig.effectMultiplier;
        }
        
        newState.coins += coinGain;

        return newState;
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
