import { GameConfig } from '../../config/GameConfig';
import {
    BUILDINGS, VILLAGE_HALF, buildingHp, defenseDamage, type BuildingType,
} from '../../config/BuildingsConfig';
import { emptyTroops, type GodId, type TroopCounts, type TroopId } from '../GameState';
import { GodManager, type GodEffects } from '../GodManager';
import { layoutOf } from './BotFactory';
import { mulberry32 } from './PvpBattle';
import type { AttackArmy, PvpBattleResult, VillageSnapshot } from './PvpTypes';

/** Real-time combat stats per troop type (tiles, seconds). */
export const UNIT_STATS: Record<TroopId, { hp: number; dps: number; speed: number; range: number; flying?: boolean; prefers?: 'defense'; healer?: boolean; siege?: boolean }> = {
    infantry: { hp: 60, dps: 16, speed: 1.7, range: 0.7 },
    archers: { hp: 30, dps: 14, speed: 1.6, range: 3.5 },
    cavalry: { hp: 170, dps: 20, speed: 2.4, range: 0.9, prefers: 'defense' },
    mages: { hp: 45, dps: 50, speed: 1.4, range: 3, flying: true },
    catapults: { hp: 160, dps: 90, speed: 0.8, range: 5.5, siege: true },
    healers: { hp: 80, dps: 0, speed: 1.5, range: 3, healer: true },
};

export const BATTLE_SECONDS = 120;
const STEP = 1 / 30;
const WALL_EDGE = VILLAGE_HALF + 0.4;
const DEPLOY_EDGE = VILLAGE_HALF + 1.2;
const GARRISON_TRIGGER = 9;   // tiles from the townhall
const DEFENDER_AGGRO = 3.5;   // attackers fight defender troops this close

export interface SimBuilding {
    id: number;
    type: BuildingType;
    level: number;
    x: number; z: number;     // centre
    size: number;
    hp: number; maxHp: number;
    destroyed: boolean;
    cooldown: number;
    aim: number;              // rotation for turrets
}

export interface SimWall { id: number; x: number; z: number; horizontal: boolean; hp: number; maxHp: number; destroyed: boolean }

export interface SimUnit {
    id: number;
    side: 'attacker' | 'defender';
    type: TroopId;
    x: number; z: number;
    hp: number; maxHp: number;
    dead: boolean;
    cooldown: number;
    targetKind: 'building' | 'wall' | 'unit' | null;
    targetId: number;
    heading: number;
    buffUntil: number;
}

export interface SimProjectile {
    id: number;
    fromX: number; fromY: number; fromZ: number;
    toX: number; toZ: number;
    t: number; duration: number;
    kind: 'cannonball' | 'arrow' | 'magic' | 'boulder' | 'lightning';
}

export interface SimEffect { id: number; kind: 'lightning' | 'heal' | 'quake' | 'shadow' | 'explosion'; x: number; z: number; t: number; radius: number }

interface PendingHit { projectileId: number; delay: number; apply: () => void }

/** Deterministic, fixed-step real-time battle between deployed troops and a village snapshot. */
export class AttackSim {
    readonly buildings: SimBuilding[] = [];
    readonly walls: SimWall[] = [];
    readonly units: SimUnit[] = [];
    projectiles: SimProjectile[] = [];
    effects: SimEffect[] = [];
    time = 0;
    started = false;
    finished = false;
    /** Increments whenever entities are added or removed (so the view knows to re-render). */
    version = 0;

    readonly remaining: TroopCounts;
    readonly deployed: TroopCounts = emptyTroops();
    readonly attackerLosses: TroopCounts = emptyTroops();
    readonly defenderLosses: TroopCounts = emptyTroops();
    godSpellUsed = false;

    private nextId = 1;
    private rng: () => number;
    private pending: PendingHit[] = [];
    private garrisonReleased = false;
    private defenseLightningTimer = 10;
    private readonly atkGod: GodEffects;
    private readonly defGod: GodEffects;
    private readonly atkDmgMult: number;
    private readonly atkHpMult: number;
    private readonly atkCrit: number;
    private readonly defDmgMult: number;
    private readonly defUnitDmgMult: number;
    private readonly totalBuildings: number;

    readonly army: AttackArmy;
    readonly village: VillageSnapshot;

