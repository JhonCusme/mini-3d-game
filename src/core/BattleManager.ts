import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';

export interface BattleResult {
    won: boolean;
    newState: GameState;
    bajas: { [key: string]: number };
    coinsEarned: number;
    expEarned: number;
    crit: boolean;
}

export class BattleManager {
    static getPlayerPower(state: GameState): number {
        let basePower = 0;
        
        for (const [troopId, amount] of Object.entries(state.troops)) {
            const config = GameConfig.troops[troopId as keyof typeof GameConfig.troops];
            if (config) {
                basePower += config.power * amount;
            }
        }

        // Apply hero multiplier
        const heroMultiplier = 1 + ((state.heroLevel - 1) * GameConfig.heroPowerMultiplierPerLevel);
        basePower *= heroMultiplier;

        // Apply global upgrades (e.g., Attack Power)
        const attackUpgradeLvl = state.upgrades.attackPower || 0;
        const attackBonus = attackUpgradeLvl > 0 ? 
            (GameConfig.upgrades.attackPower.effectBase * Math.pow(GameConfig.upgrades.attackPower.effectMultiplier, attackUpgradeLvl - 1)) : 0;
        
        return basePower * (1 + (attackBonus / 100));
    }

    static getCritChance(state: GameState): number {
        const lvl = state.upgrades.critRate || 0;
        const cfg = GameConfig.upgrades.critRate;
        return Math.min(50, lvl * cfg.effectBase * cfg.effectMultiplier) / 100;
    }

    static calculateBattle(state: GameState, territoryIndex: number, rng: () => number = Math.random): BattleResult | null {
        const territory = GameConfig.territories[territoryIndex];
        if (!territory) return null;

        // Check energy
        if (state.energy < territory.energyCost) return null;

        let playerPower = this.getPlayerPower(state);
        const enemyPower = territory.enemyPower;
        
        // --- BOSS TRAITS ---
        if (territory.isBoss && territory.bossTrait) {
            if (territory.bossTrait === 'magic_shield') {
                if (state.troops.mages < 10) {
                    playerPower *= 0.5; // Reduce power by 50% if not enough mages
                }
            } else if (territory.bossTrait === 'thick_armor') {
                if (state.troops.catapults < 5) {
                    playerPower *= 0.7; // Reduce power if no catapults
                }
            }
        }

        // Critical hit: double damage
        const crit = rng() < this.getCritChance(state);
        if (crit) playerPower *= 2;

        const won = playerPower >= enemyPower;
        let coinsEarned = 0;
        let expEarned = 0;
        const bajas: { [key: string]: number } = {};

        if (won) {
            coinsEarned = territory.rewardCoins;
            expEarned = territory.rewardExp;
        }

        // --- CASUALTIES CALCULATION ---
        let baseCasualtyRate = won ? 0.1 : 0.3; // 10% on win, 30% on loss

        // Boss Trait: dragon_fire increases casualties
        if (territory.isBoss && territory.bossTrait === 'dragon_fire') {
            baseCasualtyRate += 0.2; // +20% casualties
        }

        // Healers reduce casualties
        const healerCount = state.troops.healers || 0;
        // Each healer reduces casualty rate by 0.5%, max 50% reduction
        const healerReduction = Math.min(0.5, (healerCount * 0.5) / 100);
        baseCasualtyRate = Math.max(0, baseCasualtyRate - (baseCasualtyRate * healerReduction));

        // Troop Health Upgrade reduces casualties
        const hpUpgradeLvl = state.upgrades.troopHealth || 0;
        if (hpUpgradeLvl > 0) {
            const hpBonus = (GameConfig.upgrades.troopHealth.effectBase * Math.pow(GameConfig.upgrades.troopHealth.effectMultiplier, hpUpgradeLvl - 1)) / 100;
            baseCasualtyRate = Math.max(0, baseCasualtyRate - hpBonus);
        }

        let newState = { ...state };
        newState.energy -= territory.energyCost;

        // Apply casualties
        for (const [troopId, amount] of Object.entries(state.troops)) {
            if (amount > 0) {
                const losses = Math.floor(amount * baseCasualtyRate);
                bajas[troopId] = losses;
                newState.troops = {
                    ...newState.troops,
                    [troopId]: amount - losses
                };
            }
        }

        if (won) {
            const prestigeMultiplier = 1 + (state.prestigeLevel * 0.5); // +50% per prestige level
            newState.battlesWon = (newState.battlesWon || 0) + 1;
            newState.coins += Math.floor(coinsEarned * prestigeMultiplier);
            newState.experience += Math.floor(expEarned * prestigeMultiplier);
            
            // Advance progress if fighting the max unlocked territory
            if (territoryIndex === newState.territoryProgress && territoryIndex < GameConfig.territories.length) {
                newState.territoryProgress += 1;
            }
        }

        return {
            won,
            newState,
            bajas,
            coinsEarned,
            expEarned,
            crit
        };
    }
}
