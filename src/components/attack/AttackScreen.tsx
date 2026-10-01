import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { useGame } from '../../core/GameContext';
import { GameConfig } from '../../config/GameConfig';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import type { TroopId } from '../../core/GameState';
import { AttackSim, BATTLE_SECONDS } from '../../core/pvp/AttackSim';
import { PvpManager } from '../../core/pvp/PvpManager';
import { pvpService } from '../../core/pvp/PvpService';
import { computeOutcome, leagueFor, type PvpOutcome } from '../../core/pvp/PvpRules';
import { createSystemVillage, hashString } from '../../core/pvp/BotFactory';
import type { VillageSnapshot } from '../../core/pvp/PvpTypes';
import { EffectManager } from '../../core/EffectManager';
import { RtsControls, SceneLights } from '../village/VillageScene';
import { VillageTerrain, Walls } from '../village/VillageTerrain';
import { BuildingActor, EffectActor, ProjectileActor, UnitActor } from './AttackActors';
import { AVATAR_IMAGES, TROOP_ICONS } from '../troopIcons';

import { getKingdomConfig } from '../../config/KingdomsConfig';

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];
const TAP_TOLERANCE = 8;

/** Runs the simulation every frame and re-renders the entity lists when they change. */
const SimWorld: React.FC<{ sim: AttackSim; running: boolean; onTick: () => void }> = ({ sim, running, onTick }) => {
  const [, setVersion] = useState(0);
  const seen = useRef(-1);
  const hudTimer = useRef(0);
  useFrame((_, dt) => {
    if (running) sim.update(dt);
    if (sim.version !== seen.current) {
      seen.current = sim.version;
      setVersion(sim.version);
    }
    hudTimer.current += dt;
    if (hudTimer.current > 0.2) { hudTimer.current = 0; onTick(); }
  });

  const broken = useMemo(() => new Set(sim.walls.map((w, i) => (w.destroyed ? i : -1)).filter(i => i >= 0)), [sim.walls, sim.version]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Walls level={sim.village.wallsLevel} broken={broken} kingdom={sim.village.kingdom} />
      {sim.buildings.map(b => <BuildingActor key={b.id} b={b} />)}
      {sim.units.filter(u => !u.dead).map(u => <UnitActor key={u.id} u={u} />)}
      {sim.projectiles.map(p => <ProjectileActor key={p.id} p={p} />)}
      {sim.effects.map(e => <EffectActor key={e.id} e={e} />)}
    </>
  );
};

/** Red zone where troops can't be dropped (inside the walls). */
const NoDeployZone: React.FC<{ visible: boolean }> = ({ visible }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={visible}>
    <planeGeometry args={[(VILLAGE_HALF + 1.2) * 2, (VILLAGE_HALF + 1.2) * 2]} />
    <meshBasicMaterial color="#ff4757" transparent opacity={0.12} depthWrite={false} />
  </mesh>
);

