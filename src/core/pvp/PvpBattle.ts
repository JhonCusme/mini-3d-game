import { GameConfig } from '../../config/GameConfig';
import { emptyTroops, type TroopCounts, type TroopId } from '../GameState';
import { GodManager, type GodEffects } from '../GodManager';
import type { AttackArmy, BattleRound, PvpBattleResult, VillageSnapshot } from './PvpTypes';
import { BUILDINGS, defenseDamage } from '../../config/BuildingsConfig';
import { layoutOf } from './BotFactory';

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];

/** Damage multiplier so battles are decided in a few rounds. */
const DAMAGE_SCALE = 2.5;
/** Each healer revives this share of its side's losses per round (capped). */
const HEALER_REVIVE_EACH = 0.015;
const HEALER_REVIVE_CAP = 0.3;

/** Small deterministic PRNG so a battle can be replayed from its seed. */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Side {
    counts: TroopCounts;
    dmgMult: number;
    hpMult: number;
    lossReduction: number;
    critChance: number;
    god: GodEffects;
}

function upgradeEffect(id: 'attackPower' | 'troopHealth' | 'critRate', level: number): number {
    if (level <= 0) return 0;
    const u = GameConfig.upgrades[id];
    return u.effectBase * Math.pow(u.effectMultiplier, level - 1) / 100;
}

function critFromUpgrade(level: number): number {
    const u = GameConfig.upgrades.critRate;
    return level * u.effectBase * u.effectMultiplier / 100;
}

function totalHp(side: Side): number {
    return TROOP_IDS.reduce((sum, id) => sum + side.counts[id] * GameConfig.troops[id].hp * side.hpMult, 0);
}

function troopCount(counts: TroopCounts): number {
    return TROOP_IDS.reduce((sum, id) => sum + counts[id], 0);
}

/** Raw damage of a side for this round, split into wall-breaking parts. */
function sideDamage(side: Side, role: 'attack' | 'defense', round: number) {
    let normal = 0, siege = 0, magic = 0;
    for (const id of TROOP_IDS) {
        let dmg = side.counts[id] * GameConfig.troops[id].power;
        if (id === 'cavalry' && role === 'attack' && round === 1) dmg *= 1.5; // charge
        if (id === 'archers' && role === 'defense') dmg *= 1.5;              // shooting from the walls
        if (id === 'catapults') siege += dmg;
        else if (id === 'mages') magic += dmg;
        else normal += dmg;
    }
    const mult = side.dmgMult * (1 + side.god.attackBonus) * DAMAGE_SCALE;
    return { normal: normal * mult, siege: siege * mult, magic: magic * mult };
}

/** Distributes damage across troop types proportionally to their total HP. Returns losses. */
function applyDamage(side: Side, damage: number): TroopCounts {
    const losses = emptyTroops();
    const hp = totalHp(side);
    if (hp <= 0 || damage <= 0) return losses;
    let killedAny = false;
    for (const id of TROOP_IDS) {
        const count = side.counts[id];
        if (count <= 0) continue;
        const unitHp = GameConfig.troops[id].hp * side.hpMult;
        const share = damage * (count * unitHp) / hp;
        const killed = Math.min(count, Math.floor(share / unitHp));
        losses[id] = killed;
        if (killed > 0) killedAny = true;
    }
    // Enough damage to kill at least one unit overall: make sure it lands somewhere
    if (!killedAny) {
        const weakest = TROOP_IDS
            .filter(id => side.counts[id] > 0)
            .sort((a, b) => GameConfig.troops[a].hp - GameConfig.troops[b].hp)[0];
        if (weakest && damage >= GameConfig.troops[weakest].hp * side.hpMult) losses[weakest] = 1;
    }
    // Armor and healers reduce real losses
    const revive = Math.min(HEALER_REVIVE_CAP, side.counts.healers * HEALER_REVIVE_EACH) + side.god.heal + side.lossReduction;
    for (const id of TROOP_IDS) {
        losses[id] = Math.max(0, losses[id] - Math.floor(losses[id] * Math.min(0.8, revive)));
    }
    return losses;
}

export function buildAttackerSide(army: AttackArmy): Side {
    const god = GodManager.getEffects(army.god, army.godLevel);
    return {
        counts: { ...army.troops },
        dmgMult: (1 + (army.heroLevel - 1) * GameConfig.heroPowerMultiplierPerLevel) * (1 + upgradeEffect('attackPower', army.attackLevel)),
        hpMult: 1 + god.hpBonus,
        lossReduction: upgradeEffect('troopHealth', army.armorLevel),
        critChance: critFromUpgrade(army.critLevel) + god.critChance,
        god,
    };
}

export function buildDefenderSide(village: VillageSnapshot): Side {
    const god = GodManager.getEffects(village.defenseGod, village.defenseGodLevel);
    return {
        counts: { ...village.garrison },
        dmgMult: (1 + (village.heroLevel - 1) * GameConfig.heroPowerMultiplierPerLevel) * (1 + upgradeEffect('attackPower', village.attackLevel)),
        hpMult: 1 + god.hpBonus,
        lossReduction: upgradeEffect('troopHealth', village.armorLevel),
        critChance: god.critChance,
        god,
    };
}

export function wallMaxHp(village: VillageSnapshot): number {
    const god = GodManager.getEffects(village.defenseGod, village.defenseGodLevel);
    return Math.floor(village.wallsLevel * GameConfig.upgrades.walls.effectBase * (1 + god.wallBonus));
}

const TROOP_NAMES: Record<TroopId, string> = Object.fromEntries(
    TROOP_IDS.map(id => [id, GameConfig.troops[id].name])
) as Record<TroopId, string>;

