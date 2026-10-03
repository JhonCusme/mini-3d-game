import type { GameConfig } from './GameConfig';

export type BuildingType =
    | 'townhall' | 'goldmine' | 'farm' | 'barracks' | 'blacksmith' | 'armory' | 'arena' | 'altar'
    | 'cannon' | 'archertower' | 'wall';

type UpgradeId = keyof typeof GameConfig.upgrades;

export interface BuildingDef {
    type: BuildingType;
    name: string;
    description: string;
    size: number;             // footprint in tiles (size x size)
    color: string;
    roofColor: string;
    /** Global upgrade kept in sync with this building's level (singleton buildings). */
    upgradeId?: UpgradeId;
    isDefense?: boolean;
    baseHp: number;
    hpPerLevel: number;
    // Defenses
    damage?: number;          // damage per shot at level 1
    damagePerLevel?: number;
    range?: number;           // tiles
    fireRate?: number;        // seconds between shots
    splash?: number;          // splash radius in tiles
    // Building new copies (defenses)
    buildCost?: number;
    /** How many copies are allowed per townhall level (index = townhall level). */
    maxCount: (townhallLevel: number) => number;
}

export const TILE = 1;
/** The village occupies tiles from -HALF to HALF-1 on both axes. */
export const VILLAGE_HALF = 12;

export const BUILDINGS: Record<BuildingType, BuildingDef> = {
    townhall: {
        type: 'townhall', name: 'Ayuntamiento', size: 3, color: '#c9b79c', roofColor: '#d63a3a',
        description: 'El corazón de tu aldea. Subirlo permite mejorar más los demás edificios y construir más defensas.',
        baseHp: 1500, hpPerLevel: 500, maxCount: () => 1,
    },
    goldmine: {
        type: 'goldmine', name: 'Mina de Oro', size: 2, color: '#8a7a66', roofColor: '#b8860b', upgradeId: 'economy',
        description: 'Produce oro con el tiempo. Tócala para recogerlo.',
        baseHp: 400, hpPerLevel: 80, maxCount: () => 1,
    },
    farm: {
        type: 'farm', name: 'Granja y Molino', size: 2, color: '#e5c07b', roofColor: '#8a5d3b',
        description: 'Cultiva trigo y hornea pan para alimentar a tus mineros y tropas gratis.',
        baseHp: 380, hpPerLevel: 75, buildCost: 150,
        maxCount: th => Math.min(3, 1 + Math.floor(th / 3)),
    },
    barracks: {
        type: 'barracks', name: 'Cuartel', size: 2, color: '#b23b3b', roofColor: '#6b3f2a', upgradeId: 'troopCapacity',
        description: 'Entrena tropas. Al mejorarlo aumenta la capacidad de tu ejército.',
        baseHp: 500, hpPerLevel: 100, maxCount: () => 1,
    },
    blacksmith: {
        type: 'blacksmith', name: 'Herrería', size: 2, color: '#8f8a80', roofColor: '#4d4d57', upgradeId: 'attackPower',
        description: 'Forja mejores armas: más ataque para todas tus tropas.',
        baseHp: 450, hpPerLevel: 90, maxCount: () => 1,
    },
    armory: {
        type: 'armory', name: 'Armería', size: 2, color: '#6f9ac4', roofColor: '#2f4f75', upgradeId: 'troopHealth',
        description: 'Mejores armaduras: menos bajas en combate.',
        baseHp: 450, hpPerLevel: 90, maxCount: () => 1,
    },
    arena: {
        type: 'arena', name: 'Arena', size: 2, color: '#d8b97c', roofColor: '#7a5d2f', upgradeId: 'critRate',
        description: 'Entrenamiento de élite: más probabilidad de golpe crítico.',
        baseHp: 450, hpPerLevel: 90, maxCount: () => 1,
    },
    altar: {
        type: 'altar', name: 'Altar de los Dioses', size: 2, color: '#b9b4aa', roofColor: '#9b6bff',
        description: 'Sube de nivel a tu héroe y despierta a los Dioses.',
        baseHp: 400, hpPerLevel: 100, maxCount: () => 1,
    },
    cannon: {
        type: 'cannon', name: 'Cañón', size: 2, color: '#6b6b75', roofColor: '#3a3a44', isDefense: true,
        description: 'Dispara balas pesadas a las tropas de tierra cercanas.',
        baseHp: 420, hpPerLevel: 90, damage: 9, damagePerLevel: 3, range: 7, fireRate: 0.9,
        buildCost: 250, maxCount: th => Math.min(6, 1 + Math.floor(th / 1.5)),
    },
    archertower: {
        type: 'archertower', name: 'Torre de Arqueros', size: 2, color: '#a0785a', roofColor: '#2f8f3a', isDefense: true,
        description: 'Largo alcance: sus arqueros disparan rápido a cualquier tropa.',
        baseHp: 380, hpPerLevel: 80, damage: 5, damagePerLevel: 2, range: 9, fireRate: 0.5,
        buildCost: 400, maxCount: th => (th < 2 ? 0 : Math.min(5, Math.floor(th / 1.5))),
    },
    wall: {
        type: 'wall', name: 'Muro', size: 1, color: '#7f8c8d', roofColor: '#5a5550',
        description: 'Muro defensivo individual. Colócalo estratégicamente para diseñar barreras, embudos y compartimentos.',
        baseHp: 300, hpPerLevel: 180, isDefense: false,
        buildCost: 50,
        maxCount: th => 20 + th * 20,
    },
};

