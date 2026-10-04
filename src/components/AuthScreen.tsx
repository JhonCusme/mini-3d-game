import React, { useState, useEffect } from 'react';
import { useAuth } from '../core/AuthContext';
import { AudioManager } from '../core/AudioManager';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const {
    login,
    signup,
    resetPasswordForEmail,
    updatePassword,
    playAsGuest,
    isConfigured,
    isRecoveryMode,
    setIsRecoveryMode,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isRecoveryMode) {
      setMode('reset');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isRecoveryMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    AudioManager.playClick();

    // Mode: Reset password (user clicked recovery link)
    if (mode === 'reset') {
      if (!password || !confirmPassword) {
        setErrorMsg('Por favor ingresa y confirma tu nueva contraseña.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);
      try {
        const res = await updatePassword(password);
        if (res.success) {
          AudioManager.playVictory();
          setSuccessMsg('¡Contraseña actualizada con éxito! Entrando al reino...');
          setTimeout(() => {
            onSuccess();
          }, 1200);
        } else {
          setErrorMsg(res.error || 'No se pudo actualizar la contraseña. El enlace puede haber caducado.');
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al actualizar contraseña.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: Forgot password request
    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Por favor ingresa tu correo electrónico.');
        return;
      }

      setLoading(true);
      try {
        const res = await resetPasswordForEmail(email.trim());
        if (res.success) {
          AudioManager.playVictory();
          setSuccessMsg('✉️ ¡Enlace enviado! Revisa tu bandeja de entrada (y spam) para restablecer tu contraseña.');
        } else {
          setErrorMsg(res.error || 'No se pudo enviar el correo de recuperación.');
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Error al solicitar recuperación.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: Login or Signup
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
          <div className="auth-crest">
            {mode === 'forgot' ? '🔑' : mode === 'reset' ? '🔐' : '🛡️'}
          </div>
          <h2 className="title-clash auth-title">MINI KINGDOM</h2>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Identifícate, Comandante'
              : mode === 'signup'
              ? 'Crea tu Legado'
              : mode === 'forgot'
              ? 'Recuperar Contraseña'
              : 'Establecer Nueva Contraseña'}
          </p>
        </div>

        {/* Tab switch for login / signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                AudioManager.playClick();
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
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
                setSuccessMsg(null);
              }}
            >
              Registrarse
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="auth-error-banner animate-pop">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-success-banner animate-pop">
            <span>✅</span>
            <span>{successMsg}</span>
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

          {mode !== 'reset' && (
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
          )}

          {(mode === 'login' || mode === 'signup') && (
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
              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '2px' }}>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => {
                      AudioManager.playClick();
                      setMode('forgot');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'reset' && (
            <>
              <div className="auth-field">
                <label>Nueva Contraseña</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="auth-field">
                <label>Confirmar Nueva Contraseña</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">🔐</span>
                  <input
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-upgrade auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>⏳ Procesando...</span>
            ) : mode === 'login' ? (
              <span>⚔️ ENTRAR AL REINO</span>
            ) : mode === 'signup' ? (
              <span>✨ CREAR CUENTA</span>
            ) : mode === 'forgot' ? (
              <span>📨 ENVIAR RECUPERACIÓN</span>
            ) : (
              <span>💾 GUARDAR NUEVA CONTRASEÑA</span>
            )}
          </button>

          {mode === 'forgot' && (
            <button
              type="button"
              className="btn-guest"
              onClick={() => {
                AudioManager.playClick();
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{ marginTop: '4px' }}
            >
              <span>⬅️ Volver a Iniciar Sesión</span>
            </button>
          )}

          {mode === 'reset' && (
            <button
              type="button"
              className="btn-guest"
              onClick={() => {
                AudioManager.playClick();
                setIsRecoveryMode(false);
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              style={{ marginTop: '4px' }}
            >
              <span>⬅️ Cancelar</span>
            </button>
          )}
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <>
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
          </>
        )}

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