export const AttackScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, completeAttack, payCoins } = useGame();
  const [opponent, setOpponent] = useState<VillageSnapshot | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sim, setSim] = useState<AttackSim | null>(null);
  const [selected, setSelected] = useState<TroopId | 'spell' | null>(null);
  const [burst, setBurst] = useState(false);
  const [, setTick] = useState(0);
  const [outcome, setOutcome] = useState<PvpOutcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const seedRef = useRef(0);
  const finishedRef = useRef(false);

  const nextCost = 10 * Math.max(1, state.level) * 5;
  const hasEnergy = state.energy >= GameConfig.pvp.energyCost;

  // Find an opponent (and search again with "Next")
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSim(null);
    pvpService.findOpponents(PvpManager.buildSnapshot(state), 1, refresh)
      .then(list => {
        if (cancelled) return;
        let opp = list[0];
        const myName = (state.playerName || '').trim().toLowerCase();

        // 100% GUARANTEE: Never attack yourself under any circumstance!
        if (!opp || opp.playerId === state.playerId || (opp.name || '').trim().toLowerCase() === myName) {
          const sysSeed = hashString(`${state.playerId}:${Date.now()}:${refresh}`);
          opp = createSystemVillage(sysSeed, state.trophies);
        }

        const seed = hashString(`${opp.playerId}:${Date.now()}`);
        seedRef.current = seed;
        setOpponent(opp);
        // Lock this village so other players cannot attack it concurrently
        pvpService.lockVillageForAttack(opp.playerId);
        setSim(new AttackSim(PvpManager.buildArmy(state, state.troops), opp, seed));
        const first = TROOP_IDS.find(id => state.troops[id] > 0);
        setSelected(first ?? null);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 1500);
    return () => clearTimeout(id);
  }, [message]);

  const onTick = () => {
    setTick(t => t + 1);
    if (sim && sim.finished && !finishedRef.current && opponent) {
      finishedRef.current = true;
      if (!sim.started) return;
      const result = sim.toResult(seedRef.current);
      setOutcome(completeAttack(opponent, result));
      if (result.stars > 0) EffectManager.fireVictoryConfetti();
    }
  };

  const onGroundTap = (e: ThreeEvent<MouseEvent>) => {
    if (!sim || sim.finished || e.delta > TAP_TOLERANCE || !selected) return;
    const { x, z } = e.point;
    if (selected === 'spell') {
      if (sim.castGodSpell(x, z)) setSelected(TROOP_IDS.find(id => sim.remaining[id] > 0) ?? null);
      return;
    }
    if (!hasEnergy && !sim.started) { setMessage('⚡ Necesitas energía para atacar'); return; }
    if (!AttackSim.isDeployable(x, z)) { setMessage('Suelta tus tropas fuera de la zona roja'); return; }
    const n = sim.deploy(selected, x, z, burst ? 5 : 1);
    if (n === 0) setMessage('No te quedan de esas tropas');
    else if (sim.remaining[selected] === 0) setSelected(TROOP_IDS.find(id => sim.remaining[id] > 0) ?? (sim.godSpellUsed || !state.attackGod ? null : 'spell'));
  };

  const next = () => {
    if (!payCoins(nextCost)) { setMessage('Oro insuficiente'); return; }
    if (opponent) pvpService.unlockVillage(opponent.playerId);
    finishedRef.current = false;
    setRefresh(r => r + 1);
  };

  const handleReturnHome = () => {
    if (opponent && (!sim || !sim.started)) {
      pvpService.unlockVillage(opponent.playerId);
    }
    onClose();
  };

  const endBattle = () => {
    if (!sim) return;
    if (!sim.started) { handleReturnHome(); return; }
    sim.surrender();
    onTick();
  };

  // Preview of what's at stake
  const preview = useMemo(() => {
    if (!opponent) return null;
    const win = computeOutcome({ won: true, stars: 3, destruction: 1 } as never, state.trophies, opponent.trophies, opponent.lootableCoins);
    const lose = computeOutcome({ won: false, stars: 0, destruction: 0 } as never, state.trophies, opponent.trophies, opponent.lootableCoins);
    return { win: win.attackerTrophiesDelta, lose: lose.attackerTrophiesDelta };
  }, [opponent, state.trophies]);

  const timeLeft = sim ? (sim.started ? sim.timeLeft : BATTLE_SECONDS) : BATTLE_SECONDS;
  const mm = Math.floor(timeLeft / 60), ss = Math.floor(timeLeft % 60).toString().padStart(2, '0');
  const god = state.attackGod ? GameConfig.gods[state.attackGod] : null;

  const oppKingdom = getKingdomConfig(opponent?.kingdom);
  const oppTheme = oppKingdom.visual;

  return createPortal(
    <div className="attack-screen">
      {sim && opponent && (
        <Canvas shadows camera={{ position: [0, 30, 30], fov: 40 }} className="village-canvas">
          <color attach="background" args={[oppTheme.skyColor]} />
          <fog attach="fog" args={[oppTheme.fogColor, oppTheme.fogNear, oppTheme.fogFar]} />
          <SceneLights theme={oppTheme} />
          <RtsControls />
          <group onClick={onGroundTap}>
            <VillageTerrain seed={hashString(opponent.playerId) % 1000} kingdom={opponent.kingdom} />
          </group>
          <NoDeployZone visible={!!selected && selected !== 'spell' && !sim.finished} />
          <SimWorld key={seedRef.current} sim={sim} running={!outcome} onTick={onTick} />
        </Canvas>
      )}

      {loading && <div className="attack-loading"><div className="attack-loading-cloud">☁️</div>Buscando rival…</div>}

      {sim && opponent && !outcome && (
        <>
          <div className="attack-top-left">
            <div className="hud-profile">
              <img src={AVATAR_IMAGES[opponent.avatar]} alt="" />
              <div className="flex-col">
                <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                  <b>{opponent.name}</b>
                  {opponent.isSystemVillage ? (
                    <span style={{ fontSize: '9px', background: '#3742fa', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      SISTEMA
                    </span>
                  ) : (
                    <span style={{ fontSize: '9px', background: '#2ed573', color: '#1a1100', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                      JUGADOR
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-gold)' }}>
                  {oppKingdom.icon} {oppKingdom.name}
                </span>
                <span>{leagueFor(opponent.trophies).icon} {opponent.trophies} 🏆 · Nv.{opponent.level}</span>
              </div>
            </div>
            <div className="attack-loot">Botín disponible: <b>🪙 {opponent.lootableCoins}</b></div>
            {!sim.started && preview && (
              <div className="attack-loot">Victoria <b style={{ color: '#7bed9f' }}>+{preview.win}🏆</b> · Derrota <b style={{ color: '#ff6b6b' }}>{preview.lose}🏆</b></div>
            )}
          </div>

          <div className="attack-top-center">
            <div className="attack-timer">{sim.started ? `${mm}:${ss}` : 'Suelta tus tropas'}</div>
            <div className="attack-stars">
              {[0, 1, 2].map(i => <span key={i} className={i < sim.stars ? 'on' : ''}>★</span>)}
              <b>{Math.round(sim.destruction * 100)}%</b>
            </div>
          </div>

          <div className="attack-top-right">
            {!sim.started ? (
              <>
                <button className="attack-next" onClick={next}>Siguiente ⏭<span>🪙 {nextCost}</span></button>
                <button className="attack-end" onClick={handleReturnHome}>Volver a casa</button>
              </>
            ) : (
              <button className="attack-end" onClick={endBattle}>🏳️ Terminar batalla</button>
            )}
          </div>

          <div className="attack-bar">
            {TROOP_IDS.filter(id => state.troops[id] > 0).map(id => (
              <button key={id}
                className={`troop-card ${selected === id ? 'selected' : ''}`}
                disabled={sim.remaining[id] === 0}
                onClick={() => setSelected(id)}>
                <span className="troop-card-count">×{sim.remaining[id]}</span>
                <span className="troop-card-icon">{TROOP_ICONS[id]}</span>
                <span className="troop-card-name">{GameConfig.troops[id].name}</span>
              </button>
            ))}
            {god && (
              <button className={`troop-card spell ${selected === 'spell' ? 'selected' : ''}`}
                disabled={sim.godSpellUsed}
                onClick={() => setSelected('spell')}
                style={{ borderColor: god.color }}>
                <span className="troop-card-count">{sim.godSpellUsed ? '✓' : '×1'}</span>
                <span className="troop-card-icon">{god.icon}</span>
                <span className="troop-card-name">{god.name}</span>
              </button>
            )}
            <button className={`troop-card burst ${burst ? 'selected' : ''}`} onClick={() => setBurst(b => !b)}>
              <span className="troop-card-icon" style={{ fontSize: '18px' }}>{burst ? '×5' : '×1'}</span>
              <span className="troop-card-name">Por toque</span>
            </button>
            {TROOP_IDS.every(id => state.troops[id] === 0) && (
              <div className="attack-empty">No tienes tropas: entrénalas en el Cuartel</div>
            )}
          </div>

          {selected === 'spell' && god && <div className="attack-hint">Toca el mapa para lanzar el poder de {god.name}</div>}
          {message && <div className="attack-hint warn">{message}</div>}
        </>
      )}

      {sim && opponent && outcome && (
        <div className="attack-result-wrap"><div className="attack-result animate-pop">
          <h1 className="title-clash" style={{ color: sim.stars > 0 ? 'var(--accent-gold)' : 'var(--accent-danger)' }}>
            {sim.stars > 0 ? '¡Victoria!' : 'Derrota'}
          </h1>
          <div className="attack-stars big">
            {[0, 1, 2].map(i => <span key={i} className={i < sim.stars ? 'on' : ''}>★</span>)}
          </div>
          <p>Destrucción total: <b>{Math.round(sim.destruction * 100)}%</b></p>
          <div className="attack-result-rows">
            <div><span>Botín</span><b style={{ color: 'var(--accent-gold)' }}>+{outcome.coinsStolen} 🪙</b></div>
            <div><span>Trofeos</span><b style={{ color: outcome.attackerTrophiesDelta >= 0 ? '#7bed9f' : '#ff6b6b' }}>{outcome.attackerTrophiesDelta >= 0 ? '+' : ''}{outcome.attackerTrophiesDelta} 🏆</b></div>
            <div>
              <span>Tropas perdidas</span>
              <b>{TROOP_IDS.filter(id => sim.attackerLosses[id] > 0).map(id => `${TROOP_ICONS[id]}${sim.attackerLosses[id]}`).join(' ') || '—'}</b>
            </div>
          </div>
          <button className="btn-upgrade" onClick={onClose} style={{ width: '100%', padding: '14px', fontSize: '16px' }}>Volver a casa</button>
        </div></div>
      )}
    </div>,
    document.body,
  );
};
