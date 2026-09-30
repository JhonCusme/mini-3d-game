import { GameConfig } from '../config/GameConfig';
import type { BuildingType } from '../config/BuildingsConfig';

export type AvatarType = 'warrior' | 'mage' | 'archer' | 'paladin' | 'rogue' | 'druid';
export type KingdomType = 'emerald' | 'golden' | 'frost';
export type TroopId = keyof typeof GameConfig.troops;
export type TroopCounts = Record<TroopId, number>;
export type GodId = keyof typeof GameConfig.gods;

export interface PlacedBuilding {
    uid: string;
    type: BuildingType;
    level: number;          // 0 = still under construction
    x: number;              // tile coordinates of the top-left corner
    z: number;
    upgradingUntil: number; // timestamp, 0 when idle
    stored: number;         // gold waiting to be collected (gold mine)
}

export interface DefenseLogEntry {
    id: string;
    attackerName: string;
    attackerTrophies: number;
    won: boolean;          // true = the defender (you) won
    coinsLost: number;
    trophiesDelta: number;
    garrisonLost: Partial<TroopCounts>;
    timestamp: number;
    seen: boolean;
}

export interface GameState {
    // Character creation
    hasCompletedSetup: boolean;
    playerName: string;
    playerAvatar: AvatarType;
    playerKingdom: KingdomType;

    coins: number;
    gems: number;
    energy: number;
    lastEnergyUpdate: number;
    experience: number;
    level: number;
    upgrades: { [id: string]: number };
    troops: TroopCounts;
    territoryProgress: number; // Index of the highest unlocked territory (0-based)
    
    // Fase 2, 4 y 8: Recompensas, Misiones, Héroe y Prestigio
    chests: number;
    lastDailyReward: number; // Timestamp
    quests: { [id: string]: { progress: number; completed: boolean } };
    heroLevel: number;
    prestigeLevel: number;
    chestsOpened: number;
    battlesWon: number;
    lastSaveTime: number; // Timestamp of last save, used for offline production

    // Online PvP
    playerId: string;
    trophies: number;
    pvpWins: number;
    pvpLosses: number;
    garrison: TroopCounts;          // troops left home to defend the village
    gods: Partial<Record<GodId, number>>; // unlocked gods and their level
    attackGod: GodId | null;
    defenseGod: GodId | null;
    shieldUntil: number;
    defenseLog: DefenseLogEntry[];
    lastDefenseCheck: number;

    // Village layout (Clash-style base building)
    village: PlacedBuilding[];
    builders: number;
}

export const getInitialState = (): GameState => ({
    hasCompletedSetup: false,
    playerName: '',
    playerAvatar: 'warrior',
    playerKingdom: 'emerald',

    coins: GameConfig.startingCoins,
    gems: GameConfig.startingGems,
    energy: GameConfig.maxEnergy,
    lastEnergyUpdate: Date.now(),
    experience: 0,
    level: 1,
    upgrades: {
        economy: 0,
        troopCapacity: 0,
        attackPower: 0
    },
    troops: emptyTroops(),
    territoryProgress: 0,
    chests: 1, // Regalamos 1 cofre al inicio
    lastDailyReward: 0,
    quests: {},
    heroLevel: 1,
    prestigeLevel: 0,
    chestsOpened: 0,
    battlesWon: 0,
    lastSaveTime: 0,

    playerId: '',
    trophies: GameConfig.pvp.startingTrophies,
    pvpWins: 0,
    pvpLosses: 0,
    garrison: emptyTroops(),
    gods: {},
    attackGod: null,
    defenseGod: null,
    shieldUntil: 0,
    defenseLog: [],
    lastDefenseCheck: 0,

    village: [],
    builders: 2
});

export function emptyTroops(): TroopCounts {
    return { infantry: 0, archers: 0, cavalry: 0, mages: 0, catapults: 0, healers: 0 };
}

export function newPlayerId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
