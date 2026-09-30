import { GameConfig } from '../../config/GameConfig';
import type { PvpBattleResult } from './PvpTypes';

export interface PvpOutcome {
    coinsStolen: number;
    attackerTrophiesDelta: number;
    defenderTrophiesDelta: number;
}

/** Loot and trophy changes for both players after a battle. */
export function computeOutcome(
    result: PvpBattleResult,
    attackerTrophies: number,
    defenderTrophies: number,
    lootableCoins: number,
): PvpOutcome {
    const cfg = GameConfig.pvp;
    // Beating a stronger rival is worth more, bullying a weaker one less
    const factor = Math.max(0.5, Math.min(1.5, 1 + (defenderTrophies - attackerTrophies) / 400));

    if (result.won) {
        const gain = Math.round(cfg.trophiesWin * factor * (0.6 + 0.2 * result.stars));
        return {
            coinsStolen: Math.floor(lootableCoins * result.stars / 3),
            attackerTrophiesDelta: gain,
            defenderTrophiesDelta: -Math.min(defenderTrophies, Math.round(gain * 0.8)),
        };
    }
    return {
        coinsStolen: 0,
        attackerTrophiesDelta: -Math.min(attackerTrophies, Math.round(cfg.trophiesLoss / factor)),
        defenderTrophiesDelta: Math.round(cfg.trophiesDefenseWin * factor),
    };
}

/** How many coins of a village can be stolen in a raid. */
export function lootableCoins(coins: number, level: number): number {
    return Math.floor(Math.min(coins * GameConfig.pvp.lootPercent, Math.max(1, level) * GameConfig.pvp.lootCapPerLevel));
}

export function leagueFor(trophies: number): { name: string; icon: string } {
    if (trophies >= 2000) return { name: 'Leyenda', icon: '👑' };
    if (trophies >= 1200) return { name: 'Diamante', icon: '💎' };
    if (trophies >= 700) return { name: 'Oro', icon: '🥇' };
    if (trophies >= 350) return { name: 'Plata', icon: '🥈' };
    return { name: 'Bronce', icon: '🥉' };
}
