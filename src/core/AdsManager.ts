import type { GameState } from './GameState';

export class AdsManager {
    // Simulated delay for ad watching
    static async watchAd(): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate 90% success rate of watching full ad
                resolve(Math.random() > 0.1);
            }, 3000);
        });
    }

    static getAdReward(state: GameState, type: 'coins' | 'gems' | 'energy'): GameState {
        let newState = { ...state };
        
        switch (type) {
            case 'coins':
                newState.coins += 200;
                break;
            case 'gems':
                newState.gems += 5;
                break;
            case 'energy':
                newState.energy += 5;
                break;
        }

        return newState;
    }
}