function describeLosses(losses: TroopCounts): string {
    return TROOP_IDS.filter(id => losses[id] > 0).map(id => `${losses[id]} ${TROOP_NAMES[id]}`).join(', ');
}

/**
 * Simulates an asynchronous PvP battle. Pure and deterministic for a given seed,
 * so the same result can be shown to the attacker and reported to the defender.
 */
export function simulatePvpBattle(army: AttackArmy, village: VillageSnapshot, seed: number): PvpBattleResult {
    const rng = mulberry32(seed);
    const atk = buildAttackerSide(army);
    const def = buildDefenderSide(village);
    const startAtk = { ...atk.counts };
    const startDef = { ...def.counts };

    const wallMax = wallMaxHp(village);
    // Cannons and archer towers of the defender add damage every round
    const towerDamage = layoutOf(village)
        .filter(b => BUILDINGS[b.type].isDefense)
        .reduce((s, b) => s + defenseDamage(b.type, b.level) / (BUILDINGS[b.type].fireRate || 1), 0) * 1.5 * (1 + def.god.attackBonus);
    let wallHp = wallMax;
    const attackerMaxHp = totalHp(atk);
    const defenderMaxHp = totalHp(def);
    const rounds: BattleRound[] = [];

    const subtract = (side: Side, losses: TroopCounts) => {
        for (const id of TROOP_IDS) side.counts[id] = Math.max(0, side.counts[id] - losses[id]);
    };

    // Divine lightning before the fight
    const openingEvents: string[] = [];
    if (atk.god.lightning > 0 && army.god) {
        const losses = applyDamage(def, atk.god.lightning);
        subtract(def, losses);
        openingEvents.push(`⚡ ${GameConfig.gods[army.god].name} lanza un rayo${describeLosses(losses) ? `: caen ${describeLosses(losses)}` : ''}`);
    }
    if (def.god.lightning > 0 && village.defenseGod) {
        const losses = applyDamage(atk, def.god.lightning);
        subtract(atk, losses);
        openingEvents.push(`⚡ ${GameConfig.gods[village.defenseGod].name} defiende con un rayo${describeLosses(losses) ? `: caen ${describeLosses(losses)}` : ''}`);
    }

    for (let r = 1; r <= GameConfig.pvp.maxRounds; r++) {
        if (troopCount(atk.counts) === 0) break;
        if (troopCount(def.counts) === 0 && wallHp <= 0) break;

        const events: string[] = r === 1 ? [...openingEvents] : [];
        const variance = () => 0.9 + rng() * 0.2;

        const a = sideDamage(atk, 'attack', r);
        const d = sideDamage(def, 'defense', r);
        const atkCrit = rng() < atk.critChance;
        const defCrit = rng() < def.critChance;
        const aMult = variance() * (atkCrit ? 2 : 1);
        const dMult = variance() * (defCrit ? 2 : 1);
        if (atkCrit) events.push('💥 ¡Crítico de tu ejército!');
        if (defCrit) events.push('💥 ¡Crítico de los defensores!');

        // Walls absorb attacker damage first. Catapults deal triple damage to walls, mages fly over them.
        let toTroops = a.magic * aMult;
        let siege = a.siege * aMult * 3;
        let normal = a.normal * aMult;
        if (wallHp > 0) {
            const siegeUsed = Math.min(wallHp, siege);
            wallHp -= siegeUsed;
            siege -= siegeUsed;
            const normalUsed = Math.min(wallHp, normal);
            wallHp -= normalUsed;
            normal -= normalUsed;
            if (wallHp <= 0) events.push('🧱 ¡Las murallas han caído!');
        }
        toTroops += normal + siege / 3;

        const defDamage = (d.normal + d.siege + d.magic + towerDamage) * dMult;
        const defLosses = applyDamage(def, toTroops);
        const atkLosses = applyDamage(atk, defDamage);
        subtract(def, defLosses);
        subtract(atk, atkLosses);

        if (describeLosses(defLosses)) events.push(`🗡️ Defensores caídos: ${describeLosses(defLosses)}`);
        if (describeLosses(atkLosses)) events.push(`☠️ Tus bajas: ${describeLosses(atkLosses)}`);

        rounds.push({
            round: r,
            attackerDamage: Math.round((a.normal + a.siege + a.magic) * aMult),
            defenderDamage: Math.round(defDamage),
            attackerCrit: atkCrit,
            defenderCrit: defCrit,
            wallHp: Math.max(0, Math.round(wallHp)),
            attackerHp: Math.round(totalHp(atk)),
            defenderHp: Math.round(totalHp(def)),
            events,
        });
    }

    const defTotal = defenderMaxHp + wallMax;
    const destroyed = (defenderMaxHp - totalHp(def)) + (wallMax - Math.max(0, wallHp));
    const destruction = defTotal <= 0 ? 1 : Math.min(1, destroyed / defTotal);
    const defenderWiped = troopCount(def.counts) === 0 && wallHp <= 0;

    let stars = 0;
    if (destruction >= 0.5) stars++;
    if (wallHp <= 0 && destruction >= 0.5) stars++;
    if (defenderWiped) stars++;

    const attackerLosses = emptyTroops();
    const defenderLosses = emptyTroops();
    for (const id of TROOP_IDS) {
        attackerLosses[id] = startAtk[id] - atk.counts[id];
        defenderLosses[id] = startDef[id] - def.counts[id];
    }

    return {
        won: stars > 0,
        stars,
        destruction,
        rounds,
        wallMaxHp: wallMax,
        attackerMaxHp: Math.round(attackerMaxHp),
        defenderMaxHp: Math.round(defenderMaxHp),
        attackerLosses,
        defenderLosses,
        seed,
    };
}
