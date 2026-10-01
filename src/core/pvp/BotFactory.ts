import { GameConfig } from '../../config/GameConfig';
import { emptyTroops, type AvatarType, type GodId, type KingdomType, type TroopCounts } from '../GameState';
import { mulberry32 } from './PvpBattle';
import type { AttackArmy, LayoutBuilding, VillageSnapshot } from './PvpTypes';
import { BUILDINGS, VILLAGE_HALF, type BuildingType } from '../../config/BuildingsConfig';

const NAMES = ['Ragnar', 'Isolda', 'Brom', 'Valeria', 'Theron', 'Mirra', 'Kael', 'Sigrid', 'Orin', 'Lyra',
    'Garrick', 'Nerea', 'Doran', 'Elara', 'Fenris', 'Yara', 'Borin', 'Selene', 'Aldric', 'Zora'];
const TITLES = ['el Bravo', 'la Astuta', 'Puño de Hierro', 'del Norte', 'la Implacable', 'el Sabio', 'Rompemuros', 'la Sombra'];
const AVATARS: AvatarType[] = ['warrior', 'mage', 'archer', 'paladin', 'rogue', 'druid'];
const KINGDOMS: KingdomType[] = ['emerald', 'golden', 'frost'];
const GODS = Object.keys(GameConfig.gods) as GodId[];

export function hashString(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
}

/** Spends a power budget on a random but sensible mix of troops. */
function buildTroops(power: number, rng: () => number, defensive: boolean): TroopCounts {
    const troops = emptyTroops();
    const weights: [keyof TroopCounts, number][] = defensive
        ? [['infantry', 3], ['archers', 4], ['cavalry', 1], ['mages', 1.5], ['catapults', 0.5], ['healers', 1]]
        : [['infantry', 3], ['archers', 2], ['cavalry', 2], ['mages', 1.5], ['catapults', 1], ['healers', 1]];
    const total = weights.reduce((s, [, w]) => s + w * (0.5 + rng()), 0);
    for (const [id, w] of weights) {
        const share = power * (w * (0.5 + rng())) / total;
        troops[id] = Math.floor(share / GameConfig.troops[id].power);
    }
    if (Object.values(troops).every(n => n === 0)) troops.infantry = Math.max(3, Math.floor(power));
    return troops;
}

function overlaps(list: LayoutBuilding[], type: BuildingType, x: number, z: number): boolean {
    const s = BUILDINGS[type].size;
    return list.some(o => {
        const os = BUILDINGS[o.type].size;
        // keep a 1-tile gap so troops can walk between buildings
        return x < o.x + os + 1 && x + s + 1 > o.x && z < o.z + os + 1 && z + s + 1 > o.z;
    });
}

/** Random but tidy base layout for a townhall level. */
export function createBotLayout(seed: number, th: number): LayoutBuilding[] {
    const rng = mulberry32(seed ^ 0x5bd1e995);
    const list: LayoutBuilding[] = [{ type: 'townhall', level: th, x: -2, z: -2 }];
    const lvl = () => Math.max(1, Math.min(th + 1, th - 1 + Math.floor(rng() * 3)));
    const wanted: BuildingType[] = ['goldmine', 'barracks', 'blacksmith', 'armory', 'arena', 'altar'];
    for (let i = 0; i < BUILDINGS.cannon.maxCount(th); i++) wanted.push('cannon');
    for (let i = 0; i < BUILDINGS.archertower.maxCount(th); i++) wanted.push('archertower');
    for (const type of wanted) {
        const size = BUILDINGS[type].size;
        // defenses close to the core, economy further out
        const radius = BUILDINGS[type].isDefense ? 7 : 10;
        for (let tries = 0; tries < 80; tries++) {
            const x = Math.round((rng() - 0.5) * 2 * radius) - Math.floor(size / 2);
            const z = Math.round((rng() - 0.5) * 2 * radius) - Math.floor(size / 2);
            if (x < -VILLAGE_HALF || z < -VILLAGE_HALF || x + size > VILLAGE_HALF || z + size > VILLAGE_HALF) continue;
            if (overlaps(list, type, x, z)) continue;
            list.push({ type, level: lvl(), x, z });
            break;
        }
    }
    return list;
}

