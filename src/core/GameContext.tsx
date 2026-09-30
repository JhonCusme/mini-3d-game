import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { type GameState, type AvatarType, type KingdomType, type GodId, type TroopCounts, type TroopId, getInitialState, newPlayerId } from './GameState';
import { GodManager } from './GodManager';
import { VillageManager } from './VillageManager';
import type { BuildingType } from '../config/BuildingsConfig';
import { PvpManager } from './pvp/PvpManager';
import { pvpService } from './pvp/PvpService';
import { simulatePvpBattle } from './pvp/PvpBattle';
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

interface GameContextType {
    state: GameState;
    offlineEarnings: number;
    dismissOfflineEarnings: () => void;
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
    pvpMode: 'local' | 'online';
    moveTroops: (troopId: TroopId, amount: number, to: 'garrison' | 'army') => void;
    unlockGod: (godId: GodId) => void;
    levelUpGod: (godId: GodId) => void;
    equipGod: (slot: 'attack' | 'defense', godId: GodId | null) => void;
    attackPlayer: (opponent: VillageSnapshot, selection: TroopCounts) => { result: PvpBattleResult; outcome: PvpOutcome } | null;
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
    const [state, setState] = useState<GameState>(() => {
        const loaded = SaveManager.load();
        if (loaded._isFirstOpen) {
            AnalyticsManager.trackFirstOpen();
        }
        delete loaded._isFirstOpen;
        if (!loaded.playerId) loaded.playerId = newPlayerId();
        return VillageManager.completeUpgrades(VillageManager.ensureVillage(loaded as GameState));
    });
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // The gold mine kept producing while the game was closed
    useEffect(() => {
        const current = stateRef.current;
        if (!current.hasCompletedSetup || !current.lastSaveTime) return;
        const seconds = Math.max(0, (Date.now() - current.lastSaveTime) / 1000);
        if (seconds < 60) return;
        const storedBefore = current.village.reduce((s, b) => s + b.stored, 0);
        const after = VillageManager.produce(current, seconds);
        const produced = Math.floor(after.village.reduce((s, b) => s + b.stored, 0) - storedBefore);
        setState((prev) => VillageManager.produce(prev, seconds));
        if (produced > 0) setOfflineEarnings(produced);
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

    // PvP: publish what this village leaves prepared for defense
    const snapshotKey = JSON.stringify([state.hasCompletedSetup, state.garrison, state.defenseGod, state.gods, state.upgrades,
        state.trophies, state.heroLevel, state.level, state.shieldUntil, Math.floor(state.coins / 100)]);
    useEffect(() => {
        if (!stateRef.current.hasCompletedSetup) return;
        const id = setTimeout(() => {
            pvpService.publishVillage(PvpManager.buildSnapshot(stateRef.current))
                .catch((e) => console.warn('PvP: could not publish village', e));
        }, 1500);
        return () => clearTimeout(id);
    }, [snapshotKey]);

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

    const attackPlayer = (opponent: VillageSnapshot, selection: TroopCounts) => {
        const current = stateRef.current;
        if (!PvpManager.canAttack(current, selection)) return null;
        AudioManager.playClick();

        const army = PvpManager.buildArmy(current, selection);
        const seed = Math.floor(Math.random() * 2 ** 31);
        const result = simulatePvpBattle(army, opponent, seed);
        const outcome = computeOutcome(result, current.trophies, opponent.trophies, opponent.lootableCoins);
        AnalyticsManager.trackBattle(result.won ? 'win' : 'loss', `pvp_${opponent.playerId}`, 0, 0);
        if (result.won) AudioManager.playVictory();

        updateAndSave((prev) => PvpManager.applyAttack(prev, result, outcome));
        pvpService.reportAttack(PvpManager.buildAttackRecord(current, opponent, result, outcome))
            .catch((e) => console.warn('PvP: could not report attack', e));
        return { result, outcome };
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
            completeSetup, purchaseUpgrade, trainTroop, fightTerritory, 
            claimQuest, openChest, claimDailyReward, watchAdForReward, buyIAP,
            upgradeHero, prestigeAscension, toggleMute, resetGame,
            pvpMode: pvpService.mode, moveTroops, unlockGod, levelUpGod, equipGod, attackPlayer, markDefenseLogSeen,
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
