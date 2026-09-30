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
        // The altar in the village shows the hero's level
        newState.village = newState.village.map(b => (b.type === 'altar' ? { ...b, level: newState.heroLevel } : b));

        return newState;
    }
}
