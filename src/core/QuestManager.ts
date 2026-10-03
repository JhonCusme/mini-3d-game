import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';
import { VillageManager } from './VillageManager';

export class QuestManager {
    static checkQuests(state: GameState): GameState {
        let newState = { ...state };
        let changed = false;

        GameConfig.quests.forEach(quest => {
            if (newState.quests[quest.id]?.completed) return; // Ya cobrada

            let currentProgress = 0;

            switch (quest.type) {
                case 'upgrade_economy':
                    currentProgress = newState.upgrades.economy || 0;
                    break;
                case 'total_troops':
                    currentProgress = Object.values(newState.troops).reduce((a, b) => a + b, 0);
                    break;
                case 'territories_won':
                    currentProgress = newState.territoryProgress;
                    break;
                case 'open_chests':
                    currentProgress = newState.chestsOpened || 0;
                    break;
                case 'battles_won':
                    currentProgress = newState.battlesWon || 0;
                    break;
                case 'hero_level':
                    currentProgress = newState.heroLevel;
                    break;
                case 'upgrade_attack':
                    currentProgress = newState.upgrades.attackPower || 0;
                    break;
                case 'upgrade_crit':
                    currentProgress = newState.upgrades.critRate || 0;
                    break;
            }

            if (!newState.quests[quest.id]) {
                newState.quests[quest.id] = { progress: currentProgress, completed: false };
                changed = true;
            } else if (newState.quests[quest.id].progress !== currentProgress) {
                newState.quests[quest.id].progress = currentProgress;
                changed = true;
            }
        });

        return changed ? newState : state;
    }

    static canClaimQuest(state: GameState, questId: string): boolean {
        const questDef = GameConfig.quests.find(q => q.id === questId);
        if (!questDef) return false;
        
        const qState = state.quests[questId];
        return qState && !qState.completed && qState.progress >= questDef.target;
    }

    static claimQuest(state: GameState, questId: string): GameState {
        if (!this.canClaimQuest(state, questId)) return state;

        const questDef = GameConfig.quests.find(q => q.id === questId)!;
        
        let newState = { ...state };
        const maxGold = VillageManager.maxGoldCapacity(newState);
        newState.coins = Math.min(maxGold, newState.coins + questDef.rewardCoins);
        newState.gems += questDef.rewardGems;
        
        newState.quests = {
            ...newState.quests,
            [questId]: {
                ...newState.quests[questId],
                completed: true
            }
        };

        return newState;
    }
}
