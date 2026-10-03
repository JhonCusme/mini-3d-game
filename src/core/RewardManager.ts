import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { VillageManager } from './VillageManager';

export class RewardManager {
    static openChest(state: GameState): GameState {
        if (state.chests <= 0) return state;

        let newState = { ...state };
        newState.chests -= 1;
        newState.chestsOpened = (newState.chestsOpened || 0) + 1;

        // RNG for rewards
        const random = Math.random();
        
        let coinsToAdd = Math.floor(Math.random() * 200) + 50; // 50 to 250
        let gemsToAdd = 0;
        let energyToAdd = 0;

        // 30% chance of gems
        if (random < 0.3) {
            gemsToAdd = Math.floor(Math.random() * 5) + 1; // 1 to 5
        }
        // 40% chance of energy
        else if (random < 0.7) {
            energyToAdd = Math.floor(Math.random() * 5) + 1;
        }

        const maxGold = VillageManager.maxGoldCapacity(newState);
        newState.coins = Math.min(maxGold, newState.coins + coinsToAdd);
        newState.gems += gemsToAdd;
        newState.energy = Math.min(GameConfig.maxEnergy, newState.energy + energyToAdd);

        return newState;
    }

    static canClaimDailyReward(state: GameState): boolean {
        const now = Date.now();
        const ONE_DAY = 24 * 60 * 60 * 1000;
        return (now - state.lastDailyReward) >= ONE_DAY;
    }

    static claimDailyReward(state: GameState): GameState {
        if (!this.canClaimDailyReward(state)) return state;

        let newState = { ...state };
        newState.lastDailyReward = Date.now();
        const maxGold = VillageManager.maxGoldCapacity(newState);
        newState.coins = Math.min(maxGold, newState.coins + 500);
        newState.gems += 10;
        newState.energy = GameConfig.maxEnergy; // Full energy refill

        return newState;
    }
}
