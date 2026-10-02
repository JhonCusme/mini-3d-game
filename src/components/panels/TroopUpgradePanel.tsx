import React, { useState, useEffect } from 'react';
import { useGame } from '../../core/GameContext';
import { GameConfig } from '../../config/GameConfig';
import type { TroopId } from '../../core/GameState';
import { TroopUpgradeManager } from '../../core/TroopUpgradeManager';
import { HeroManager } from '../../core/HeroManager';
import { EffectManager } from '../../core/EffectManager';
import { TROOP_ICONS, AVATAR_IMAGES } from '../troopIcons';
import { getKingdomConfig } from '../../config/KingdomsConfig';
import { panel } from './Panels';
import { AudioManager } from '../../core/AudioManager';
import { formatDuration } from '../village/VillageScene';

const TROOP_ORDER: TroopId[] = ['infantry', 'archers', 'cavalry', 'mages', 'catapults', 'healers'];

export const TroopUpgradePanel: React.FC<{ initialTab?: 'troops' | 'hero' }> = ({ initialTab = 'troops' }) => {
  const { state, upgradeTroop, finishTroopUpgradeWithGems, upgradeHero } = useGame();
  const [tab, setTab] = useState<'troops' | 'hero'>(initialTab);
  const [upgradedTroop, setUpgradedTroop] = useState<TroopId | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const maxLevel = TroopUpgradeManager.getMaxLevel(state);
  const blacksmithLevel = (state.upgrades.attackPower || 0) + 1;
  const heroCost = HeroManager.getUpgradeCost(state.heroLevel);
  const kingdom = getKingdomConfig(state.playerKingdom);

  const handleUpgradeTroop = (troopId: TroopId) => {
    const success = upgradeTroop(troopId);
    if (success) {
      setUpgradedTroop(troopId);
      EffectManager.fireTroopUpgrade();
      AudioManager.playLevelUp();
      setTimeout(() => setUpgradedTroop(null), 1200);
    }
  };

  const handleUpgradeHero = () => {
    upgradeHero();
    EffectManager.fireHeroUpgrade();
    AudioManager.playLevelUp();
  };

  return (
    <div className="flex-col gap-3" style={{ width: '100%' }}>
      {/* Top Header & Tabs */}
      <div className="flex-row justify-between" style={{ alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
          <button
            className={tab === 'troops' ? 'btn-upgrade' : 'btn-primary'}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
            onClick={() => setTab('troops')}
          >
            ⚔️ Tropas
          </button>
          <button
            className={tab === 'hero' ? 'btn-gem' : 'btn-primary'}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
            onClick={() => setTab('hero')}
          >
            🦸 Héroe (Nv. {state.heroLevel})
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          ⚒️ Herrería Nv.<b>{blacksmithLevel}</b> · Cap Nv.<b>{maxLevel}</b>
        </div>
      </div>

      {/* Troops Tab */}
      {tab === 'troops' && (
        <div className="flex-col gap-2">
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(255, 184, 0, 0.08)',
              border: '1px solid rgba(255, 184, 0, 0.2)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>💡</span>
            <span>
              Cada nivel otorga <b>+22% de Vida (HP)</b> y <b>+22% de Daño (DPS)</b> a la tropa en todos los combates.
            </span>
          </div>

          <div
            className="card-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '10px',
            }}
          >
            {TROOP_ORDER.map((id) => {
              const details = TroopUpgradeManager.getTroopDetails(state, id);
              const isMax = details.level >= details.maxLevel;
              const isJustUpgraded = upgradedTroop === id;

              return (
                <div
                  key={id}
                  style={{
                    ...panel,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    borderColor: isJustUpgraded
                      ? 'var(--accent-gold)'
                      : isMax
                      ? 'rgba(255, 215, 0, 0.4)'
                      : 'var(--glass-border)',
                    boxShadow: isJustUpgraded ? '0 0 16px rgba(255, 184, 0, 0.4)' : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top Bar: Icon, Name, Rank */}
                  <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(0,0,0,0.3))',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {TROOP_ICONS[id]}
                    </div>

                    <div className="flex-col" style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex-row justify-between" style={{ alignItems: 'baseline' }}>
                        <b style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {details.name}
                        </b>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: 'var(--accent-gold)',
                            color: '#1a1100',
                          }}
                        >
                          Nv. {details.level}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {details.rankTitle} · <span style={{ opacity: 0.8 }}>{details.role}</span>
                      </span>
                    </div>
                  </div>

                  {/* Level Progress Bar */}
                  <div style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: 'var(--text-secondary)',
                        marginBottom: '3px',
                      }}
                    >
                      <span>Progreso de Maestría</span>
                      <span>{details.level} / {details.maxLevel}</span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        borderRadius: '3px',
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (details.level / details.maxLevel) * 100)}%`,
                          background: 'linear-gradient(90deg, #ff9f43, #ffd700)',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats comparison */}
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-around',
                      fontSize: '12px',
                    }}
                  >
                    <div className="flex-col" style={{ alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>❤️ Vida (HP)</span>
                      <span style={{ fontWeight: 700 }}>
                        {details.currentHp}{' '}
                        {!isMax && (
                          <span style={{ color: 'var(--accent-success)', fontSize: '11px' }}>
                            → {details.nextHp}
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />

                    <div className="flex-col" style={{ alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>⚔️ Daño (DPS)</span>
                      <span style={{ fontWeight: 700 }}>
                        {details.currentDps}{' '}
                        {!isMax && (
                          <span style={{ color: 'var(--accent-success)', fontSize: '11px' }}>
                            → {details.nextDps}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Upgrade Button / Research Timer */}
                  {isMax ? (
                    <button
                      className="btn-primary"
                      disabled
                      style={{
                        padding: '9px',
                        fontSize: '12px',
                        opacity: 0.8,
                        border: '1px solid rgba(255,215,0,0.3)',
                        color: 'var(--accent-gold)',
                      }}
                    >
                      👑 Nivel Máximo
                    </button>
                  ) : (() => {
                    const researchingUntil = state.troopUpgradesUntil?.[id] || 0;
                    const isResearching = researchingUntil > now;
                    const finishGemsCost = isResearching ? Math.max(1, Math.ceil((researchingUntil - now) / 60000)) : 0;
                    const durationSec = TroopUpgradeManager.researchDuration(details.level + 1);

                    if (isResearching) {
                      return (
                        <div className="flex-row gap-2" style={{ width: '100%' }}>
                          <button className="btn-primary" disabled style={{ flex: 1, padding: '9px', fontSize: '11px' }}>
                            🔬 Investigando Nv.{details.level + 1} · ⏱️ {formatDuration(researchingUntil - now)}
                          </button>
                          <button
                            className="btn-gem"
                            disabled={state.gems < finishGemsCost}
                            onClick={() => finishTroopUpgradeWithGems(id)}
                            style={{ padding: '9px 12px', fontSize: '11px' }}
                            title="Terminar investigación al instante con gemas"
                          >
                            ⏩ 💎 {finishGemsCost}
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        className={details.canUpgrade ? 'btn-upgrade' : 'btn-primary'}
                        disabled={!details.canUpgrade}
                        onClick={() => handleUpgradeTroop(id)}
                        style={{
                          padding: '9px',
                          fontSize: '12px',
                          fontWeight: 700,
                          position: 'relative',
                        }}
                        title={details.blockerReason || ''}
                      >
                        {details.canUpgrade ? (
                          <>⬆️ Mejorar Nv.{details.level + 1} — 🪙 {details.upgradeCost.toLocaleString()} (⏱️ {formatDuration(durationSec * 1000)})</>
                        ) : (
                          details.blockerReason || `🪙 ${details.upgradeCost.toLocaleString()}`
                        )}
                      </button>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Tab */}
      {tab === 'hero' && (
        <div className="flex-col gap-3">
          <div
            style={{
              ...panel,
              background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.08), rgba(255, 255, 255, 0.02))',
              borderColor: 'rgba(255, 184, 0, 0.3)',
              display: 'flex',
              flexDirection: 'row',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '2px solid var(--accent-gold)',
                boxShadow: '0 4px 14px rgba(255, 184, 0, 0.25)',
                background: '#1a1a2e',
                flexShrink: 0,
              }}
            >
              <img
                src={AVATAR_IMAGES[state.playerAvatar]}
                alt="Hero avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div className="flex-col" style={{ flex: 1, minWidth: '180px', gap: '4px' }}>
              <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
                <b style={{ fontSize: '18px', color: 'var(--text-primary)' }}>
                  {state.playerName || 'Gran Campeón'}
                </b>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ff9f43, #ffd700)',
                    color: '#1a1100',
                  }}
                >
                  Héroe Nv. {state.heroLevel}
                </span>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>
                {kingdom.icon} {kingdom.name} · Comandante del Reino
              </span>

              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                {kingdom.subtitle} — {kingdom.description}
              </p>
            </div>
          </div>

          <div className="two-col">
            <div style={panel} className="flex-col gap-2">
              <b>⚡ Poder de Mando Global</b>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent-success)',
                }}
              >
                +{Math.round((state.heroLevel - 1) * GameConfig.heroPowerMultiplierPerLevel * 100)}%
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Este bono incrementa la fuerza bélica, vida y daño de <b>todas tus tropas</b> en la campaña y batallas multijugador.
              </p>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Próximo nivel:{' '}
                <b style={{ color: 'var(--accent-success)' }}>
                  +{Math.round(state.heroLevel * GameConfig.heroPowerMultiplierPerLevel * 100)}%
                </b>
              </div>
            </div>

            <div style={panel} className="flex-col gap-3 justify-between">
              <div>
                <b>💎 Ascenso del Héroe</b>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  El Altar del Héroe canaliza gemas reales para desatar el verdadero potencial del comandante.
                </p>
              </div>

              <button
                className="btn-gem"
                disabled={state.gems < heroCost}
                onClick={handleUpgradeHero}
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  width: '100%',
                }}
              >
                {state.gems >= heroCost
                  ? `Subir Héroe a Nv. ${state.heroLevel + 1} — 💎 ${heroCost}`
                  : `Faltan 💎 ${heroCost - state.gems} gemas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
