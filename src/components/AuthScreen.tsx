import React, { useState } from 'react';
import { useAuth } from '../core/AuthContext';
import { AudioManager } from '../core/AudioManager';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { login, signup, playAsGuest, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    AudioManager.playClick();

    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          AudioManager.playVictory();
          onSuccess();
        } else {
          setErrorMsg(res.error || 'Correo o contraseña incorrectos.');
        }
      } else {
        const res = await signup(email, password, name);
        if (res.success) {
          AudioManager.playVictory();
          onSuccess();
        } else {
          setErrorMsg(res.error || 'No se pudo crear la cuenta.');
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al conectar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    AudioManager.playClick();
    playAsGuest();
    onSuccess();
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        {/* Crest */}
        <div className="auth-header">
          <div className="auth-crest">🛡️</div>
          <h2 className="title-clash auth-title">MINI KINGDOM</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Identifícate, Comandante' : 'Crea tu Legado'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              AudioManager.playClick();
              setMode('login');
              setErrorMsg(null);
            }}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => {
              AudioManager.playClick();
              setMode('signup');
              setErrorMsg(null);
            }}
          >
            Registrarse
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error-banner animate-pop">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Nombre de Comandante</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👑</span>
                <input
                  type="text"
                  placeholder="Ej. Lord Alejandro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={18}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label>Correo Electrónico</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">✉️</span>
              <input
                type="email"
                placeholder="comandante@reino.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Contraseña</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-upgrade auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>⏳ Conectando...</span>
            ) : mode === 'login' ? (
              <span>⚔️ ENTRAR AL REINO</span>
            ) : (
              <span>✨ CREAR CUENTA</span>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>O BIEN</span>
        </div>

        {/* Guest option */}
        <button
          type="button"
          className="btn-guest"
          onClick={handleGuest}
          disabled={loading}
        >
          <span>👤 Continuar como Invitado</span>
        </button>

        <div className="auth-footer-notice">
          {isConfigured ? (
            <p>☁️ Iniciar sesión respalda tu aldea y progreso en la nube.</p>
          ) : (
            <p>💾 Modo local activo en este entorno.</p>
          )}
        </div>
      </div>
    </div>
  );
};
