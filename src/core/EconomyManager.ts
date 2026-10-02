import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { VillageManager } from './VillageManager';
import { TroopUpgradeManager } from './TroopUpgradeManager';

export class EconomyManager {
    static tick(
        state: GameState,
        deltaSeconds: number = GameConfig.tickRateMs / 1000,
        now: number = Date.now()
    ): GameState {
        let newState = { ...state };

        // Energy regeneration logic (Emerald Kingdom regenerates 30% faster)
        const regenTickMs = newState.playerKingdom === 'emerald'
            ? Math.round(GameConfig.energyRegenTickMs * 0.7)
            : GameConfig.energyRegenTickMs;

        if (newState.energy < GameConfig.maxEnergy) {
            const timeSinceLastUpdate = now - (newState.lastEnergyUpdate || now);
            const energyToRecover = Math.floor(timeSinceLastUpdate / regenTickMs);
            
            if (energyToRecover > 0) {
                newState.energy = Math.min(GameConfig.maxEnergy, newState.energy + energyToRecover);
                // Update lastEnergyUpdate leaving the remainder
                newState.lastEnergyUpdate = now - (timeSinceLastUpdate % regenTickMs);
            }
        } else {
            newState.lastEnergyUpdate = now;
        }

        // Gold is produced by the mine according to real elapsed seconds
        if (deltaSeconds > 0) {
            newState = VillageManager.produce(newState, deltaSeconds);
        }

        // Building and troop upgrades finish when timers expire
        newState = VillageManager.completeUpgrades(newState, now);
        newState = TroopUpgradeManager.completeTroopUpgrades(newState, now);

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
