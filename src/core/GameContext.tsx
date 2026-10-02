import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { type GameState, type AvatarType, type KingdomType, type GodId, type TroopId, getInitialState, newPlayerId } from './GameState';
import { GodManager } from './GodManager';
import { VillageManager } from './VillageManager';
import type { BuildingType } from '../config/BuildingsConfig';
import { PvpManager } from './pvp/PvpManager';
import { pvpService } from './pvp/PvpService';
import { computeOutcome, type PvpOutcome } from './pvp/PvpRules';
import type { PvpBattleResult, VillageSnapshot } from './pvp/PvpTypes';
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
import { TroopUpgradeManager } from './TroopUpgradeManager';
import { useAuth } from './AuthContext';

interface GameContextType {
    state: GameState;
    offlineEarnings: number;
    dismissOfflineEarnings: () => void;
    completeSetup: (name: string, avatar: AvatarType, kingdom: KingdomType) => void;
    purchaseUpgrade: (upgradeId: keyof typeof GameConfig.upgrades) => void;
    trainTroop: (troopId: keyof typeof GameConfig.troops) => void;
    upgradeTroop: (troopId: TroopId) => boolean;
    finishTroopUpgradeWithGems: (troopId: TroopId) => boolean;
    fightTerritory: (territoryIndex: number) => BattleResult | null;
    claimQuest: (questId: string) => void;
    openChest: () => void;
    claimDailyReward: () => void;
    watchAdForReward: (type: 'coins' | 'gems' | 'energy') => Promise<boolean>;
    buyIAP: (packageId: string) => Promise<boolean>;
    upgradeHero: () => void;
    prestigeAscension: () => void;
    toggleMute: () => boolean;
    pvpMode: 'local' | 'online';
    moveTroops: (troopId: TroopId, amount: number, to: 'garrison' | 'army') => void;
    unlockGod: (godId: GodId) => void;
    levelUpGod: (godId: GodId) => void;
    equipGod: (slot: 'attack' | 'defense', godId: GodId | null) => void;
    completeAttack: (opponent: VillageSnapshot, result: PvpBattleResult) => PvpOutcome;
    payCoins: (amount: number) => boolean;
    markDefenseLogSeen: () => void;
    startBuildingUpgrade: (uid: string) => void;
    finishBuildingUpgrade: (uid: string) => void;
    moveBuilding: (uid: string, x: number, z: number) => void;
    buildBuilding: (type: BuildingType) => string | null;
    collectMine: (uid: string) => number;
    buyBuilder: () => void;
    resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [offlineEarnings, setOfflineEarnings] = useState(0);
    const { user, saveToCloud, loadFromCloud } = useAuth();
    const [state, setState] = useState<GameState>(() => {
        const loaded = SaveManager.load();
        if (loaded._isFirstOpen) {
            AnalyticsManager.trackFirstOpen();
        }
        delete loaded._isFirstOpen;
        if (!loaded.playerId) loaded.playerId = newPlayerId();
        return TroopUpgradeManager.completeTroopUpgrades(VillageManager.completeUpgrades(VillageManager.ensureVillage(loaded as GameState)));
    });
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // Cloud sync: save on mutations when logged in, and load cloud save on account switch
    useEffect(() => {
        if (user && !user.isGuest) {
            SaveManager.setCloudHandler((st) => {
                saveToCloud(st).catch((e) => console.warn('Cloud save error', e));
            });

            let active = true;
            loadFromCloud().then((cloudData) => {
                if (!active) return;
                if (cloudData && cloudData.hasCompletedSetup) {
                    const prepared = TroopUpgradeManager.completeTroopUpgrades(VillageManager.completeUpgrades(VillageManager.ensureVillage(cloudData)));
                    const now = Date.now();
                    const seconds = Math.max(0, (now - (cloudData.lastSaveTime || now)) / 1000);
                    const caughtUp = EconomyManager.tick(prepared, seconds, now);
                    setState(caughtUp);
                    SaveManager.save(caughtUp);
                } else if (stateRef.current.hasCompletedSetup) {
                    saveToCloud(stateRef.current);
                }
            });

            return () => {
                active = false;
                SaveManager.setCloudHandler(null);
            };
        } else {
            SaveManager.setCloudHandler(null);
        }
    }, [user?.id, user?.isGuest]);