export const TOWNHALL_MAX_LEVEL = 10;

/** Other buildings can't go above the townhall level (+1 so early game isn't blocked). */
export function maxLevelFor(type: BuildingType, townhallLevel: number): number {
    if (type === 'townhall') return TOWNHALL_MAX_LEVEL;
    return townhallLevel + 1;
}

/** Build/upgrade time in seconds to go from `level` to `level + 1`. */
export function buildTimeSeconds(type: BuildingType, level: number): number {
    if (type === 'wall') {
        const wallTable = [3, 15, 45, 120, 300, 600, 1200, 2400, 4800, 7200, 14400];
        return wallTable[Math.min(level, wallTable.length - 1)];
    }
    const table = [5, 20, 60, 180, 600, 1800, 3600, 7200, 14400, 28800, 43200];
    const t = table[Math.min(level, table.length - 1)];
    return type === 'townhall' ? t * 2 : t;
}

export function townhallUpgradeCost(level: number): number {
    return Math.floor(500 * Math.pow(2.2, level - 1));
}

export function defenseUpgradeCost(type: BuildingType, level: number): number {
    const base = BUILDINGS[type].buildCost || 300;
    return Math.floor(base * Math.pow(1.8, level));
}

/** Gems to finish a running upgrade right away: 1 gem per started minute. */
export function gemsToFinish(msLeft: number): number {
    return Math.max(1, Math.ceil(msLeft / 60000));
}

export const BUILDER_COSTS = [0, 0, 250, 500, 1000]; // gems for builder #n (first two are free)
export const MAX_BUILDERS = 5;

export function buildingHp(type: BuildingType, level: number): number {
    const d = BUILDINGS[type];
    return d.baseHp + d.hpPerLevel * Math.max(0, level - 1);
}

export function defenseDamage(type: BuildingType, level: number): number {
    const d = BUILDINGS[type];
    return (d.damage || 0) + (d.damagePerLevel || 0) * Math.max(0, level - 1);
}

// Gold mine production and storage
export function mineRatePerSecond(level: number): number {
    return 1 + level * 1.2;
}

export function mineCapacity(level: number): number {
    return 300 + level * 400;
}

// Farm food production and storage
export function farmRatePerSecond(level: number): number {
    return 0.35 + level * 0.3;
}

export function farmCapacity(level: number): number {
    return 40 + level * 35;
}
