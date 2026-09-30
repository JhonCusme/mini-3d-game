import { GameConfig } from '../../config/GameConfig';
import { emptyTroops, type AvatarType, type GodId, type KingdomType, type TroopCounts } from '../GameState';
import { mulberry32 } from './PvpBattle';
import type { AttackArmy, VillageSnapshot } from './PvpTypes';

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
