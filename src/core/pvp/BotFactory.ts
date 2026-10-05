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

/**
 * Detects if a rival snapshot belongs to the same player.
 * Allows all other real players and friend accounts to be matched properly.
 */
export function isSameOrCloneVillage(candidate: VillageSnapshot | null | undefined, me: VillageSnapshot): boolean {
    if (!candidate || !candidate.playerId) return true;

    // 1. Direct player ID match (cannot attack self)
    if (candidate.playerId === me.playerId) return true;

    // 2. Direct user ID match (when logged in with Supabase Auth)
    if (candidate.userId && me.userId && candidate.userId === me.userId) return true;

    // 3. Exact name comparison (case-insensitive & trimmed)
    const cName = (candidate.name || '').trim().toLowerCase();
    const myName = (me.name || '').trim().toLowerCase();
    if (cName && myName && cName === myName) return true;

    return false;
}

/** Random but strategic fortress base layout for rival villages. */
export function createBotLayout(seed: number, th: number): LayoutBuilding[] {
    const rng = mulberry32(seed ^ 0x5bd1e995);
    const archetype = Math.floor(rng() * 4); // 0: Centro, 1: Norte, 2: Este, 3: Sudoeste
    const list: LayoutBuilding[] = [];

    const lvl = (type: BuildingType) => {
        if (type === 'townhall') return th;
        if (BUILDINGS[type].isDefense) return Math.max(1, Math.min(10, th + (rng() > 0.4 ? 1 : 0)));
        return Math.max(1, Math.min(10, th - 1 + Math.floor(rng() * 3)));
    };

    // Townhall position varies according to fortress archetype (never all identical)
    let thPos: { x: number; z: number };
    if (archetype === 0) {
        thPos = { x: -2, z: -2 }; // Central stronghold
    } else if (archetype === 1) {
        thPos = { x: -2, z: -6 }; // Northern citadel
    } else if (archetype === 2) {
        thPos = { x: 3, z: -3 };  // Eastern fortress
    } else {
        thPos = { x: -5, z: 3 };  // South-western bunker
    }

    list.push({ type: 'townhall', level: lvl('townhall'), x: thPos.x, z: thPos.z });

    // Ensure rival bases always have fortified defenses
    const numCannons = Math.max(2, Math.min(4, BUILDINGS.cannon.maxCount(th) + 1));
    const numTowers = Math.max(1, Math.min(3, BUILDINGS.archertower.maxCount(th) + 1));

    const wanted: BuildingType[] = [];
    for (let i = 0; i < numCannons; i++) wanted.push('cannon');
    for (let i = 0; i < numTowers; i++) wanted.push('archertower');
    wanted.push('goldmine', 'goldstorage', 'foodstorage', 'farm', 'barracks', 'blacksmith', 'armory', 'arena', 'altar');

    for (const type of wanted) {
        const size = BUILDINGS[type].size;
        const isDef = BUILDINGS[type].isDefense;
        const radius = isDef ? (5 + Math.floor(rng() * 5)) : (7 + Math.floor(rng() * 6));

        let placed = false;
        for (let tries = 0; tries < 90; tries++) {
            const angle = rng() * Math.PI * 2;
            const dist = (isDef ? 4 : 6) + rng() * radius;
            const cx = thPos.x + 2 + Math.cos(angle) * dist;
            const cz = thPos.z + 2 + Math.sin(angle) * dist;
            const x = Math.round(cx - size / 2);
            const z = Math.round(cz - size / 2);

            if (x < -VILLAGE_HALF + 1 || z < -VILLAGE_HALF + 1 || x + size > VILLAGE_HALF - 1 || z + size > VILLAGE_HALF - 1) continue;
            if (overlaps(list, type, x, z)) continue;
            list.push({ type, level: lvl(type), x, z });
            placed = true;
            break;
        }

        if (!placed) {
            for (let x = -VILLAGE_HALF + 2; x <= VILLAGE_HALF - size - 2 && !placed; x += 3) {
                for (let z = -VILLAGE_HALF + 2; z <= VILLAGE_HALF - size - 2 && !placed; z += 3) {
                    if (!overlaps(list, type, x, z)) {
                        list.push({ type, level: lvl(type), x, z });
                        placed = true;
                    }
                }
            }
        }
    }

    // Add fortified wall ring around townhall
    const wallLvl = Math.max(1, Math.min(10, th - 1 + Math.floor(rng() * 2)));
    for (let x = thPos.x - 1; x <= thPos.x + 3; x++) {
        if (!overlaps(list, 'wall', x, thPos.z - 1)) list.push({ type: 'wall', level: wallLvl, x, z: thPos.z - 1 });
        if (!overlaps(list, 'wall', x, thPos.z + 3)) list.push({ type: 'wall', level: wallLvl, x, z: thPos.z + 3 });
    }
    for (let z = thPos.z; z <= thPos.z + 2; z++) {
        if (!overlaps(list, 'wall', thPos.x - 1, z)) list.push({ type: 'wall', level: wallLvl, x: thPos.x - 1, z });
        if (!overlaps(list, 'wall', thPos.x + 3, z)) list.push({ type: 'wall', level: wallLvl, x: thPos.x + 3, z });
    }

    return list;
}