    constructor(army: AttackArmy, village: VillageSnapshot, seed: number) {
        this.army = army;
        this.village = village;
        this.rng = mulberry32(seed);
        this.remaining = { ...army.troops };
        this.atkGod = GodManager.getEffects(army.god, army.godLevel);
        this.defGod = GodManager.getEffects(village.defenseGod, village.defenseGodLevel);

        const up = (id: 'attackPower' | 'troopHealth', lvl: number) => {
            if (lvl <= 0) return 0;
            const u = GameConfig.upgrades[id];
            return u.effectBase * Math.pow(u.effectMultiplier, lvl - 1) / 100;
        };
        const hero = (lvl: number) => 1 + (lvl - 1) * GameConfig.heroPowerMultiplierPerLevel;
        this.atkDmgMult = hero(army.heroLevel) * (1 + up('attackPower', army.attackLevel)) * (1 + this.atkGod.attackBonus);
        this.atkHpMult = (1 + this.atkGod.hpBonus) * (1 + up('troopHealth', army.armorLevel));
        this.atkCrit = army.critLevel * GameConfig.upgrades.critRate.effectBase / 100 + this.atkGod.critChance;
        this.defDmgMult = (1 + this.defGod.attackBonus) * (1 + up('attackPower', village.attackLevel));
        this.defUnitDmgMult = hero(village.heroLevel) * this.defDmgMult;

        const isFrostVillage = village.kingdom === 'frost';
        const villageHpMult = isFrostVillage ? 1.25 : 1.0;
        const wallHpMult = isFrostVillage ? 1.30 : 1.0;

        for (const b of layoutOf(village)) {
            const size = BUILDINGS[b.type].size;
            const maxHp = Math.round(buildingHp(b.type, b.level) * (1 + this.defGod.hpBonus) * villageHpMult);
            this.buildings.push({
                id: this.nextId++, type: b.type, level: b.level, x: b.x + size / 2, z: b.z + size / 2, size,
                hp: maxHp, maxHp, destroyed: false, cooldown: 0, aim: 0,
            });
        }
        this.totalBuildings = this.buildings.length;

        if (village.wallsLevel > 0) {
            const wallHp = Math.round((150 + village.wallsLevel * 120) * (1 + this.defGod.wallBonus) * wallHpMult);
            for (let i = -VILLAGE_HALF; i < VILLAGE_HALF; i++) {
                for (const [x, z, h] of [[i + 0.5, -WALL_EDGE, true], [i + 0.5, WALL_EDGE, true], [-WALL_EDGE, i + 0.5, false], [WALL_EDGE, i + 0.5, false]] as const) {
                    this.walls.push({ id: this.nextId++, x, z, horizontal: h, hp: wallHp, maxHp: wallHp, destroyed: false });
                }
            }
        }
    }

    // ---------- Queries ----------

    static isDeployable(x: number, z: number): boolean {
        return Math.max(Math.abs(x), Math.abs(z)) > DEPLOY_EDGE && Math.max(Math.abs(x), Math.abs(z)) < VILLAGE_HALF + 40;
    }

    get destruction(): number {
        if (this.totalBuildings === 0) return 1;
        return this.buildings.filter(b => b.destroyed).length / this.totalBuildings;
    }

    get townhallDestroyed(): boolean {
        return this.buildings.some(b => b.type === 'townhall' && b.destroyed);
    }

    get stars(): number {
        let s = 0;
        if (this.destruction >= 0.5) s++;
        if (this.townhallDestroyed) s++;
        if (this.destruction >= 1) s++;
        return s;
    }

    get timeLeft(): number {
        return Math.max(0, BATTLE_SECONDS - this.time);
    }

    private aliveAttackers() { return this.units.filter(u => u.side === 'attacker' && !u.dead); }

    // ---------- Player actions ----------

    deploy(type: TroopId, x: number, z: number, count = 1): number {
        if (this.finished || !AttackSim.isDeployable(x, z)) return 0;
        const n = Math.min(count, this.remaining[type]);
        for (let i = 0; i < n; i++) {
            const angle = this.rng() * Math.PI * 2, r = n > 1 ? this.rng() * 0.8 : 0;
            this.spawn('attacker', type, x + Math.cos(angle) * r, z + Math.sin(angle) * r);
        }
        this.remaining[type] -= n;
        this.deployed[type] += n;
        if (n > 0) this.started = true;
        return n;
    }