    // The gold mine and buildings kept progressing while the game was closed
    useEffect(() => {
        const current = stateRef.current;
        if (!current.hasCompletedSetup || !current.lastSaveTime) return;
        const now = Date.now();
        const seconds = Math.max(0, (now - current.lastSaveTime) / 1000);
        if (seconds < 2) return;

        const storedBefore = current.village.reduce((s, b) => s + b.stored, 0);
        let updated = EconomyManager.tick(current, seconds, now);
        updated = QuestManager.checkQuests(updated);
        const storedAfter = updated.village.reduce((s, b) => s + b.stored, 0);
        const produced = Math.floor(storedAfter - storedBefore);

        stateRef.current = updated;
        SaveManager.save(updated);
        setState(updated);
        if (produced > 0 && seconds >= 10) {
            setOfflineEarnings(produced);
        }
    }, []);

    useEffect(() => {
        AnalyticsManager.trackSessionStart();
        const start = Date.now();
        return () => {
            AnalyticsManager.trackSessionEnd(Math.floor((Date.now() - start) / 1000));
        };
    }, []);

    // PvP: pick up attacks received while away, then keep checking
    useEffect(() => {
        const check = async () => {
            const current = stateRef.current;
            if (!current.hasCompletedSetup) return;
            const checkedAt = Date.now();
            if (!current.lastDefenseCheck) {
                setState((prev) => ({ ...prev, lastDefenseCheck: checkedAt }));
                return;
            }
            try {
                const records = await pvpService.fetchAttacksAgainst(current.playerId, current.lastDefenseCheck);
                setState((prev) => {
                    const next = PvpManager.applyDefenseRecords(prev, records, checkedAt);
                    SaveManager.save(next);
                    return next;
                });
            } catch (e) {
                console.warn('PvP: could not fetch defense log', e);
            }
        };
        check();
        const id = setInterval(check, 2 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    // PvP: publish what this village leaves prepared for defense and keep online protection active
    const snapshotKey = JSON.stringify([state.hasCompletedSetup, state.garrison, state.defenseGod, state.gods, state.upgrades,
        state.trophies, state.heroLevel, state.level, state.shieldUntil, Math.floor(state.coins / 100)]);
    useEffect(() => {
        if (!stateRef.current.hasCompletedSetup) return;
        const publish = () => {
            if (stateRef.current.hasCompletedSetup) {
                pvpService.publishVillage(PvpManager.buildSnapshot(stateRef.current, user?.id), true)
                    .catch((e) => console.warn('PvP: could not publish village', e));
            }
        };

        const id = setTimeout(publish, 1200);
        const heartbeat = setInterval(publish, 45_000);

        return () => {
            clearTimeout(id);
            clearInterval(heartbeat);
        };
    }, [snapshotKey]);

    // Game Loop with delta time calculation and Page Visibility API (handles tab switching and background)
    useEffect(() => {
        let lastTime = Date.now();

        const processTick = () => {
            const now = Date.now();
            const elapsedSeconds = Math.max(0, (now - lastTime) / 1000);
            lastTime = now;

            if (elapsedSeconds <= 0.05) return;

            setState((prev) => {
                let next = EconomyManager.tick(prev, elapsedSeconds, now);
                next = QuestManager.checkQuests(next);
                SaveManager.save(next); // Auto-save on tick
                return next;
            });
        };

        const intervalId = setInterval(processTick, GameConfig.tickRateMs);

        // When switching back to the browser tab or focusing the window, immediately catch up
        const handleResume = () => {
            processTick();
        };

        // When switching away or closing, immediately save state
        const handlePauseOrUnload = () => {
            const now = Date.now();
            const elapsedSeconds = Math.max(0, (now - lastTime) / 1000);
            lastTime = now;
            const current = stateRef.current;
            if (current.hasCompletedSetup) {
                const finalState = EconomyManager.tick(current, elapsedSeconds, now);
                SaveManager.save(finalState);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                handleResume();
            } else {
                handlePauseOrUnload();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleResume);
        window.addEventListener('blur', handlePauseOrUnload);
        window.addEventListener('pagehide', handlePauseOrUnload);
        window.addEventListener('beforeunload', handlePauseOrUnload);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleResume);
            window.removeEventListener('blur', handlePauseOrUnload);
            window.removeEventListener('pagehide', handlePauseOrUnload);
            window.removeEventListener('beforeunload', handlePauseOrUnload);
        };
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
        const prev = stateRef.current;
        const playerPower = BattleManager.getPlayerPower(prev);
        const enemyPower = GameConfig.territories[territoryIndex].enemyPower;
        AnalyticsManager.trackBattle('start', `t_${territoryIndex}`, playerPower, enemyPower);

        const result = BattleManager.calculateBattle(prev, territoryIndex);
        if (!result) return null;

        AnalyticsManager.trackBattle(result.won ? 'win' : 'loss', `t_${territoryIndex}`, playerPower, enemyPower);
        if (result.won) {
            AudioManager.playVictory();
            if (result.newState.territoryProgress > prev.territoryProgress) {
                AnalyticsManager.trackTerritoryUnlocked(`t_${result.newState.territoryProgress}`);
            }
        }

        const next = QuestManager.checkQuests(result.newState);
        stateRef.current = next;
        SaveManager.save(next);
        setState(next);
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

    const upgradeTroop = (troopId: TroopId): boolean => {
        const prev = stateRef.current;
        if (!TroopUpgradeManager.canUpgrade(prev, troopId)) return false;
        AudioManager.playClick();
        setState((s) => {
            const next = TroopUpgradeManager.upgradeTroop(s, troopId);
            SaveManager.save(next);
            return next;
        });
        return true;
    };

    const finishTroopUpgradeWithGems = (troopId: TroopId): boolean => {
        const prev = stateRef.current;
        const until = prev.troopUpgradesUntil?.[troopId];
        if (!until || until <= Date.now()) return false;
        const cost = Math.max(1, Math.ceil((until - Date.now()) / 60000));
        if (prev.gems < cost) return false;
        AudioManager.playLevelUp();
        setState((s) => {
            const next = TroopUpgradeManager.finishTroopWithGems(s, troopId);
            SaveManager.save(next);
            return next;
        });
        return true;
    };

    const updateAndSave = (fn: (prev: GameState) => GameState) => {
        setState((prev) => {
            const next = fn(prev);
            if (next !== prev) SaveManager.save(next);
            return next;
        });
    };

    const moveTroops = (troopId: TroopId, amount: number, to: 'garrison' | 'army') => {
        AudioManager.playClick();
        updateAndSave((prev) => PvpManager.moveTroops(prev, troopId, amount, to));
    };

    const unlockGod = (godId: GodId) => {
        AudioManager.playVictory();
        updateAndSave((prev) => GodManager.unlock(prev, godId));
    };

    const levelUpGod = (godId: GodId) => {
        AudioManager.playClick();
        updateAndSave((prev) => GodManager.levelUp(prev, godId));
    };

    const equipGod = (slot: 'attack' | 'defense', godId: GodId | null) => {
        AudioManager.playClick();
        updateAndSave((prev) => GodManager.equip(prev, slot, godId));
    };

    /** Applies a finished real-time attack: losses, loot, trophies, and tells the defender. */
    const completeAttack = (opponent: VillageSnapshot, result: PvpBattleResult): PvpOutcome => {
        const current = stateRef.current;
        const outcome = computeOutcome(result, current.trophies, opponent.trophies, opponent.lootableCoins);
        // Golden Kingdom: +20% bonus gold loot on successful raids
        if (current.playerKingdom === 'golden' && outcome.coinsStolen > 0) {
            outcome.coinsStolen = Math.round(outcome.coinsStolen * 1.2);
        }
        AnalyticsManager.trackBattle(result.won ? 'win' : 'loss', `pvp_${opponent.playerId}`, 0, 0);
        if (result.won) AudioManager.playVictory();
        updateAndSave((prev) => PvpManager.applyAttack(prev, result, outcome));
        pvpService.reportAttack(PvpManager.buildAttackRecord(current, opponent, result, outcome))
            .catch((e) => console.warn('PvP: could not report attack', e));
        return outcome;
    };

    const payCoins = (amount: number): boolean => {
        if (stateRef.current.coins < amount) return false;
        stateRef.current = { ...stateRef.current, coins: stateRef.current.coins - amount };
        updateAndSave((prev) => ({ ...prev, coins: prev.coins - amount }));
        return true;
    };

    const startBuildingUpgrade = (uid: string) => {
        AudioManager.playClick();
        updateAndSave((prev) => VillageManager.startUpgrade(prev, uid));
    };

    const finishBuildingUpgrade = (uid: string) => {
        AudioManager.playVictory();
        updateAndSave((prev) => VillageManager.finishWithGems(prev, uid));
    };

    const moveBuilding = (uid: string, x: number, z: number) => {
        updateAndSave((prev) => VillageManager.move(prev, uid, x, z));
    };

    const buildBuilding = (type: BuildingType): string | null => {
        const res = VillageManager.build(stateRef.current, type);
        if (!res.uid) return null;
        AudioManager.playClick();
        stateRef.current = res.state;
        SaveManager.save(res.state);
        setState(res.state);
        return res.uid;
    };

    const collectMine = (uid: string): number => {
        const res = VillageManager.collect(stateRef.current, uid);
        if (res.amount <= 0) return 0;
        AudioManager.playClick();
        stateRef.current = res.state;
        setState((prev) => VillageManager.collect(prev, uid).state);
        return res.amount;
    };

    const buyBuilder = () => {
        AudioManager.playVictory();
        updateAndSave((prev) => VillageManager.buyBuilder(prev));
    };

    const markDefenseLogSeen = () => updateAndSave((prev) => PvpManager.markLogSeen(prev));

    const toggleMute = () => {
        return AudioManager.toggleMute();
    };

    const prestigeAscension = () => {
        AudioManager.playVictory();
        setState((prev) => {
            const next = getInitialState();
            next.prestigeLevel = prev.prestigeLevel + 1;
            // Keep online identity, name and PvP progress across prestige
            next.hasCompletedSetup = prev.hasCompletedSetup;
            next.playerName = prev.playerName;
            next.playerAvatar = prev.playerAvatar;
            next.playerKingdom = prev.playerKingdom;
            next.playerId = prev.playerId;
            next.trophies = prev.trophies;
            next.pvpWins = prev.pvpWins;
            next.pvpLosses = prev.pvpLosses;
            next.gods = prev.gods;
            next.attackGod = prev.attackGod;
            next.defenseGod = prev.defenseGod;
            next.defenseLog = prev.defenseLog;
            next.lastDefenseCheck = prev.lastDefenseCheck;
            Object.assign(next, VillageManager.ensureVillage(next));
            SaveManager.save(next);
            return next;
        });
    };

    const resetGame = () => {
        SaveManager.clear();
        setState(VillageManager.ensureVillage({ ...getInitialState(), playerId: newPlayerId() }));
    };

    return (
        <GameContext.Provider value={{ 
            state, offlineEarnings, dismissOfflineEarnings: () => setOfflineEarnings(0),
            completeSetup, purchaseUpgrade, trainTroop, upgradeTroop, finishTroopUpgradeWithGems, fightTerritory, 
            claimQuest, openChest, claimDailyReward, watchAdForReward, buyIAP,
            upgradeHero, prestigeAscension, toggleMute, resetGame,
            pvpMode: pvpService.mode, moveTroops, unlockGod, levelUpGod, equipGod, completeAttack, payCoins, markDefenseLogSeen,
            startBuildingUpgrade, finishBuildingUpgrade, moveBuilding, buildBuilding, collectMine, buyBuilder 
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
