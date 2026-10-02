import { useEffect } from 'react';
import { useGame } from '../../core/GameContext';
import { GameConfig } from '../../config/GameConfig';
import type { GodId, TroopCounts, TroopId } from '../../core/GameState';
import { GodManager } from '../../core/GodManager';
import { UpgradeManager } from '../../core/UpgradeManager';
import { EconomyManager } from '../../core/EconomyManager';
import { PvpManager } from '../../core/pvp/PvpManager';
import { wallMaxHp } from '../../core/pvp/PvpBattle';
import { TROOP_ICONS } from '../troopIcons';

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];
const GOD_IDS = Object.keys(GameConfig.gods) as GodId[];
export const troopPower = (t: TroopCounts, levels?: Record<TroopId, number>) =>
  TROOP_IDS.reduce((s, id) => {
    const lvl = levels?.[id] || 1;
    const mult = 1 + (lvl - 1) * 0.22;
    return s + Math.round((t[id] || 0) * GameConfig.troops[id].power * mult);
  }, 0);

export const panel: React.CSSProperties = {
  padding: '12px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
};
export const smallBtn: React.CSSProperties = { padding: '6px 10px', fontSize: '12px', minWidth: '40px' };

export function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/** Garrison, walls and defense god: what other players will fight against. */
export const DefensePanel: React.FC = () => {
  const { state, moveTroops, purchaseUpgrade, equipGod } = useGame();
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
          <div className="flex-row justify-between"><b>🛡️ Guarnición</b><span style={{ fontSize: '12px' }}>⚔️ {troopPower(state.garrison, state.troopLevels)}</span></div>
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
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Despierta Dioses en el Altar.</p>
          )}
        </div>
        </div>
        </div>
      </div>
    );
};

/** Unlock, level up and equip the gods. */
export const GodsPanel: React.FC = () => {
  const { state, unlockGod, levelUpGod, equipGod } = useGame();
  return (
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
};

/** Attacks received while away. */
export const DefenseLogPanel: React.FC = () => {
  const { state, markDefenseLogSeen } = useGame();
  useEffect(() => { markDefenseLogSeen(); }, [state.defenseLog.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
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
};

/** Train troops (Barracks). */
export const TrainTroopsPanel: React.FC = () => {
  const { state, trainTroop } = useGame();
  const total = PvpManager.totalTroops(state);
  const max = UpgradeManager.getTroopCapacity(state);
  return (
    <div className="flex-col gap-2" style={{ width: '100%' }}>
      <div className="flex-row justify-between">
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ejército (incluye guarnición)</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: total >= max ? 'var(--accent-danger)' : 'var(--accent-energy)' }}>{total} / {max}</span>
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
        {TROOP_IDS.map(id => {
          const troop = GameConfig.troops[id];
          const isUnlocked = UpgradeManager.isTroopUnlocked(state, id);
          const reqText = UpgradeManager.getUnlockRequirementText(id);
          const canTrain = isUnlocked && EconomyManager.canAfford(state, troop.cost, 'coins') && total < max;
          const lvl = state.troopLevels?.[id] || 1;
          const mult = 1 + (lvl - 1) * 0.22;
          const scaledPower = Math.round(troop.power * mult);
          const scaledHp = Math.round(troop.hp * mult);
          return (
            <div key={id} className="troop-row" style={{ opacity: isUnlocked ? 1 : 0.65 }}>
              <div className="flex-row gap-2">
                <span className="troop-icon" style={{ filter: isUnlocked ? 'none' : 'grayscale(1)' }}>{TROOP_ICONS[id]}</span>
                <div className="flex-col">
                  <div className="flex-row gap-1" style={{ alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{troop.name}</span>
                    {isUnlocked ? (
                      <span style={{ fontSize: '10px', color: 'var(--accent-gold)', fontWeight: 800 }}>Nv.{lvl}</span>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#ff6b81', fontWeight: 700 }}>🔒 Bloqueado</span>
                    )}
                  </div>
                  {isUnlocked ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>⚔️{scaledPower} ❤️{scaledHp} · ×{state.troops[id]}</span>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{reqText}</span>
                  )}
                </div>
              </div>
              <button
                className="btn-primary"
                disabled={!canTrain}
                onClick={() => trainTroop(id)}
                style={{ padding: '6px 10px', fontSize: '12px', minWidth: '70px' }}
                title={!isUnlocked ? reqText : undefined}
              >
                {isUnlocked ? `🪙 ${troop.cost}` : '🔒'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { TroopUpgradePanel } from './TroopUpgradePanel';