    /** Active power of the attacking god, cast at a point. */
    castGodSpell(x: number, z: number): boolean {
        const god = this.army.god;
        if (!god || this.godSpellUsed || this.finished) return false;
        this.godSpellUsed = true;
        this.started = true;
        const lvl = Math.max(1, this.army.godLevel);
        const radius = 3.5;
        const inRange = <T extends { x: number; z: number }>(list: T[], r = radius) => list.filter(e => Math.hypot(e.x - x, e.z - z) <= r);
        switch (god as GodId) {
            case 'tharok': {
                const dmg = 120 + 60 * lvl;
                inRange(this.buildings.filter(b => !b.destroyed)).forEach(b => this.damageBuilding(b, dmg));
                inRange(this.units.filter(u => u.side === 'defender' && !u.dead)).forEach(u => this.damageUnit(u, dmg));
                this.addEffect('lightning', x, z, radius);
                break;
            }
            case 'aurelia':
                inRange(this.aliveAttackers(), radius + 1).forEach(u => { u.hp = Math.min(u.maxHp, u.hp + u.maxHp * (0.5 + 0.05 * lvl)); });
                this.addEffect('heal', x, z, radius + 1);
                break;
            case 'morvath': {
                const pct = 0.2 + 0.03 * lvl;
                inRange(this.buildings.filter(b => !b.destroyed), radius + 1).forEach(b => this.damageBuilding(b, b.maxHp * pct));
                inRange(this.walls.filter(w => !w.destroyed), radius + 1).forEach(w => this.damageWall(w, w.maxHp * 0.8));
                this.addEffect('quake', x, z, radius + 1);
                break;
            }
            case 'nyx':
                inRange(this.aliveAttackers(), radius + 1).forEach(u => { u.buffUntil = this.time + 8 + lvl; });
                this.addEffect('shadow', x, z, radius + 1);
                break;
        }
        this.version++;
        return true;
    }

    surrender() {
        this.finished = true;
    }

    // ---------- Simulation ----------

    /** Advances the battle by `dt` seconds of real time. */
    update(dt: number) {
        if (this.finished) return;
        let left = Math.min(dt, 0.25);
        while (left > 0) {
            const step = Math.min(STEP, left);
            this.step(step);
            left -= step;
        }
    }

    private step(dt: number) {
        if (this.started) this.time += dt;

        // Projectiles and delayed hits
        for (const p of this.projectiles) p.t += dt;
        const before = this.projectiles.length;
        this.projectiles = this.projectiles.filter(p => p.t < p.duration);
        for (const h of this.pending) h.delay -= dt;
        const due = this.pending.filter(h => h.delay <= 0);
        this.pending = this.pending.filter(h => h.delay > 0);
        due.forEach(h => h.apply());
        for (const e of this.effects) e.t += dt;
        this.effects = this.effects.filter(e => e.t < 1.2);
        if (this.projectiles.length !== before) this.version++;

        this.releaseGarrison();
        this.updateDefenses(dt);
        for (const u of this.units) if (!u.dead) this.updateUnit(u, dt);

        // Defender god: periodic lightning on the attackers
        if (this.defGod.lightning > 0 && this.started) {
            this.defenseLightningTimer -= dt;
            if (this.defenseLightningTimer <= 0) {
                this.defenseLightningTimer = 12;
                const targets = this.aliveAttackers();
                if (targets.length) {
                    const t = targets[Math.floor(this.rng() * targets.length)];
                    this.units.filter(u => u.side === 'attacker' && !u.dead && Math.hypot(u.x - t.x, u.z - t.z) < 2)
                        .forEach(u => this.damageUnit(u, this.defGod.lightning * 2));
                    this.addEffect('lightning', t.x, t.z, 2);
                }
            }
        }

        // End conditions
        const noneLeft = TROOP_IDS.every(id => this.remaining[id] === 0);
        if (this.timeLeft <= 0 || this.destruction >= 1 || (this.started && noneLeft && this.aliveAttackers().length === 0)) {
            this.finished = true;
        }
    }

    private spawn(side: 'attacker' | 'defender', type: TroopId, x: number, z: number) {
        const stats = UNIT_STATS[type];
        const troopLevel = side === 'attacker' ? (this.army.troopLevels?.[type] || 1) : 1;
        const levelHpMult = 1 + (troopLevel - 1) * 0.22;
        const hpMult = (side === 'attacker' ? this.atkHpMult : 1 + this.defGod.hpBonus) * levelHpMult;
        const hp = Math.round(stats.hp * hpMult);
        this.units.push({
            id: this.nextId++, side, type, x, z, hp, maxHp: hp, dead: false, cooldown: this.rng() * 0.5,
            targetKind: null, targetId: 0, heading: 0, buffUntil: 0,
        });
        this.version++;
    }

