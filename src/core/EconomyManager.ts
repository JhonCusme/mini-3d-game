import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';

export class EconomyManager {
    static getCoinsPerTick(state: GameState): number {
        const economyLevel = state.upgrades.economy || 0;
        const upgradeConfig = GameConfig.upgrades.economy;
        let coinGain = GameConfig.coinsPerTick;
        if (economyLevel > 0) {
            coinGain += (economyLevel * upgradeConfig.effectBase) * upgradeConfig.effectMultiplier;
        }
        return coinGain;
    }

    /** Coins earned while the app was closed (50% rate, capped at 8h). */
    static getOfflineEarnings(state: GameState, now: number = Date.now()): number {
        if (!state.lastSaveTime) return 0;
        const elapsedMs = Math.min(now - state.lastSaveTime, 8 * 3600 * 1000);
        if (elapsedMs < 60000) return 0;
        const ticks = Math.floor(elapsedMs / GameConfig.tickRateMs);
        return Math.floor(ticks * this.getCoinsPerTick(state) * 0.5);
    }

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
        newState.coins += this.getCoinsPerTick(newState);

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
