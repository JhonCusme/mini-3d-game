import { useEffect, useState } from 'react';
import { GameConfig } from '../config/GameConfig';
import { EffectManager } from '../core/EffectManager';
import type { TroopId } from '../core/GameState';
import type { PvpBattleResult, VillageSnapshot } from '../core/pvp/PvpTypes';
import type { PvpOutcome } from '../core/pvp/PvpRules';
import { TROOP_ICONS } from './troopIcons';

interface Props {
  opponent: VillageSnapshot;
  result: PvpBattleResult;
  outcome: PvpOutcome;
  onClose: () => void;
}

const ROUND_MS = 1100;

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div style={{ width: '100%' }}>
    <div className="flex-row justify-between" style={{ fontSize: '12px', marginBottom: '3px' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{Math.max(0, Math.round(value))} / {Math.round(max)}</span>
    </div>
    <div style={{ height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{
        width: `${max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0}%`, height: '100%',
        background: color, transition: `width ${ROUND_MS * 0.6}ms ease-out`,
      }} />
    </div>
  </div>
);

export const PvpBattleScreen: React.FC<Props> = ({ opponent, result, outcome, onClose }) => {
  // -1 = before the fight, rounds.length = finished
  const [step, setStep] = useState(-1);
  const finished = step >= result.rounds.length;

  useEffect(() => {
    if (finished) return;
    const id = setTimeout(() => setStep(s => s + 1), step === -1 ? 600 : ROUND_MS);
    return () => clearTimeout(id);
  }, [step, finished]);

  useEffect(() => {
    if (!finished) return;
    if (result.won) {
      EffectManager.fireVictoryConfetti();
      if (result.stars === 3) EffectManager.fireCrit();
    }
  }, [finished, result]);

  const current = step >= 0 ? result.rounds[Math.min(step, result.rounds.length - 1)] : null;
  const attackerHp = current ? current.attackerHp : result.attackerMaxHp;
  const defenderHp = current ? current.defenderHp : result.defenderMaxHp;
  const wallHp = current ? current.wallHp : result.wallMaxHp;
  const visibleEvents = result.rounds.slice(0, Math.max(0, step + 1)).flatMap(r => r.events.map(e => ({ r: r.round, e })));

  const bgClass = !finished ? 'battle-bg-fighting' : result.won ? 'battle-bg-victory' : 'battle-bg-defeat';

  return (
    <div className="battle-fullscreen">
      <div className={`battle-bg ${bgClass}`} />
      <div className="battle-content animate-pop" style={{ gap: '12px' }}>
        {!finished ? (
          <h2 className="title-clash" style={{ fontSize: '22px', color: 'var(--accent-danger)' }}>
            {step < 0 ? '¡A la carga!' : `Ronda ${current?.round}`}
          </h2>
        ) : (
          <>
            <h1 className="title-clash" style={{ fontSize: '34px', color: result.won ? 'var(--accent-gold)' : 'var(--accent-danger)' }}>
              {result.won ? '¡VICTORIA!' : 'DERROTA'}
            </h1>
            <div style={{ fontSize: '34px', letterSpacing: '4px' }}>
              {[0, 1, 2].map(i => <span key={i} style={{ opacity: i < result.stars ? 1 : 0.2 }}>⭐</span>)}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Destrucción: {Math.round(result.destruction * 100)}%
            </p>
          </>
        )}

        <div className="flex-row justify-between" style={{ width: '100%', fontSize: '13px', fontWeight: 700 }}>
          <span>⚔️ Tu ejército</span>
          <span>🏰 {opponent.name}</span>
        </div>
        <Bar label="Tus tropas" value={attackerHp} max={result.attackerMaxHp} color="linear-gradient(90deg,#2ed573,#7bed9f)" />
        {result.wallMaxHp > 0 && <Bar label="🧱 Murallas" value={wallHp} max={result.wallMaxHp} color="linear-gradient(90deg,#a0a0a0,#dcdcdc)" />}
        <Bar label="Defensores" value={defenderHp} max={result.defenderMaxHp} color="linear-gradient(90deg,#ff4757,#ff6b81)" />

        <div style={{
          width: '100%', maxHeight: '150px', overflowY: 'auto', padding: '10px', borderRadius: '12px',
          background: 'rgba(0,0,0,0.3)', fontSize: '12px', display: 'flex', flexDirection: 'column-reverse', gap: '4px',
        }}>
          {[...visibleEvents].reverse().map((ev, i) => (
            <div key={i} style={{ color: 'var(--text-secondary)' }}>
              <b style={{ color: 'var(--text-primary)' }}>R{ev.r}</b> {ev.e}
            </div>
          ))}
          {visibleEvents.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Las tropas avanzan…</div>}
        </div>

        {finished && (
          <>
            <div style={{
              width: '100%', padding: '12px', borderRadius: '14px',
              background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
            }} className="flex-col gap-2">
              <div className="flex-row justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Botín</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>+ {outcome.coinsStolen} 🪙</span>
              </div>
              <div className="flex-row justify-between">
                <span style={{ color: 'var(--text-secondary)' }}>Trofeos</span>
                <span style={{ fontWeight: 800, color: outcome.attackerTrophiesDelta >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {outcome.attackerTrophiesDelta >= 0 ? '+' : ''}{outcome.attackerTrophiesDelta} 🏆
                </span>
              </div>
              {Object.entries(result.attackerLosses).some(([, n]) => n > 0) && (
                <div style={{ fontSize: '12px', color: 'var(--accent-danger)' }}>
                  Bajas: {Object.entries(result.attackerLosses).filter(([, n]) => n > 0)
                    .map(([id, n]) => `${TROOP_ICONS[id as TroopId]} ${n} ${GameConfig.troops[id as TroopId].name}`).join(' · ')}
                </div>
              )}
            </div>
            <button className={result.won ? 'btn-upgrade' : 'btn-primary'} onClick={onClose}
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
              Continuar
            </button>
          </>
        )}
        {!finished && (
          <button className="btn-primary" onClick={() => setStep(result.rounds.length)} style={{ padding: '8px 16px', fontSize: '12px' }}>
            Saltar ⏩
          </button>
        )}
      </div>
    </div>
  );
};
