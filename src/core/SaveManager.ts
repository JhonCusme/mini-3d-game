import { type GameState, getInitialState } from './GameState';

const SAVE_KEY = 'mini_kingdom_save_data';

export class SaveManager {
    private static cloudHandler: ((state: GameState) => void) | null = null;
    private static cloudDebounceTimer: number | null = null;

    static setCloudHandler(handler: ((state: GameState) => void) | null): void {
        this.cloudHandler = handler;
    }

    static save(state: GameState): void {
        try {
            const serialized = JSON.stringify({ ...state, lastSaveTime: Date.now() });
            localStorage.setItem(SAVE_KEY, serialized);

            if (this.cloudHandler) {
                if (this.cloudDebounceTimer) {
                    window.clearTimeout(this.cloudDebounceTimer);
                }
                this.cloudDebounceTimer = window.setTimeout(() => {
                    if (this.cloudHandler) {
                        this.cloudHandler(state);
                    }
                }, 2500);
            }
        } catch (e) {
            console.error('Error saving game data', e);
        }
    }

    static load(): GameState & { _isFirstOpen?: boolean } {
        try {
            const serialized = localStorage.getItem(SAVE_KEY);
            if (serialized) {
                const data = JSON.parse(serialized);
                const initial = getInitialState();
                return {
                    ...initial,
                    ...data,
                    troopLevels: { ...initial.troopLevels, ...(data.troopLevels || {}) },
                    _isFirstOpen: false,
                };
            }
        } catch (e) {
            console.error('Error loading game data', e);
        }
        return { ...getInitialState(), _isFirstOpen: true };
    }

    static clear(): void {
        localStorage.removeItem(SAVE_KEY);
    }
}
