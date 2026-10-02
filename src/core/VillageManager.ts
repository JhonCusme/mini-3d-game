import {
    BUILDINGS, BUILDER_COSTS, MAX_BUILDERS, VILLAGE_HALF, buildTimeSeconds, defenseUpgradeCost, gemsToFinish,
    maxLevelFor, mineCapacity, mineRatePerSecond, townhallUpgradeCost, type BuildingType,
} from '../config/BuildingsConfig';
import type { GameState, PlacedBuilding } from './GameState';
import { UpgradeManager } from './UpgradeManager';

let uidCounter = 0;
const newUid = (type: BuildingType) => `${type}_${Date.now().toString(36)}_${(uidCounter++).toString(36)}`;

/** Starting layout. Building levels follow the old global upgrades so existing saves keep their progress. */
export function defaultVillage(state: Pick<GameState, 'level' | 'upgrades' | 'heroLevel'>): PlacedBuilding[] {
    const up = state.upgrades;
    const b = (type: BuildingType, x: number, z: number, level: number): PlacedBuilding =>
        ({ uid: newUid(type), type, level, x, z, upgradingUntil: 0, stored: 0 });
    const list = [
        b('townhall', -2, -2, Math.max(1, state.level)),
        b('goldmine', -9, -3, (up.economy || 0) + 1),
        b('barracks', 6, -3, (up.troopCapacity || 0) + 1),
        b('blacksmith', -8, 4, (up.attackPower || 0) + 1),
        b('armory', 5, 4, (up.troopHealth || 0) + 1),
        b('arena', -1, 6, (up.critRate || 0) + 1),
        b('altar', -1, -7, Math.max(1, state.heroLevel)),
        b('cannon', 3, -8, 1),
    ];
    // Starter defensive wall ring enclosing the townhall core
    const wallLvl = Math.max(1, up.walls || 1);
    for (let x = -3; x <= 2; x++) {
        list.push(b('wall', x, -4, wallLvl));
        list.push(b('wall', x, 2, wallLvl));
    }
    for (let z = -3; z <= 1; z++) {
        list.push(b('wall', -3, z, wallLvl));
        list.push(b('wall', 2, z, wallLvl));
    }
    return list;
}

export class VillageManager {
    static townhallLevel(state: GameState): number {
        return Math.max(1, state.level);
    }

    static get(state: GameState, uid: string): PlacedBuilding | undefined {
        return state.village.find(b => b.uid === uid);
    }

    static countOf(state: GameState, type: BuildingType): number {
        return state.village.filter(b => b.type === type).length;
    }

    // ---------- Placement ----------

    static fitsInBounds(type: BuildingType, x: number, z: number): boolean {
        const s = BUILDINGS[type].size;
        return x >= -VILLAGE_HALF && z >= -VILLAGE_HALF && x + s <= VILLAGE_HALF && z + s <= VILLAGE_HALF;
    }

    static overlaps(state: GameState, type: BuildingType, x: number, z: number, ignoreUid?: string): boolean {
        const s = BUILDINGS[type].size;
        return state.village.some(o => {
            if (o.uid === ignoreUid) return false;
            const os = BUILDINGS[o.type].size;
            return x < o.x + os && x + s > o.x && z < o.z + os && z + s > o.z;
        });
    }

    static canPlace(state: GameState, type: BuildingType, x: number, z: number, ignoreUid?: string): boolean {
        return this.fitsInBounds(type, x, z) && !this.overlaps(state, type, x, z, ignoreUid);
    }

    static move(state: GameState, uid: string, x: number, z: number): GameState {
        const b = this.get(state, uid);
        if (!b || !this.canPlace(state, b.type, x, z, uid)) return state;
        return { ...state, village: state.village.map(o => (o.uid === uid ? { ...o, x, z } : o)) };
    }

