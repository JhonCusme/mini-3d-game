import type { AvatarType, GodId, KingdomType, TroopCounts, TroopId } from '../GameState';
import type { BuildingType } from '../../config/BuildingsConfig';

/** A building as seen by attackers (position in tiles, top-left corner). */
export interface LayoutBuilding {
    type: BuildingType;
    level: number;
    x: number;
    z: number;
}

/** What a player leaves prepared at home. Other players attack this snapshot. */
export interface VillageSnapshot {
    playerId: string;
    name: string;
    avatar: AvatarType;
    kingdom: KingdomType;
    level: number;
    heroLevel: number;
    trophies: number;
    garrison: TroopCounts;
    defenseGod: GodId | null;
    defenseGodLevel: number;
    wallsLevel: number;
    armorLevel: number;   // troopHealth upgrade
    attackLevel: number;  // attackPower upgrade
    lootableCoins: number;
    shieldUntil: number;
    updatedAt: number;
    userId?: string;
    isBot?: boolean;
    isSystemVillage?: boolean;
    underAttackUntil?: number;
    onlineUntil?: number;
    layout?: LayoutBuilding[];
}

/** The army a player sends to attack. */
export interface AttackArmy {
    troops: TroopCounts;
    god: GodId | null;
    godLevel: number;
    heroLevel: number;
    attackLevel: number;
    armorLevel: number;
    critLevel: number;
    kingdom?: KingdomType;
    troopLevels?: Record<TroopId, number>;
    heroAvailable?: boolean;
}

export interface BattleRound {
    round: number;
    attackerDamage: number;
    defenderDamage: number;
    attackerCrit: boolean;
    defenderCrit: boolean;
    wallHp: number;
    attackerHp: number;
    defenderHp: number;
    events: string[];
}

export interface PvpBattleResult {
    won: boolean;           // from the attacker's point of view
    stars: number;          // 0-3
    destruction: number;    // 0-1
    rounds: BattleRound[];
    wallMaxHp: number;
    attackerMaxHp: number;
    defenderMaxHp: number;
    attackerLosses: TroopCounts;
    defenderLosses: TroopCounts;
    heroDied?: boolean;
    heroDeployed?: boolean;
    seed: number;
}

/** Stored so the defender can see what happened when they come back. */
export interface AttackRecord {
    id: string;
    attackerId: string;
    attackerName: string;
    attackerTrophies: number;
    defenderId: string;
    attackerWon: boolean;
    stars: number;
    coinsStolen: number;
    defenderTrophiesDelta: number;
    defenderLosses: TroopCounts;
    createdAt: number;
}
