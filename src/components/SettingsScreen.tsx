import { useState } from 'react';
import { useGame } from '../core/GameContext';
import { useAuth } from '../core/AuthContext';

export const SettingsScreen = () => {
  const { state, toggleMute, resetGame } = useGame();
  const { user, logout } = useAuth();
  const [muted, setMuted] = useState(localStorage.getItem('mini_kingdom_muted') === 'true');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleToggleMute = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const handleReset = () => {
    if (confirmReset) {
      resetGame();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
    }
  };

  return (
    <div className="flex-col gap-3">
      {/* Header */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '12px 16px' }}>
        <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '20px' }}>
          ⚙️ Ajustes
        </h2>
      </div>

      {/* Player Info */}
      <div className="glass-panel flex-col gap-3" style={{ alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--accent-gold)' }}>
          <img src={`/assets/heroes/${state.playerAvatar}.jpg`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="flex-col gap-1" style={{ alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent-gold)' }}>{state.playerName}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Nivel {state.level} · Prestigio ⭐{state.prestigeLevel}
          </span>
        </div>
      </div>

      {/* Sound */}
      <div className="glass-panel">
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <div className="flex-col gap-1">
            <h3 style={{ fontSize: '14px' }}>Efectos de Sonido</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Activa o desactiva los sonidos.</p>
          </div>
          <button
            className={muted ? 'btn-danger' : 'btn-success'}
            onClick={handleToggleMute}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            {muted ? '🔇 Mute' : '🔊 On'}
          </button>
        </div>
      </div>

      {/* Account & Cloud Save */}
      <div className="glass-panel flex-col gap-2">
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <div className="flex-col gap-1">
            <h3 style={{ fontSize: '14px' }}>
              {user && !user.isGuest ? '☁️ Cuenta en la Nube' : '👤 Modo Invitado'}
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {user && !user.isGuest
                ? user.email || 'Conectado a Supabase'
                : 'Tu progreso solo está guardado en este dispositivo.'}
            </p>
          </div>
          <button
            className={user && !user.isGuest ? 'btn-primary' : 'btn-upgrade'}
            onClick={async () => {
              await logout();
            }}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            {user && !user.isGuest ? 'Cerrar Sesión' : '☁️ Conectar'}
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className="glass-panel" style={{ border: confirmReset ? '2px solid var(--accent-danger)' : undefined }}>
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <div className="flex-col gap-1">
            <h3 style={{ fontSize: '14px', color: 'var(--accent-danger)' }}>Borrar Datos</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Reinicia todo tu progreso.</p>
          </div>
          <button
            className="btn-danger"
            onClick={handleReset}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            {confirmReset ? '⚠️ ¿Seguro?' : '🗑️ Reset'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-secondary)', fontSize: '11px' }}>
        <p>Mini Kingdom v1.0.0</p>
        <p>Desarrollado con ♥</p>
      </div>
    </div>
  );
};
