import { GameConfig } from '../config/GameConfig';

export type AvatarType = 'warrior' | 'mage' | 'archer' | 'paladin' | 'rogue' | 'druid';
export type KingdomType = 'emerald' | 'golden' | 'frost';

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
    troops: {
        infantry: number;
        archers: number;
        cavalry: number;
        mages: number;
        catapults: number;
        healers: number;
    };
    territoryProgress: number; // Index of the highest unlocked territory (0-based)
    
    // Fase 2, 4 y 8: Recompensas, Misiones, Héroe y Prestigio
    chests: number;
    lastDailyReward: number; // Timestamp
    quests: { [id: string]: { progress: number; completed: boolean } };
    heroLevel: number;
    prestigeLevel: number;
    chestsOpened: number;
    battlesWon: number;
    lastSaveTime: number; // Timestamp of last save, used for offline earnings
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
    troops: {
        infantry: 0,
        archers: 0,
        cavalry: 0,
        mages: 0,
        catapults: 0,
        healers: 0
    },
    territoryProgress: 0,
    chests: 1, // Regalamos 1 cofre al inicio
    lastDailyReward: 0,
    quests: {},
    heroLevel: 1,
    prestigeLevel: 0,
    chestsOpened: 0,
    battlesWon: 0,
    lastSaveTime: 0
});
