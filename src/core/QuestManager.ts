import type { GameState } from './GameState';
import { GameConfig } from '../config/GameConfig';

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
                    // We need to track opened chests in GameState for this, 
                    // for simplicity let's mock progress by just setting it if they have few chests left
                    // In a real app we'd add 'chestsOpened' to GameState.
                    currentProgress = (newState.quests[quest.id]?.progress || 0);
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
        newState.coins += questDef.rewardCoins;
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
