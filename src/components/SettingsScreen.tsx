import { useState } from 'react';
import { useGame } from '../core/GameContext';
import { useAuth } from '../core/AuthContext';

import { getKingdomConfig } from '../config/KingdomsConfig';

export const SettingsScreen = () => {
  const { state, toggleMute, resetGame } = useGame();
  const { user, logout, updatePassword } = useAuth();
  const [muted, setMuted] = useState(localStorage.getItem('mini_kingdom_muted') === 'true');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [savingPass, setSavingPass] = useState(false);
  const kingdomInfo = getKingdomConfig(state.playerKingdom);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ text: 'La contraseña debe tener al menos 6 caracteres.', isError: true });
      return;
    }
    setSavingPass(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setPassMsg({ text: '¡Contraseña actualizada con éxito!', isError: false });
        setNewPassword('');
        setTimeout(() => setShowPasswordChange(false), 2000);
      } else {
        setPassMsg({ text: res.error || 'Error al actualizar contraseña.', isError: true });
      }
    } catch {
      setPassMsg({ text: 'Error inesperado.', isError: true });
    } finally {
      setSavingPass(false);
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
          <span style={{ fontSize: '12px', color: 'var(--accent-gold)', marginTop: '4px', background: 'rgba(255,215,0,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
            {kingdomInfo.icon} {kingdomInfo.name}
          </span>
        </div>
      </div>

      {/* Kingdom Attributes */}
      <div className="glass-panel flex-col gap-2">
        <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent-gold)' }}>
            {kingdomInfo.icon} Atributos de tu Aldea ({kingdomInfo.name})
          </span>
        </div>
        <div className="flex-col gap-1">
          {kingdomInfo.attributes.map((attr, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px 10px', borderRadius: '8px', fontSize: '11px' }}>
              <div className="flex-row justify-between">
                <b style={{ color: '#fff' }}>{attr.icon} {attr.title}</b>
                <span style={{ color: '#ffd700', fontWeight: 700 }}>{attr.highlight}</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>{attr.description}</p>
            </div>
          ))}
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
          <div className="flex-row gap-2">
            {user && !user.isGuest && (
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowPasswordChange(!showPasswordChange);
                  setPassMsg(null);
                }}
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                🔒 {showPasswordChange ? 'Cerrar' : 'Contraseña'}
              </button>
            )}
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

        {showPasswordChange && user && !user.isGuest && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,215,0,0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-gold)' }}>🔑 Cambiar Contraseña:</span>
            <div className="flex-row gap-2">
              <input
                type="password"
                placeholder="Nueva contraseña (min 6 car.)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: '#100624',
                  border: '1.5px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="btn-upgrade"
                disabled={savingPass}
                style={{ padding: '8px 14px', fontSize: '12px' }}
              >
                {savingPass ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            {passMsg && (
              <span style={{ fontSize: '11px', color: passMsg.isError ? '#ff7675' : '#2ed573', fontWeight: 600 }}>
                {passMsg.isError ? '⚠️ ' : '✅ '}{passMsg.text}
              </span>
            )}
          </form>
        )}
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