    /** Closest free spot to the village centre, searching outwards. */
    static findFreeSpot(state: GameState, type: BuildingType): { x: number; z: number } | null {
        const s = BUILDINGS[type].size;
        for (let r = 0; r <= VILLAGE_HALF * 2; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dz = -r; dz <= r; dz++) {
                    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
                    const x = dx - Math.floor(s / 2), z = dz - Math.floor(s / 2);
                    if (this.canPlace(state, type, x, z)) return { x, z };
                }
            }
        }
        return null;
    }

    // ---------- Builders ----------

    static busyBuilders(state: GameState): number {
        return state.village.filter(b => b.type !== 'wall' && b.upgradingUntil > 0).length;
    }

    static freeBuilders(state: GameState): number {
        return state.builders - this.busyBuilders(state);
    }

    static nextBuilderCost(state: GameState): number | null {
        if (state.builders >= MAX_BUILDERS) return null;
        return BUILDER_COSTS[state.builders] ?? null;
    }

    static buyBuilder(state: GameState): GameState {
        const cost = this.nextBuilderCost(state);
        if (cost === null || state.gems < cost) return state;
        return { ...state, gems: state.gems - cost, builders: state.builders + 1 };
    }

    // ---------- Upgrades ----------

    static isUpgradable(type: BuildingType): boolean {
        return type !== 'altar'; // the altar levels up with the hero (gems)
    }

    static upgradeCost(b: PlacedBuilding): number {
        const def = BUILDINGS[b.type];
        if (b.type === 'townhall') return townhallUpgradeCost(b.level);
        if (b.type === 'wall') return Math.floor(50 * Math.pow(1.7, Math.max(0, b.level)));
        if (def.upgradeId) return UpgradeManager.getCost(def.upgradeId, b.level - 1);
        return defenseUpgradeCost(b.type, b.level);
    }

    static maxLevel(state: GameState, b: PlacedBuilding): number {
        return maxLevelFor(b.type, this.townhallLevel(state));
    }

    /** Why a building can't be upgraded right now, or null if it can. */
    static upgradeBlocker(state: GameState, b: PlacedBuilding): string | null {
        if (!this.isUpgradable(b.type)) return 'Se mejora desde el Altar';
        if (b.upgradingUntil > 0) return 'Ya se está mejorando';
        if (b.level >= this.maxLevel(state, b)) {
            return b.type === 'townhall' ? 'Nivel máximo' : `Sube el Ayuntamiento para pasar del nivel ${b.level}`;
        }
        if (b.type !== 'wall' && this.freeBuilders(state) <= 0) return 'Todos los constructores están ocupados';
        if (state.coins < this.upgradeCost(b)) return 'Oro insuficiente';
        return null;
    }

    static upgradeDuration(b: PlacedBuilding, kingdom?: string): number {
        const base = buildTimeSeconds(b.type, b.level);
        if (kingdom === 'emerald') return Math.max(1, Math.round(base * 0.8));
        return base;
    }

    static startUpgrade(state: GameState, uid: string, now = Date.now()): GameState {
        const b = this.get(state, uid);
        if (!b || this.upgradeBlocker(state, b)) return state;
        const cost = this.upgradeCost(b);
        const durationSec = this.upgradeDuration(b, state.playerKingdom);
        const until = now + durationSec * 1000;
        return {
            ...state,
            coins: state.coins - cost,
            village: state.village.map(o => (o.uid === uid ? { ...o, upgradingUntil: until } : o)),
        };
    }

    static finishWithGems(state: GameState, uid: string, now = Date.now()): GameState {
        const b = this.get(state, uid);
        if (!b || b.upgradingUntil <= now) return state;
        const cost = gemsToFinish(b.upgradingUntil - now);
        if (state.gems < cost) return state;
        return this.completeUpgrades({
            ...state,
            gems: state.gems - cost,
            village: state.village.map(o => (o.uid === uid ? { ...o, upgradingUntil: now } : o)),
        }, now);
    }

    /** Applies finished upgrades and keeps global stats in sync with building levels. */
    static completeUpgrades(state: GameState, now = Date.now()): GameState {
        if (!state.village.some(b => b.upgradingUntil > 0 && b.upgradingUntil <= now)) return state;
        const upgrades = { ...state.upgrades };
        let townhallLevel = state.level;
        const village = state.village.map(b => {
            if (b.upgradingUntil <= 0 || b.upgradingUntil > now) return b;
            const level = b.level + 1;
            const def = BUILDINGS[b.type];
            if (b.type === 'townhall') townhallLevel = level;
            if (def.upgradeId) upgrades[def.upgradeId] = level - 1;
            return { ...b, level, upgradingUntil: 0 };
        });
        return { ...state, upgrades, level: townhallLevel, village };
    }

    // ---------- New buildings ----------

    static buildBlocker(state: GameState, type: BuildingType): string | null {
        const def = BUILDINGS[type];
        const max = def.maxCount(this.townhallLevel(state));
        if (this.countOf(state, type) >= max) {
            return max === 0 ? 'Requiere un Ayuntamiento de mayor nivel' : `Máximo ${max} con este Ayuntamiento`;
        }
        if (type !== 'wall' && this.freeBuilders(state) <= 0) return 'Todos los constructores están ocupados';
        if (state.coins < (def.buildCost || 0)) return 'Oro insuficiente';
        if (!this.findFreeSpot(state, type)) return 'No queda espacio';
        return null;
    }

    static build(state: GameState, type: BuildingType, now = Date.now()): { state: GameState; uid: string | null } {
        if (this.buildBlocker(state, type)) return { state, uid: null };
        const spot = this.findFreeSpot(state, type)!;
        const uid = newUid(type);
        const baseSec = buildTimeSeconds(type, 0);
        const durationSec = state.playerKingdom === 'emerald' ? Math.max(1, Math.round(baseSec * 0.8)) : baseSec;
        const building: PlacedBuilding = {
            uid, type, level: 0, x: spot.x, z: spot.z, stored: 0,
            upgradingUntil: now + durationSec * 1000,
        };
        return {
            state: { ...state, coins: state.coins - (BUILDINGS[type].buildCost || 0), village: [...state.village, building] },
            uid,
        };
    }

    // ---------- Gold mine & Miner Workers ----------

    static produce(state: GameState, seconds: number): GameState {
        if (seconds <= 0 || !state.village.some(b => b.type === 'goldmine')) return state;
        const rateMult = state.playerKingdom === 'golden' ? 1.3 : 1.0;
        const capMult = state.playerKingdom === 'golden' ? 1.3 : 1.0;
        return {
            ...state,
            village: state.village.map(b => {
                if (b.type !== 'goldmine' || b.level <= 0) return b;
                const cap = Math.round(mineCapacity(b.level) * capMult);
                const currentStamina = b.minerStamina !== undefined ? b.minerStamina : 100;

                // When full capacity is reached, miners rest and recover stamina
                if (b.stored >= cap) {
                    const recoveredStamina = Math.min(100, currentStamina + (seconds / 8));
                    return { ...b, minerStamina: Math.round(recoveredStamina * 10) / 10 };
                }

                // Active mining drains stamina: 1% roughly every 15s (~25 min of continuous mining)
                const newStamina = Math.max(0, currentStamina - (seconds / 15));

                // Fatigue efficiency:
                // > 60%: 1.1x (high energy)
                // 30% - 60%: 1.0x (steady normal pace)
                // 10% - 30%: 0.45x (sweating and exhausted)
                // < 10%: 0.15x (too tired, sleeping/sitting)
                let workerEfficiency = 1.0;
                if (newStamina > 60) workerEfficiency = 1.1;
                else if (newStamina >= 30) workerEfficiency = 1.0;
                else if (newStamina >= 10) workerEfficiency = 0.45;
                else workerEfficiency = 0.15;

                const goldProduced = mineRatePerSecond(b.level) * rateMult * workerEfficiency * seconds;
                return {
                    ...b,
                    minerStamina: Math.round(newStamina * 10) / 10,
                    stored: Math.min(cap, b.stored + goldProduced),
                };
            }),
        };
    }

    static feedMiners(state: GameState, uid: string): { state: GameState; success: boolean } {
        const b = this.get(state, uid);
        if (!b || b.type !== 'goldmine') return { state, success: false };
        const foodCost = 50; // Coins cost for fresh kingdom rations
        if (state.coins < foodCost) return { state, success: false };
        return {
            state: {
                ...state,
                coins: state.coins - foodCost,
                village: state.village.map(o => (o.uid === uid ? { ...o, minerStamina: 100, lastFedTime: Date.now() } : o)),
            },
            success: true,
        };
    }

    static collect(state: GameState, uid: string): { state: GameState; amount: number } {
        const b = this.get(state, uid);
        if (!b || b.type !== 'goldmine') return { state, amount: 0 };
        const amount = Math.floor(b.stored);
        if (amount <= 0) return { state, amount: 0 };
        return {
            state: {
                ...state,
                coins: state.coins + amount,
                village: state.village.map(o => (o.uid === uid ? { ...o, stored: o.stored - amount } : o)),
            },
            amount,
        };
    }

    /** Fixes up saves from before individual walls existed. */
    static ensureVillage(state: GameState): GameState {
        let village = state.village;
        if (!Array.isArray(village) || village.length === 0) {
            village = defaultVillage(state);
        } else if (!village.some(b => b.type === 'wall')) {
            // Migrate walls for existing player saves
            const wallLvl = Math.max(1, state.upgrades.walls || 1);
            const b = (type: BuildingType, x: number, z: number, level: number): PlacedBuilding =>
                ({ uid: newUid(type), type, level, x, z, upgradingUntil: 0, stored: 0 });
            const newWalls: PlacedBuilding[] = [];
            for (let x = -3; x <= 2; x++) {
                if (!this.overlaps(state, 'wall', x, -4)) newWalls.push(b('wall', x, -4, wallLvl));
                if (!this.overlaps(state, 'wall', x, 2)) newWalls.push(b('wall', x, 2, wallLvl));
            }
            for (let z = -3; z <= 1; z++) {
                if (!this.overlaps(state, 'wall', -3, z)) newWalls.push(b('wall', -3, z, wallLvl));
                if (!this.overlaps(state, 'wall', 2, z)) newWalls.push(b('wall', 2, z, wallLvl));
            }
            village = [...village, ...newWalls];
        }
        return { ...state, village, builders: state.builders || 2 };
    }
}