    private releaseGarrison() {
        if (this.garrisonReleased) return;
        const th = this.buildings.find(b => b.type === 'townhall');
        if (!th) return;
        const near = this.aliveAttackers().some(u => Math.hypot(u.x - th.x, u.z - th.z) < GARRISON_TRIGGER) || (th.destroyed);
        if (!near) return;
        this.garrisonReleased = true;
        for (const id of TROOP_IDS) {
            for (let i = 0; i < (this.village.garrison[id] || 0); i++) {
                const a = this.rng() * Math.PI * 2;
                this.spawn('defender', id, th.x + Math.cos(a) * 1.5, th.z + Math.sin(a) * 1.5);
            }
        }
    }

    private updateDefenses(dt: number) {
        for (const b of this.buildings) {
            const def = BUILDINGS[b.type];
            if (b.destroyed || !def.isDefense) continue;
            b.cooldown -= dt;
            if (b.cooldown > 0) continue;
            let best: SimUnit | null = null, bestD = Infinity;
            for (const u of this.units) {
                if (u.dead || u.side !== 'attacker') continue;
                if (b.type === 'cannon' && UNIT_STATS[u.type].flying) continue;
                const d = Math.hypot(u.x - b.x, u.z - b.z);
                if (d <= (def.range || 0) && d < bestD) { best = u; bestD = d; }
            }
            if (!best) continue;
            b.cooldown = def.fireRate || 1;
            b.aim = Math.atan2(best.x - b.x, best.z - b.z);
            const crit = this.rng() < this.defGod.critChance ? 2 : 1;
            const dmg = defenseDamage(b.type, b.level) * this.defDmgMult * crit * 1.6;
            const target = best;
            const duration = b.type === 'cannon' ? 0.35 : 0.25;
            const splash = b.type === 'cannon' ? 0 : 0;
            this.fire(b.x, b.type === 'archertower' ? 2.8 : 0.8, b.z, target.x, target.z, duration, b.type === 'cannon' ? 'cannonball' : 'arrow', () => {
                if (splash > 0) {
                    this.units.filter(u => u.side === 'attacker' && !u.dead && Math.hypot(u.x - target.x, u.z - target.z) < splash).forEach(u => this.damageUnit(u, dmg));
                } else if (!target.dead) this.damageUnit(target, dmg);
            });
        }
    }

    private fire(fx: number, fy: number, fz: number, tx: number, tz: number, duration: number, kind: SimProjectile['kind'], apply: () => void) {
        const id = this.nextId++;
        this.projectiles.push({ id, fromX: fx, fromY: fy, fromZ: fz, toX: tx, toZ: tz, t: 0, duration, kind });
        this.pending.push({ projectileId: id, delay: duration, apply });
        this.version++;
    }

    private addEffect(kind: SimEffect['kind'], x: number, z: number, radius: number) {
        this.effects.push({ id: this.nextId++, kind, x, z, t: 0, radius });
        this.version++;
    }

    private damageBuilding(b: SimBuilding, dmg: number) {
        if (b.destroyed) return;
        b.hp -= dmg;
        if (b.hp <= 0) {
            b.hp = 0;
            b.destroyed = true;
            this.addEffect('explosion', b.x, b.z, b.size * 0.6);
        }
    }

    private damageWall(w: SimWall, dmg: number) {
        if (w.destroyed) return;
        w.hp -= dmg;
        if (w.hp <= 0) { w.hp = 0; w.destroyed = true; this.version++; }
    }

    private damageUnit(u: SimUnit, dmg: number) {
        if (u.dead) return;
        u.hp -= dmg;
        if (u.hp <= 0) {
            u.dead = true;
            if (u.side === 'attacker') this.attackerLosses[u.type]++;
            else this.defenderLosses[u.type]++;
            this.version++;
        }
    }

