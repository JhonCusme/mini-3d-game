import type { GameState } from './GameState';

export class IAPManager {
    static async purchasePackage(_packageId: string): Promise<boolean> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate native payment flow success
                resolve(true);
            }, 2000);
        });
    }

    static applyPurchase(state: GameState, packageId: string): GameState {
        let newState = { ...state };
        
        switch (packageId) {
            case 'starter_pack':
                newState.coins += 5000;
                newState.gems += 100;
                newState.chests += 5;
                break;
            case 'gems_small':
                newState.gems += 50;
                break;
            case 'gems_large':
                newState.gems += 500;
                break;
        }

        return newState;
    }
}
