import { useGame } from '../core/GameContext';
import { GameConfig } from '../config/GameConfig';

export const QuestScreen = () => {
  const { state, claimQuest } = useGame();

  return (
    <div className="flex-col gap-3">
      {/* Header */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '12px 16px' }}>
        <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '20px' }}>
          📜 Misiones
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Completa tareas para ganar recompensas únicas.
        </p>
      </div>

      <div className="card-grid">
        {GameConfig.quests.map((quest, i) => {
          const progress = state.quests[quest.id]?.progress || 0;
          const isCompleted = state.quests[quest.id]?.completed || false;
          const canClaim = !isCompleted && progress >= quest.target;

          return (
            <div
              key={quest.id}
              className={`quest-card ${isCompleted ? 'completed' : ''} ${canClaim ? 'pulse-glow' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex-row justify-between" style={{ alignItems: 'flex-start' }}>
                <div className="flex-col gap-1" style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: isCompleted ? 'var(--accent-success)' : 'var(--text-primary)' }}>
                    {quest.title} {isCompleted && '✅'}
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{quest.description}</p>
                </div>
                <span style={{
                  fontSize: '13px', fontWeight: 800,
                  color: canClaim ? 'var(--accent-success)' : 'var(--text-secondary)',
                  background: canClaim ? 'rgba(46,213,115,0.1)' : 'rgba(255,255,255,0.05)',
                  padding: '4px 10px', borderRadius: '10px', whiteSpace: 'nowrap',
                }}>
                  {Math.min(progress, quest.target)}/{quest.target}
                </span>
              </div>

              {/* Progress bar */}
              {!isCompleted && (
                <div className="quest-progress-bar">
                  <div
                    className="quest-progress-fill"
                    style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }}
                  />
                </div>
              )}

              {/* Rewards and claim */}
              <div className="flex-row justify-between" style={{ marginTop: '8px', alignItems: 'center' }}>
                <div className="flex-row gap-3" style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>🪙 {quest.rewardCoins}</span>
                  <span style={{ color: 'var(--accent-gem-light)', fontWeight: 600 }}>💎 {quest.rewardGems}</span>
                </div>

                {!isCompleted && (
                  <button
                    className={canClaim ? 'btn-success' : 'btn-primary'}
                    disabled={!canClaim}
                    onClick={() => claimQuest(quest.id)}
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                  >
                    {canClaim ? '🎉 Reclamar' : '⏳ En progreso'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