    /** First intact wall segment crossed on the way from (x,z) to the target, if any. */
    private blockingWall(u: SimUnit, tx: number, tz: number): SimWall | null {
        if (this.walls.length === 0 || UNIT_STATS[u.type].flying || u.side === 'defender') return null;
        const inside = (px: number, pz: number) => Math.max(Math.abs(px), Math.abs(pz)) < WALL_EDGE;
        if (inside(u.x, u.z) || !inside(tx, tz)) return null;
        // Walk along the segment to find where it crosses the ring
        const steps = 40;
        let cx = u.x, cz = u.z;
        for (let i = 1; i <= steps; i++) {
            const px = u.x + (tx - u.x) * i / steps, pz = u.z + (tz - u.z) * i / steps;
            if (inside(px, pz)) break;
            cx = px; cz = pz;
        }
        let best: SimWall | null = null, bestD = Infinity;
        for (const w of this.walls) {
            const d = Math.hypot(w.x - cx, w.z - cz);
            if (d < bestD) { best = w; bestD = d; }
        }
        return best && !best.destroyed && bestD < 1.5 ? best : null;
    }

    private pickTarget(u: SimUnit) {
        const stats = UNIT_STATS[u.type];
        const enemySide = u.side === 'attacker' ? 'defender' : 'attacker';

        // Fight enemy troops that are close (defenders always hunt attackers)
        let nearUnit: SimUnit | null = null, nearD = u.side === 'defender' ? Infinity : DEFENDER_AGGRO;
        if (!stats.siege || u.side === 'defender') {
            for (const o of this.units) {
                if (o.dead || o.side !== enemySide) continue;
                const d = Math.hypot(o.x - u.x, o.z - u.z);
                if (d < nearD) { nearUnit = o; nearD = d; }
            }
        }
        if (nearUnit) { u.targetKind = 'unit'; u.targetId = nearUnit.id; return; }
        if (u.side === 'defender') { u.targetKind = null; return; }

        const alive = this.buildings.filter(b => !b.destroyed);
        let pool = alive;
        if (stats.prefers === 'defense') {
            const defenses = alive.filter(b => BUILDINGS[b.type].isDefense);
            if (defenses.length) pool = defenses;
        }
        let best: SimBuilding | null = null, bestD = Infinity;
        for (const b of pool) {
            const d = Math.hypot(b.x - u.x, b.z - u.z) - b.size / 2;
            if (d < bestD) { best = b; bestD = d; }
        }
        if (!best) { u.targetKind = null; return; }
        const wall = this.blockingWall(u, best.x, best.z);
        if (wall) { u.targetKind = 'wall'; u.targetId = wall.id; return; }
        u.targetKind = 'building'; u.targetId = best.id;
    }