/** Layout of any snapshot; older snapshots without one get a generated base. */
export function layoutOf(v: VillageSnapshot): LayoutBuilding[] {
    if (v.layout && v.layout.length > 0) return v.layout;
    return createBotLayout(hashString(v.playerId), Math.max(1, Math.min(10, v.level)));
}

/** Generates a believable rival village around a trophy count with a distinct visual biome. */
export function createBotVillage(seed: number, aroundTrophies: number, avoidKingdom?: KingdomType): VillageSnapshot {
    const rng = mulberry32(seed);
    const trophies = Math.max(0, Math.round(aroundTrophies + (rng() - 0.5) * 120));
    const level = Math.max(1, Math.round(trophies / 60 + rng() * 2));
    const defensePower = 8 + trophies * 0.15 * (0.8 + rng() * 0.6);
    const hasGod = trophies > 200 && rng() < 0.7;

    // Pick a kingdom DIFFERENT from the player's kingdom so it is unmistakably an enemy biome
    const availableKingdoms = avoidKingdom ? KINGDOMS.filter(k => k !== avoidKingdom) : KINGDOMS;
    const kingdom = availableKingdoms[Math.floor(rng() * availableKingdoms.length)] || 'golden';

    return {
        playerId: `bot_${seed}`,
        name: `${NAMES[Math.floor(rng() * NAMES.length)]} ${TITLES[Math.floor(rng() * TITLES.length)]}`,
        avatar: AVATARS[Math.floor(rng() * AVATARS.length)],
        kingdom,
        level,
        heroLevel: 1 + Math.floor(trophies / 200),
        trophies,
        garrison: buildTroops(defensePower, rng, true),
        defenseGod: hasGod ? GODS[Math.floor(rng() * GODS.length)] : null,
        defenseGodLevel: hasGod ? 1 + Math.floor(rng() * Math.min(5, trophies / 200)) : 0,
        wallsLevel: Math.max(1, Math.floor(trophies / 180 + rng() * 1.5) + 1), // Always show fortress walls
        armorLevel: Math.floor(trophies / 250),
        attackLevel: Math.floor(trophies / 200),
        lootableCoins: Math.floor((300 + trophies * 5) * (0.7 + rng() * 0.8)),
        shieldUntil: 0,
        updatedAt: Date.now(),
        isBot: true,
        isSystemVillage: true,
        layout: createBotLayout(seed, Math.max(1, Math.min(10, 1 + Math.floor(trophies / 150)))),
    };
}

const REALISTIC_RIVAL_NAMES = [
    'Ragnar', 'Valeria', 'Kaelen_99', 'Isolda', 'Brom_Furia', 'Theron',
    'ReyArturo', 'ShadowHunter', 'IronClaw', 'Tormenta99', 'Nerea_PvP',
    'LordGonzalo', 'FuriaRoja', 'TitanX', 'ElConquistador', 'Vikingo88',
    'SlayerKing', 'Aldric', 'Zora_Gamer', 'Garrick', 'Doran', 'Fenris_Rex',
    'Selene_Luna', 'Borin_Muro', 'Lyra_Sky', 'Orin_Thunder', 'Aria_Flame'
];

/** Auto-generated rival village (seamlessly styled like a genuine human player). */
export function createSystemVillage(seed: number, aroundTrophies: number, avoidKingdom?: KingdomType): VillageSnapshot {
    const v = createBotVillage(seed, aroundTrophies, avoidKingdom);
    const rng = mulberry32(seed ^ 0xa5a5a5a5);
    const rivalName = REALISTIC_RIVAL_NAMES[Math.floor(rng() * REALISTIC_RIVAL_NAMES.length)];
    return {
        ...v,
        playerId: `rival_${seed}`,
        name: rivalName,
        isBot: true,
        isSystemVillage: true,
        lootableCoins: Math.max(400, Math.floor((400 + aroundTrophies * 6) * (0.85 + rng() * 0.5))),
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
