import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';

export class HeroManager {
    static getUpgradeCost(level: number): number {
        return Math.floor(GameConfig.heroBaseUpgradeCostGems * Math.pow(1.5, level - 1));
    }

    static canUpgradeHero(state: GameState): boolean {
        return state.gems >= this.getUpgradeCost(state.heroLevel);
    }

    static upgradeHero(state: GameState): GameState {
        if (!this.canUpgradeHero(state)) return state;

        const cost = this.getUpgradeCost(state.heroLevel);
        
        let newState = { ...state };
        newState.gems -= cost;
        newState.heroLevel += 1;

        return newState;
    }
}
