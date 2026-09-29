import { useEffect, useState } from 'react';
import type { BattleResult } from '../core/BattleManager';
import { EffectManager } from '../core/EffectManager';
import { GameConfig } from '../config/GameConfig';

interface BattleScreenProps {
  territory: any;
  result: BattleResult | null;
  onClose: () => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ territory, result, onClose }) => {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (result) {
      // Slight delay before showing result for dramatic effect
      setTimeout(() => setShowResult(true), 200);
      if (result.won) {
        EffectManager.fireVictoryConfetti();
      }
    }
  }, [result]);

  const bgClass = !result ? 'battle-bg-fighting' : result.won ? 'battle-bg-victory' : 'battle-bg-defeat';

  return (
    <div className="battle-fullscreen">
      <div className={`battle-bg ${bgClass}`} />

      {!result ? (
        // Battle animation
        <div className="battle-content animate-pop">
          <h2 className="title-clash" style={{ fontSize: '22px', color: 'var(--accent-danger)', textShadow: '0 2px 10px rgba(255,71,87,0.5)' }}>
            ¡Batalla en curso!
          </h2>

          {/* VS display */}
          <div className="flex-row gap-4" style={{ margin: '16px 0' }}>
            <div className="flex-col" style={{ alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #3498db, #2ed573)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', border: '3px solid #2ed573',
                boxShadow: '0 0 20px rgba(46,213,115,0.3)',
              }}>⚔️</div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tú</span>
            </div>

            <div style={{
              fontSize: '32px', fontWeight: 800, color: 'var(--accent-danger)',
              animation: 'pulse-glow 0.5s ease-in-out infinite',
              textShadow: '0 0 20px rgba(255,71,87,0.5)',
            }}>VS</div>

            <div className="flex-col" style={{ alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff4757, #c44569)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', border: '3px solid #c44569',
                boxShadow: '0 0 20px rgba(255,71,87,0.3)',
                animation: 'shake 0.3s infinite',
              }}>{territory.isBoss ? '👑' : '💀'}</div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{territory.name}</span>
            </div>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', animation: 'breathe 1s ease-in-out infinite' }}>
            Atacando {territory.name}...
          </p>
        </div>
      ) : showResult ? (
        // Battle result
        <div className="battle-content animate-pop">
          {result.won ? (
            <>
              <h1 className="title-clash" style={{
                fontSize: '36px', color: 'var(--accent-gold)',
                textShadow: '0 4px 20px rgba(255,215,0,0.5)',
              }}>¡VICTORIA!</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Has conquistado {territory.name}.</p>

              {/* Rewards */}
              <div style={{
                width: '100%', padding: '16px', borderRadius: '16px',
                background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
              }}>
                <div className="flex-col gap-2">
                  <div className="flex-row justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Monedas</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '18px' }}>
                      + {result.coinsEarned} 🪙
                    </span>
                  </div>
                  <div className="flex-row justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Experiencia</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-energy)', fontSize: '18px' }}>
                      + {result.expEarned} XP
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="title-clash" style={{
                fontSize: '36px', color: 'var(--accent-danger)',
                textShadow: '0 4px 20px rgba(255,71,87,0.5)',
              }}>DERROTA</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Tus tropas no fueron suficientes para tomar {territory.name}.
              </p>
            </>
          )}

          {/* Casualties */}
          {Object.entries(result.bajas).some(([, amount]) => amount > 0) && (
            <div style={{
              width: '100%', padding: '14px', borderRadius: '14px',
              background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)',
            }}>
              <h3 style={{ fontSize: '14px', color: 'var(--accent-danger)', marginBottom: '8px' }}>Bajas en Combate</h3>
              <div className="flex-col gap-1">
                {Object.entries(result.bajas).map(([id, amount]) => {
                  if (amount <= 0) return null;
                  const config = GameConfig.troops[id as keyof typeof GameConfig.troops];
                  return (
                    <div key={id} className="flex-row justify-between" style={{ fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{config?.name || id}</span>
                      <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>-{amount} 💀</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            className={result.won ? 'btn-upgrade' : 'btn-primary'}
            onClick={onClose}
            style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '8px' }}
          >
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  );
};
