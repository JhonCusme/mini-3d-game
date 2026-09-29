import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type GameState, type AvatarType, type KingdomType, getInitialState } from './GameState';
import { SaveManager } from './SaveManager';
import { GameConfig } from '../config/GameConfig';
import { EconomyManager } from './EconomyManager';
import { UpgradeManager } from './UpgradeManager';
import { BattleManager, type BattleResult } from './BattleManager';
import { QuestManager } from './QuestManager';
import { RewardManager } from './RewardManager';
import { AdsManager } from './AdsManager';
import { IAPManager } from './IAPManager';
import { AudioManager } from './AudioManager';
import { AnalyticsManager } from './AnalyticsManager';
import { HeroManager } from './HeroManager';

interface GameContextType {
    state: GameState;
    completeSetup: (name: string, avatar: AvatarType, kingdom: KingdomType) => void;
    purchaseUpgrade: (upgradeId: keyof typeof GameConfig.upgrades) => void;
    trainTroop: (troopId: keyof typeof GameConfig.troops) => void;
    fightTerritory: (territoryIndex: number) => BattleResult | null;
    claimQuest: (questId: string) => void;
    openChest: () => void;
    claimDailyReward: () => void;
    watchAdForReward: (type: 'coins' | 'gems' | 'energy') => Promise<boolean>;
    buyIAP: (packageId: string) => Promise<boolean>;
    upgradeHero: () => void;
    prestigeAscension: () => void;
    toggleMute: () => boolean;
    resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<GameState>(() => {
        const loaded = SaveManager.load();
        if (loaded._isFirstOpen) {
            AnalyticsManager.trackFirstOpen();
            delete loaded._isFirstOpen;
        }
        return loaded as GameState;
    });

    useEffect(() => {
        AnalyticsManager.trackSessionStart();
        const start = Date.now();
        return () => {
            AnalyticsManager.trackSessionEnd(Math.floor((Date.now() - start) / 1000));
        };
    }, []);

    // Game Loop
    useEffect(() => {
        const intervalId = setInterval(() => {
            setState((prev) => {
                let next = EconomyManager.tick(prev);
                next = QuestManager.checkQuests(next);
                SaveManager.save(next); // Auto-save on tick
                return next;
            });
        }, GameConfig.tickRateMs);

        return () => clearInterval(intervalId);
    }, []);

    const completeSetup = (name: string, avatar: AvatarType, kingdom: KingdomType) => {
        AudioManager.playVictory();
        setState((prev) => {
            const next = { ...prev, hasCompletedSetup: true, playerName: name, playerAvatar: avatar, playerKingdom: kingdom };
            SaveManager.save(next);
            return next;
        });
    };

    const purchaseUpgrade = (upgradeId: keyof typeof GameConfig.upgrades) => {
        AudioManager.playClick();
        setState((prev) => {
            const next = UpgradeManager.purchase(prev, upgradeId);
            if (next.upgrades[upgradeId] !== prev.upgrades[upgradeId]) {
                AnalyticsManager.trackUpgradePurchase(upgradeId, next.upgrades[upgradeId]);
            }
            SaveManager.save(next);
            return next;
        });
    };

    const trainTroop = (troopId: keyof typeof GameConfig.troops) => {
        AudioManager.playClick();
        setState((prev) => {
            const next = UpgradeManager.trainTroop(prev, troopId);
            SaveManager.save(next);
            return next;
        });
    };

    const fightTerritory = (territoryIndex: number): BattleResult | null => {
        AudioManager.playClick();
        let result: BattleResult | null = null;
        setState((prev) => {
            const playerPower = BattleManager.getPlayerPower(prev);
            const enemyPower = GameConfig.territories[territoryIndex].enemyPower;
            AnalyticsManager.trackBattle('start', `t_${territoryIndex}`, playerPower, enemyPower);
            
            result = BattleManager.calculateBattle(prev, territoryIndex);
            if (result) {
                AnalyticsManager.trackBattle(result.won ? 'win' : 'loss', `t_${territoryIndex}`, playerPower, enemyPower);
                
                if (result.won) {
                    AudioManager.playVictory();
                    if (result.newState.territoryProgress > prev.territoryProgress) {
                        AnalyticsManager.trackTerritoryUnlocked(`t_${result.newState.territoryProgress}`);
                    }
                }
                
                const next = QuestManager.checkQuests(result.newState);
                SaveManager.save(next);
                return next;
            }
            return prev;
        });
        return result;
    };

    const claimQuest = (questId: string) => {
        AudioManager.playClick();
        setState((prev) => {
            const next = QuestManager.claimQuest(prev, questId);
            SaveManager.save(next);
            return next;
        });
    };

    const openChest = () => {
        AudioManager.playClick();
        setState((prev) => {
            let next = RewardManager.openChest(prev);
            next = QuestManager.checkQuests(next);
            SaveManager.save(next);
            return next;
        });
    };

    const claimDailyReward = () => {
        AudioManager.playClick();
        setState((prev) => {
            const next = RewardManager.claimDailyReward(prev);
            if (next.lastDailyReward !== prev.lastDailyReward) {
                AnalyticsManager.trackDailyRewardClaimed();
            }
            SaveManager.save(next);
            return next;
        });
    };

    const watchAdForReward = async (type: 'coins' | 'gems' | 'energy') => {
        AudioManager.playClick();
        AnalyticsManager.trackAd('started', type);
        const success = await AdsManager.watchAd();
        if (success) {
            AnalyticsManager.trackAd('completed', type);
            setState((prev) => {
                const next = AdsManager.getAdReward(prev, type);
                SaveManager.save(next);
                return next;
            });
        }
        return success;
    };

    const buyIAP = async (packageId: string) => {
        AudioManager.playClick();
        AnalyticsManager.trackIAP('started', packageId);
        const success = await IAPManager.purchasePackage(packageId);
        if (success) {
            AnalyticsManager.trackIAP('completed', packageId);
            setState((prev) => {
                const next = IAPManager.applyPurchase(prev, packageId);
                SaveManager.save(next);
                return next;
            });
        }
        return success;
    };

    const upgradeHero = () => {
        AudioManager.playClick();
        setState((prev) => {
            const next = HeroManager.upgradeHero(prev);
            if (next.heroLevel > prev.heroLevel) {
                // Tracking future event
                AnalyticsManager.trackUpgradePurchase('hero_level', next.heroLevel);
            }
            SaveManager.save(next);
            return next;
        });
    };

    const toggleMute = () => {
        return AudioManager.toggleMute();
    };

    const prestigeAscension = () => {
        AudioManager.playVictory();
        setState((prev) => {
            const next = getInitialState();
            next.prestigeLevel = prev.prestigeLevel + 1;
            SaveManager.save(next);
            return next;
        });
    };

    const resetGame = () => {
        SaveManager.clear();
        setState(getInitialState());
    };

    return (
        <GameContext.Provider value={{ 
            state, completeSetup, purchaseUpgrade, trainTroop, fightTerritory, 
            claimQuest, openChest, claimDailyReward, watchAdForReward, buyIAP,
            upgradeHero, prestigeAscension, toggleMute, resetGame 
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};
