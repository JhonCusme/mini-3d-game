import { type GameState, getInitialState } from './GameState';

const SAVE_KEY = 'mini_kingdom_save_data';

export class SaveManager {
    static save(state: GameState): void {
        try {
            const serialized = JSON.stringify({ ...state, lastSaveTime: Date.now() });
            localStorage.setItem(SAVE_KEY, serialized);
        } catch (e) {
            console.error('Error saving game data', e);
        }
    }

    static load(): GameState & { _isFirstOpen?: boolean } {
        try {
            const serialized = localStorage.getItem(SAVE_KEY);
            if (serialized) {
                const data = JSON.parse(serialized);
                return { ...getInitialState(), ...data, _isFirstOpen: false };
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
