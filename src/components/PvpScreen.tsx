import { useEffect, useState } from 'react';
import { useGame } from '../core/GameContext';
import { GameConfig } from '../config/GameConfig';
import { emptyTroops, type GodId, type TroopCounts, type TroopId } from '../core/GameState';
import { GodManager } from '../core/GodManager';
import { UpgradeManager } from '../core/UpgradeManager';
import { PvpManager } from '../core/pvp/PvpManager';
import { pvpService } from '../core/pvp/PvpService';
import { leagueFor, type PvpOutcome } from '../core/pvp/PvpRules';
import { wallMaxHp } from '../core/pvp/PvpBattle';
import type { PvpBattleResult, VillageSnapshot } from '../core/pvp/PvpTypes';
import { PvpBattleScreen } from './PvpBattleScreen';
import { AVATAR_IMAGES, TROOP_ICONS } from './troopIcons';

type Tab = 'attack' | 'defense' | 'gods' | 'log';
const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];
const GOD_IDS = Object.keys(GameConfig.gods) as GodId[];

const troopTotal = (t: TroopCounts) => TROOP_IDS.reduce((s, id) => s + (t[id] || 0), 0);
const troopPower = (t: TroopCounts) => TROOP_IDS.reduce((s, id) => s + (t[id] || 0) * GameConfig.troops[id].power, 0);

const panel: React.CSSProperties = {
  padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
};

const smallBtn: React.CSSProperties = { padding: '6px 10px', fontSize: '12px', minWidth: '40px' };

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