/** Layout of any snapshot; older snapshots without one get a generated base. */
export function layoutOf(v: VillageSnapshot): LayoutBuilding[] {
    if (v.layout && v.layout.length > 0) return v.layout;
    return createBotLayout(hashString(v.playerId), Math.max(1, Math.min(10, v.level)));
}

/** Generates a believable rival village around a trophy count. */
export function createBotVillage(seed: number, aroundTrophies: number): VillageSnapshot {
    const rng = mulberry32(seed);
    const trophies = Math.max(0, Math.round(aroundTrophies + (rng() - 0.5) * 120));
    const level = Math.max(1, Math.round(trophies / 60 + rng() * 2));
    const defensePower = 6 + trophies * 0.12 * (0.7 + rng() * 0.6);
    const hasGod = trophies > 250 && rng() < 0.6;
    return {
        playerId: `bot_${seed}`,
        name: `${NAMES[Math.floor(rng() * NAMES.length)]} ${TITLES[Math.floor(rng() * TITLES.length)]}`,
        avatar: AVATARS[Math.floor(rng() * AVATARS.length)],
        kingdom: KINGDOMS[Math.floor(rng() * KINGDOMS.length)],
        level,
        heroLevel: 1 + Math.floor(trophies / 200),
        trophies,
        garrison: buildTroops(defensePower, rng, true),
        defenseGod: hasGod ? GODS[Math.floor(rng() * GODS.length)] : null,
        defenseGodLevel: hasGod ? 1 + Math.floor(rng() * Math.min(5, trophies / 200)) : 0,
        wallsLevel: Math.floor(trophies / 200 + rng() * 1.5),
        armorLevel: Math.floor(trophies / 250),
        attackLevel: Math.floor(trophies / 200),
        lootableCoins: Math.floor((200 + trophies * 4) * (0.6 + rng() * 0.8)),
        shieldUntil: 0,
        updatedAt: Date.now(),
        isBot: true,
        isSystemVillage: true,
        layout: createBotLayout(seed, Math.max(1, Math.min(10, 1 + Math.floor(trophies / 150)))),
    };
}

const SYSTEM_VILLAGE_NAMES = [
    'Bastión Bárbaro',
    'Fortaleza de Escarcha',
    'Campamento Rebelde',
    'Ciudadela de Obsidiana',
    'Guarnición del Dragón',
    'Fortín de los Mercenarios',
    'Refugio de los Asaltantes',
    'Enclave Solar',
    'Bastión de la Guardia',
    'Puesto Fronterizo',
];

/** Explicit system village (NPC enemy village for when no real players are available). */
export function createSystemVillage(seed: number, aroundTrophies: number): VillageSnapshot {
    const v = createBotVillage(seed, aroundTrophies);
    const rng = mulberry32(seed ^ 0xa5a5a5a5);
    const sysName = SYSTEM_VILLAGE_NAMES[Math.floor(rng() * SYSTEM_VILLAGE_NAMES.length)];
    return {
        ...v,
        playerId: `system_${seed}`,
        name: `${sysName} (Sistema)`,
        isBot: true,
        isSystemVillage: true,
        lootableCoins: Math.max(350, Math.floor((350 + aroundTrophies * 5) * (0.85 + rng() * 0.5))),
    };
}

/** Army a bot uses when it raids the player (local mode). */
export function createBotArmy(seed: number, aroundTrophies: number): { name: string; trophies: number; army: AttackArmy } {
    const village = createBotVillage(seed, aroundTrophies);
    const rng = mulberry32(seed ^ 0x9e3779b9);
    const power = 8 + village.trophies * 0.15 * (0.7 + rng() * 0.6);
    return {
        name: village.name,
        trophies: village.trophies,
        army: {
            troops: buildTroops(power, rng, false),
            god: village.defenseGod,
            godLevel: village.defenseGodLevel,
            heroLevel: village.heroLevel,
            attackLevel: village.attackLevel,
            armorLevel: village.armorLevel,
            critLevel: 0,
        },
    };
}
