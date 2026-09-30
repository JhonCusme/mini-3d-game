import { useState } from 'react';
import { useGame } from '../core/GameContext';
import { RewardManager } from '../core/RewardManager';
import { EffectManager } from '../core/EffectManager';

export const StoreScreen = () => {
  const { state, openChest, claimDailyReward, watchAdForReward, buyIAP } = useGame();
  const [loadingAd, setLoadingAd] = useState(false);
  const [loadingIAP, setLoadingIAP] = useState(false);

  const canClaimDaily = RewardManager.canClaimDailyReward(state);

  const handleWatchAd = async (type: 'coins' | 'gems' | 'energy') => {
    setLoadingAd(true);
    const success = await watchAdForReward(type);
    setLoadingAd(false);
    if (!success) {
      alert('No se pudo cargar el anuncio.');
    }
  };

  const handleClaimDaily = () => {
    claimDailyReward();
    EffectManager.fireChestLoot();
  };

  const handleOpenChest = () => {
    openChest();
    EffectManager.fireChestLoot();
  };

  const handleBuyIAP = async (pkg: string) => {
    setLoadingIAP(true);
    const success = await buyIAP(pkg);
    setLoadingIAP(false);
    if (success) {
      EffectManager.fireChestLoot();
    }
  };

  return (
    <div className="flex-col gap-3">
      {/* Header */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '12px 16px' }}>
        <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '20px' }}>
          Mercado & Tesoros
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Cofres: <span style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{state.chests}</span>
        </p>
      </div>

      <div className="card-grid">
      {/* Daily Reward */}
      <div className={`store-card daily ${canClaimDaily ? 'pulse-glow' : ''}`}>
        <div className="flex-row gap-3">
          <div style={{ fontSize: '32px' }}>🎁</div>
          <div className="flex-col gap-1" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recompensa Diaria</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>500 🪙 | 10 💎 | 100% ⚡</p>
          </div>
        </div>
        <button
          className="btn-success"
          disabled={!canClaimDaily}
          onClick={handleClaimDaily}
          style={{ width: '100%', padding: '12px' }}
        >
          {canClaimDaily ? '🎁 Reclamar Gratis' : '⏰ Vuelve mañana'}
        </button>
      </div>

      {/* Chests */}
      <div className="store-card">
        <div className="flex-row gap-3">
          <div style={{ fontSize: '32px' }}>🧰</div>
          <div className="flex-col gap-1" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Abrir Cofre</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Contiene monedas, gemas y energía.</p>
          </div>
        </div>
        <button
          className="btn-upgrade"
          disabled={state.chests <= 0}
          onClick={handleOpenChest}
          style={{ width: '100%', padding: '12px' }}
        >
          🧰 Abrir ({state.chests} disponibles)
        </button>
      </div>

      {/* Ad Rewards */}
      <div className="store-card">
        <div className="flex-row gap-3">
          <div style={{ fontSize: '28px' }}>📺</div>
          <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Anuncios Recompensados</h3>
        </div>
        <div className="flex-row gap-2">
          <button className="btn-primary" disabled={loadingAd} onClick={() => handleWatchAd('coins')} style={{ flex: 1, fontSize: '11px', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}>
            <span>+200</span>
            <span>🪙</span>
          </button>
          <button className="btn-gem" disabled={loadingAd} onClick={() => handleWatchAd('gems')} style={{ flex: 1, fontSize: '11px', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}>
            <span>+5</span>
            <span>💎</span>
          </button>
          <button className="btn-success" disabled={loadingAd} onClick={() => handleWatchAd('energy')} style={{ flex: 1, fontSize: '11px', padding: '10px 4px', flexDirection: 'column', gap: '2px' }}>
            <span>+5</span>
            <span>⚡</span>
          </button>
        </div>
        {loadingAd && (
          <p style={{ fontSize: '12px', color: 'var(--accent-gold)', textAlign: 'center', marginTop: '4px' }}>
            Simulando anuncio (3s)...
          </p>
        )}
      </div>

      {/* IAP */}
      <div className="store-card premium">
        <div className="flex-row gap-3">
          <div style={{ fontSize: '28px' }}>💎</div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-gem-light)' }}>Tienda Premium</h3>
        </div>
        <div className="flex-col gap-2">
          <button className="btn-gem" disabled={loadingIAP} onClick={() => handleBuyIAP('starter_pack')} style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
            🏰 Pack Inicial — 5000🪙 100💎 5🧰 — $4.99
          </button>
          <button className="btn-gem" disabled={loadingIAP} onClick={() => handleBuyIAP('gems_large')} style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
            💎 Montón de Gemas — 500💎 — $9.99
          </button>
        </div>
        {loadingIAP && (
          <p style={{ fontSize: '12px', color: 'var(--accent-gem-light)', textAlign: 'center' }}>Procesando compra...</p>
        )}
      </div>
      </div>
    </div>
  );
};