const TroopSummary = ({ troops }: { troops: TroopCounts }) => (
  <div className="flex-row" style={{ flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
    {TROOP_IDS.filter(id => troops[id] > 0).map(id => (
      <span key={id} style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 6px', borderRadius: '8px' }}>
        {TROOP_ICONS[id]} {troops[id]}
      </span>
    ))}
    {troopTotal(troops) === 0 && <span style={{ color: 'var(--text-secondary)' }}>Sin tropas</span>}
  </div>
);

export const PvpScreen: React.FC = () => {
  const { state, pvpMode, attackPlayer, moveTroops, unlockGod, levelUpGod, equipGod, purchaseUpgrade, markDefenseLogSeen } = useGame();
  const [tab, setTab] = useState<Tab>('attack');
  const [opponents, setOpponents] = useState<VillageSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [target, setTarget] = useState<VillageSnapshot | null>(null);
  const [selection, setSelection] = useState<TroopCounts>(emptyTroops());
  const [battle, setBattle] = useState<{ opponent: VillageSnapshot; result: PvpBattleResult; outcome: PvpOutcome } | null>(null);

  const league = leagueFor(state.trophies);
  const unseen = state.defenseLog.filter(e => !e.seen).length;
  const shieldLeft = state.shieldUntil - Date.now();

  useEffect(() => {
    if (tab !== 'attack') return;
    let cancelled = false;
    setLoading(true);
    pvpService.findOpponents(PvpManager.buildSnapshot(state), 3, refresh)
      .then(list => { if (!cancelled) setOpponents(list); })
      .catch(() => { if (!cancelled) setOpponents([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Only reload when the player asks for new rivals or trophies change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, refresh, state.trophies]);

  useEffect(() => {
    if (tab === 'log') markDefenseLogSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state.defenseLog.length]);

  const chooseTarget = (o: VillageSnapshot) => {
    setTarget(o);
    setSelection({ ...state.troops }); // send everyone by default
  };

  const setAmount = (id: TroopId, n: number) =>
    setSelection(s => ({ ...s, [id]: Math.max(0, Math.min(state.troops[id], n)) }));

  const launchAttack = () => {
    if (!target) return;
    const res = attackPlayer(target, selection);
    if (res) {
      setBattle({ opponent: target, ...res });
      setTarget(null);
    }
  };

  if (battle) {
    return (
      <PvpBattleScreen
        opponent={battle.opponent}
        result={battle.result}
        outcome={battle.outcome}
        onClose={() => { setBattle(null); setRefresh(r => r + 1); }}
      />
    );
  }

  const renderGodBadge = (godId: GodId | null, level: number) => godId ? (
    <span style={{ color: GameConfig.gods[godId].color, fontWeight: 700 }}>
      {GameConfig.gods[godId].icon} {GameConfig.gods[godId].name} Nv.{level}
    </span>
  ) : <span style={{ color: 'var(--text-secondary)' }}>Sin Dios</span>;

  // ---------- ATTACK ----------
  const renderAttack = () => {
    if (target) {
      const army = PvpManager.buildArmy(state, selection);
      const canAttack = PvpManager.canAttack(state, selection);
      return (
        <div className="two-col">
          <div className="flex-col gap-3">
          <div style={panel} className="flex-col gap-2">
            <div className="flex-row justify-between">
              <b>🎯 {target.name}</b>
              <span>🏆 {target.trophies}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              🧱 Murallas {wallMaxHp(target)} HP · {renderGodBadge(target.defenseGod, target.defenseGodLevel)}
            </div>
            <TroopSummary troops={target.garrison} />
          </div>
          <button className="btn-fight" disabled={!canAttack} onClick={launchAttack} style={{ padding: '14px', fontSize: '16px' }}>
            ⚔️ ¡Atacar! (⚡{GameConfig.pvp.energyCost})
          </button>
          {state.energy < GameConfig.pvp.energyCost && (
            <p style={{ fontSize: '12px', color: 'var(--accent-danger)', textAlign: 'center' }}>No tienes energía suficiente.</p>
          )}
          <button className="btn-primary" onClick={() => setTarget(null)} style={{ padding: '10px' }}>← Volver</button>
          </div>

          <div style={panel} className="flex-col gap-2">
            <div className="flex-row justify-between">
              <b>Elige tus guerreros</b>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⚔️ {troopPower(army.troops)}</span>
            </div>
            {TROOP_IDS.filter(id => state.troops[id] > 0).map(id => (
              <div key={id} className="troop-row">
                <span style={{ fontSize: '13px' }}>{TROOP_ICONS[id]} {GameConfig.troops[id].name}</span>
                <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                  <button className="btn-primary" style={smallBtn} onClick={() => setAmount(id, selection[id] - 1)}>−</button>
                  <span style={{ minWidth: '54px', textAlign: 'center', fontWeight: 700, fontSize: '13px' }}>
                    {selection[id]}/{state.troops[id]}
                  </span>
                  <button className="btn-primary" style={smallBtn} onClick={() => setAmount(id, selection[id] + 1)}>+</button>
                  <button className="btn-primary" style={smallBtn} onClick={() => setAmount(id, state.troops[id])}>Todo</button>
                </div>
              </div>
            ))}
            {troopTotal(state.troops) === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                No tienes tropas disponibles. Entrena en el Cuartel o recupéralas de la defensa.
              </p>
            )}
            <div style={{ fontSize: '12px' }}>
              Dios de ataque: {renderGodBadge(state.attackGod, state.attackGod ? GodManager.getLevel(state, state.attackGod) : 0)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-col gap-3">
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rivales cerca de tus trofeos</span>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} disabled={loading}
            onClick={() => setRefresh(r => r + 1)}>🔄 Buscar otros</button>
        </div>
        {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Buscando rivales…</p>}
        <div className="card-grid">
        {!loading && opponents.map(o => (
          <div key={o.playerId} style={panel} className="flex-col gap-2">
            <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
              <img src={AVATAR_IMAGES[o.avatar]} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-gold)' }} />
              <div className="flex-col" style={{ flex: 1 }}>
                <b style={{ fontSize: '14px' }}>{o.name}</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Nv.{o.level} · {leagueFor(o.trophies).icon} {o.trophies} {o.isBot && pvpMode === 'online' ? '· 🤖' : ''}
                </span>
              </div>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '13px' }}>🪙 {o.lootableCoins}</span>
            </div>
            <TroopSummary troops={o.garrison} />
            <div className="flex-row justify-between" style={{ fontSize: '12px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>🧱 {wallMaxHp(o)} HP · {renderGodBadge(o.defenseGod, o.defenseGodLevel)}</span>
              <button className="btn-fight" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={() => chooseTarget(o)}>Atacar</button>
            </div>
          </div>
        ))}
        </div>
      </div>
    );
  };

  // ---------- DEFENSE ----------
  const renderDefense = () => {
    const wallsLevel = state.upgrades.walls || 0;
    const wallsCost = UpgradeManager.getCost('walls', wallsLevel);
    const defensePreview = PvpManager.buildSnapshot(state);
    return (
      <div className="flex-col gap-3">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Deja guerreros en la guarnición: defenderán tu aldea cuando otros jugadores te ataquen. Las tropas en defensa no pueden atacar.
        </p>
        <div className="two-col">
        <div style={panel} className="flex-col gap-2">
          <div className="flex-row justify-between"><b>🛡️ Guarnición</b><span style={{ fontSize: '12px' }}>⚔️ {troopPower(state.garrison)}</span></div>
          {TROOP_IDS.filter(id => state.troops[id] > 0 || state.garrison[id] > 0).map(id => (
            <div key={id} className="troop-row">
              <span style={{ fontSize: '13px' }}>{TROOP_ICONS[id]} {GameConfig.troops[id].name}</span>
              <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                <button className="btn-primary" style={smallBtn} disabled={state.garrison[id] === 0}
                  onClick={() => moveTroops(id, 5, 'army')}>−5</button>
                <span style={{ fontSize: '12px', textAlign: 'center', minWidth: '70px' }}>
                  🛡️ <b>{state.garrison[id]}</b> · ⚔️ {state.troops[id]}
                </span>
                <button className="btn-success" style={smallBtn} disabled={state.troops[id] === 0}
                  onClick={() => moveTroops(id, 5, 'garrison')}>+5</button>
                <button className="btn-success" style={smallBtn} disabled={state.troops[id] === 0}
                  onClick={() => moveTroops(id, state.troops[id], 'garrison')}>Todo</button>
              </div>
            </div>
          ))}
          {PvpManager.totalTroops(state) === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Entrena tropas en el Cuartel primero.</p>
          )}
        </div>

        <div className="flex-col gap-3">
        <div style={panel} className="flex-col gap-2">
          <div className="flex-row justify-between">
            <b>🧱 Murallas Nv.{wallsLevel}</b>
            <span style={{ fontSize: '12px' }}>{wallMaxHp(defensePreview)} HP</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Absorben el daño enemigo antes que tus tropas. Las catapultas las destruyen rápido; los magos vuelan por encima.
          </p>
          <button className="btn-upgrade" disabled={state.coins < wallsCost} onClick={() => purchaseUpgrade('walls')} style={{ padding: '10px' }}>
            Mejorar murallas — 🪙 {wallsCost}
          </button>
        </div>

        <div style={panel} className="flex-col gap-2">
          <b>Dios defensor</b>
          <div className="flex-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
            <button className={state.defenseGod === null ? 'btn-success' : 'btn-primary'} style={smallBtn}
              onClick={() => equipGod('defense', null)}>Ninguno</button>
            {GOD_IDS.filter(id => GodManager.isUnlocked(state, id)).map(id => (
              <button key={id} className={state.defenseGod === id ? 'btn-success' : 'btn-primary'} style={smallBtn}
                onClick={() => equipGod('defense', id)}>
                {GameConfig.gods[id].icon} {GameConfig.gods[id].name}
              </button>
            ))}
          </div>
          {GOD_IDS.every(id => !GodManager.isUnlocked(state, id)) && (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Desbloquea Dioses en la pestaña 🔱 Dioses.</p>
          )}
        </div>
        </div>
        </div>
      </div>
    );
  };

  // ---------- GODS ----------
  const renderGods = () => (
    <div className="card-grid">
      {GOD_IDS.map(id => {
        const god = GameConfig.gods[id];
        const level = GodManager.getLevel(state, id);
        const unlocked = level > 0;
        const reqMet = GodManager.meetsUnlockRequirement(state, id);
        const upCost = GodManager.getLevelUpCost(Math.max(1, level));
        const maxed = level >= GameConfig.godMaxLevel;
        return (
          <div key={id} style={{ ...panel, borderColor: unlocked ? god.color : 'var(--glass-border)', opacity: unlocked || reqMet ? 1 : 0.7 }}
            className="flex-col gap-2">
            <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px', background: `radial-gradient(circle, ${god.color}55, transparent 70%)`, border: `2px solid ${god.color}`,
                filter: unlocked ? 'none' : 'grayscale(0.8)',
              }}>{god.icon}</div>
              <div className="flex-col" style={{ flex: 1 }}>
                <b style={{ color: god.color }}>{god.name} {unlocked && <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>Nv.{level}</span>}</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{god.title}</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{god.description}</p>
            <div style={{ fontSize: '12px' }}>{GodManager.describeEffects(id, level).join(' · ')}</div>
            {!unlocked ? (
              reqMet ? (
                <button className="btn-gem" disabled={!GodManager.canUnlock(state, id)} onClick={() => unlockGod(id)} style={{ padding: '10px' }}>
                  Desbloquear — 💎 {god.unlockGems}
                </button>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--accent-danger)' }}>🔒 Conquista {god.unlockTerritory} territorios para despertarlo</p>
              )
            ) : (
              <div className="flex-col gap-2">
                <button className="btn-gem" disabled={maxed || !GodManager.canLevelUp(state, id)} onClick={() => levelUpGod(id)} style={{ padding: '10px' }}>
                  {maxed ? 'Nivel máximo' : `Subir a Nv.${level + 1} — 💎 ${upCost}`}
                </button>
                <div className="flex-row gap-2">
                  <button className={state.attackGod === id ? 'btn-success' : 'btn-primary'} style={{ ...smallBtn, flex: 1 }}
                    onClick={() => equipGod('attack', state.attackGod === id ? null : id)}>
                    ⚔️ {state.attackGod === id ? 'En ataque' : 'Usar en ataque'}
                  </button>
                  <button className={state.defenseGod === id ? 'btn-success' : 'btn-primary'} style={{ ...smallBtn, flex: 1 }}
                    onClick={() => equipGod('defense', state.defenseGod === id ? null : id)}>
                    🛡️ {state.defenseGod === id ? 'En defensa' : 'Usar en defensa'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ---------- LOG ----------
  const renderLog = () => (
    <div className="card-grid">
      {state.defenseLog.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Nadie ha atacado tu aldea todavía.</p>
      )}
      {state.defenseLog.map(e => (
        <div key={e.id} style={{ ...panel, borderColor: e.won ? 'rgba(46,213,115,0.4)' : 'rgba(255,71,87,0.4)' }} className="flex-col gap-1">
          <div className="flex-row justify-between">
            <b style={{ color: e.won ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {e.won ? '🛡️ Defensa exitosa' : '🔥 Aldea saqueada'}
            </b>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{timeAgo(e.timestamp)}</span>
          </div>
          <span style={{ fontSize: '12px' }}>{e.attackerName} (🏆 {e.attackerTrophies})</span>
          <div className="flex-row gap-3" style={{ fontSize: '12px' }}>
            {e.coinsLost > 0 && <span style={{ color: 'var(--accent-danger)' }}>-{e.coinsLost} 🪙</span>}
            <span style={{ color: e.trophiesDelta >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {e.trophiesDelta >= 0 ? '+' : ''}{e.trophiesDelta} 🏆
            </span>
            {Object.entries(e.garrisonLost).filter(([, n]) => (n || 0) > 0).map(([id, n]) => (
              <span key={id} style={{ color: 'var(--text-secondary)' }}>-{n} {TROOP_ICONS[id as TroopId]}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const TABS: { id: Tab; label: string }[] = [
    { id: 'attack', label: '⚔️ Atacar' },
    { id: 'defense', label: '🛡️ Defensa' },
    { id: 'gods', label: '🔱 Dioses' },
    { id: 'log', label: `📜 Registro${unseen ? ` (${unseen})` : ''}` },
  ];

  return (
    <div className="flex-col gap-3">
      <div className="glass-panel" style={{ padding: '12px 16px' }}>
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <div className="flex-col">
            <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '20px' }}>⚔️ Guerra</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {pvpMode === 'online' ? '🌐 En línea' : '🤖 Modo local · rivales simulados'}
            </span>
          </div>
          <div className="flex-col" style={{ alignItems: 'flex-end' }}>
            <b style={{ fontSize: '18px' }}>{league.icon} {state.trophies} 🏆</b>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Liga {league.name} · {state.pvpWins}V / {state.pvpLosses}D
            </span>
          </div>
        </div>
        {shieldLeft > 0 && (
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--accent-blue)' }}>
            🛡️ Escudo activo {Math.ceil(shieldLeft / 60000)} min (se pierde si atacas)
          </div>
        )}
      </div>

      <div className="flex-row gap-1">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'btn-upgrade' : 'btn-primary'}
            style={{ flex: 1, padding: '8px 2px', fontSize: '11px' }}
            onClick={() => { setTab(t.id); setTarget(null); }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'attack' && renderAttack()}
      {tab === 'defense' && renderDefense()}
      {tab === 'gods' && renderGods()}
      {tab === 'log' && renderLog()}
    </div>
  );
};