    private updateUnit(u: SimUnit, dt: number) {
        const stats = UNIT_STATS[u.type];
        u.cooldown -= dt;

        // Kingdom bonuses:
        // Frost village cold aura slows attackers (15% slower speed and attack)
        // Emerald army increases attacker march speed by 10%
        let speedMult = 1.0;
        let cooldownMult = 1.0;
        if (u.side === 'attacker') {
            if (this.village.kingdom === 'frost') {
                speedMult *= 0.85;
                cooldownMult *= 1.15;
            }
            if (this.army.kingdom === 'emerald') {
                speedMult *= 1.10;
            }
        }

        // Healers: heal the most hurt ally in range, follow the army
        if (stats.healer) {
            const allies = this.units.filter(o => !o.dead && o.side === u.side && o.id !== u.id && !UNIT_STATS[o.type].healer);
            let hurt: SimUnit | null = null, worst = 1;
            for (const a of allies) {
                const ratio = a.hp / a.maxHp;
                if (Math.hypot(a.x - u.x, a.z - u.z) <= stats.range && ratio < worst) { hurt = a; worst = ratio; }
            }
            if (hurt && u.cooldown <= 0) {
                u.cooldown = 1 * cooldownMult;
                hurt.hp = Math.min(hurt.maxHp, hurt.hp + 25 * (u.side === 'attacker' ? this.atkHpMult : 1));
                this.addEffect('heal', hurt.x, hurt.z, 0.6);
            }
            // follow closest ally
            let lead: SimUnit | null = null, ld = Infinity;
            for (const a of allies) { const d = Math.hypot(a.x - u.x, a.z - u.z); if (d < ld) { lead = a; ld = d; } }
            if (lead && ld > 2) this.moveTowards(u, lead.x, lead.z, stats.speed * dt * speedMult);
            return;
        }

        // Validate current target
        const target = this.resolveTarget(u);
        if (!target || u.cooldown <= -0.5) this.pickTarget(u);
        const t = this.resolveTarget(u);
        if (!t) return;

        const reach = stats.range + (u.targetKind === 'building' ? (t as SimBuilding).size / 2 : u.targetKind === 'wall' ? 0.3 : 0.3);
        const dist = Math.hypot(t.x - u.x, t.z - u.z);
        if (dist > reach) {
            this.moveTowards(u, t.x, t.z, stats.speed * dt * speedMult);
            return;
        }
        u.heading = Math.atan2(t.x - u.x, t.z - u.z);
        if (u.cooldown > 0) return;
        u.cooldown = 1 * cooldownMult;

        const mult = u.side === 'attacker' ? this.atkDmgMult : this.defUnitDmgMult;
        const crit = u.side === 'attacker' && (this.rng() < this.atkCrit || u.buffUntil > this.time) ? 2 : 1;
        const troopLevel = u.side === 'attacker' ? (this.army.troopLevels?.[u.type] || 1) : 1;
        const levelDmgMult = 1 + (troopLevel - 1) * 0.22;
        let dmg = stats.dps * mult * crit * levelDmgMult;
        if (stats.siege && u.targetKind === 'wall') dmg *= 3;
        const kind: SimProjectile['kind'] | null = u.type === 'archers' ? 'arrow' : u.type === 'mages' ? 'magic' : u.type === 'catapults' ? 'boulder' : null;

        const apply = () => {
            if (u.targetKind === 'building') this.damageBuilding(t as SimBuilding, dmg);
            else if (u.targetKind === 'wall') this.damageWall(t as SimWall, dmg);
            else if (u.targetKind === 'unit') this.damageUnit(t as SimUnit, dmg);
        };
        const kindAtFire = u.targetKind;
        if (kind) {
            this.fire(u.x, 0.6, u.z, t.x, t.z, kind === 'boulder' ? 0.7 : 0.3, kind, () => {
                if (kindAtFire === 'building') this.damageBuilding(t as SimBuilding, dmg);
                else if (kindAtFire === 'wall') this.damageWall(t as SimWall, dmg);
                else if (kindAtFire === 'unit') this.damageUnit(t as SimUnit, dmg);
            });
        } else apply();
    }

    private resolveTarget(u: SimUnit): { x: number; z: number } | null {
        if (u.targetKind === 'building') {
            const b = this.buildings.find(o => o.id === u.targetId);
            return b && !b.destroyed ? b : null;
        }
        if (u.targetKind === 'wall') {
            const w = this.walls.find(o => o.id === u.targetId);
            return w && !w.destroyed ? w : null;
        }
        if (u.targetKind === 'unit') {
            const o = this.units.find(v => v.id === u.targetId);
            return o && !o.dead ? o : null;
        }
        return null;
    }

    private moveTowards(u: SimUnit, tx: number, tz: number, step: number) {
        const dx = tx - u.x, dz = tz - u.z;
        const d = Math.hypot(dx, dz);
        if (d < 1e-6) return;
        u.heading = Math.atan2(dx, dz);
        const k = Math.min(1, step / d);
        let nx = u.x + dx * k, nz = u.z + dz * k;
        // Ground troops can't walk through intact walls
        if (!UNIT_STATS[u.type].flying && this.walls.length > 0 && u.side === 'attacker') {
            const was = Math.max(Math.abs(u.x), Math.abs(u.z)), now = Math.max(Math.abs(nx), Math.abs(nz));
            if (was >= WALL_EDGE + 0.25 && now < WALL_EDGE + 0.25) {
                const w = this.walls.reduce((a, b) => (Math.hypot(b.x - nx, b.z - nz) < Math.hypot(a.x - nx, a.z - nz) ? b : a));
                if (!w.destroyed) { nx = u.x; nz = u.z; u.targetKind = 'wall'; u.targetId = w.id; }
            }
        }
        u.x = nx; u.z = nz;
    }

    /** Converts the finished battle into the shared PvP result shape. */
    toResult(seed: number): PvpBattleResult {
        return {
            won: this.stars > 0,
            stars: this.stars,
            destruction: this.destruction,
            rounds: [],
            wallMaxHp: 0,
            attackerMaxHp: 0,
            defenderMaxHp: 0,
            attackerLosses: { ...this.attackerLosses },
            defenderLosses: { ...this.defenderLosses },
            seed,
        };
    }
}

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];
