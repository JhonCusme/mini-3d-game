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

    static heroStats(level: number) {
        const lvl = Math.max(1, level);
        return {
            hp: 850 + (lvl - 1) * 280,
            dps: 110 + (lvl - 1) * 36,
            speed: 1.85,
            range: 1.15,
            cleaveRadius: 1.4,
            name: `Gran Rey Nv.${lvl}`,
        };
    }

    /** Active combat ability details for the King Champion. */
    static heroAbilityStats(level: number) {
        const lvl = Math.max(1, level);
        return {
            name: '¡Furia Real!',
            healPercent: 0.35,
            dpsBonusPercent: 0.80 + (lvl - 1) * 0.05,
            speedBonusPercent: 0.45,
            duration: 8,
            guardsCount: Math.min(5, 3 + Math.floor((lvl - 1) / 3)),
            description: `Restaura 35% de Vida, aumenta DPS (+${Math.round(80 + (lvl - 1) * 5)}%) y velocidad (+45%) por 8s, e invoca ${Math.min(5, 3 + Math.floor((lvl - 1) / 3))} Guardias Reales.`,
        };
    }

    /** Seconds required for the Hero to recover from defeat in battle (scales with level). */
    static heroRecoveryDuration(level: number): number {
        const lvl = Math.max(1, level);
        return Math.min(900, 60 + lvl * 30); // Nv 1: 90s, Nv 2: 120s, Nv 3: 150s, Nv 5: 210s
    }

    static isHeroRecovering(state: GameState, now = Date.now()): boolean {
        return (state.heroRecoveringUntil || 0) > now;
    }

    static heroRecoveryTimeLeft(state: GameState, now = Date.now()): number {
        return Math.max(0, (state.heroRecoveringUntil || 0) - now);
    }

    static healCostGems(state: GameState, now = Date.now()): number {
        const ms = this.heroRecoveryTimeLeft(state, now);
        if (ms <= 0) return 0;
        return Math.max(1, Math.ceil(ms / 60000) * 2);
    }

    static healHeroWithGems(state: GameState): GameState {
        const cost = this.healCostGems(state);
        if (cost <= 0 || state.gems < cost) return state;
        return {
            ...state,
            gems: state.gems - cost,
            heroRecoveringUntil: 0,
        };
    }

    static setHeroFallen(state: GameState): GameState {
        const durationSec = this.heroRecoveryDuration(state.heroLevel);
        return {
            ...state,
            heroRecoveringUntil: Date.now() + durationSec * 1000,
        };
    }
}
