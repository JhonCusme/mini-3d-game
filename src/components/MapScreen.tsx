import { useState } from 'react';
import { useGame } from '../core/GameContext';
import { GameConfig } from '../config/GameConfig';
import { BattleManager } from '../core/BattleManager';
import { AttackScreen } from './attack/AttackScreen';
import { CAMPAIGN_MISSIONS } from '../core/campaign/CampaignVillages';
import { HeroManager } from '../core/HeroManager';
import { TROOP_ICONS } from './troopIcons';

export const MapScreen: React.FC = () => {
  const { state, prestigeAscension } = useGame();
  const [campaignBattleIndex, setCampaignBattleIndex] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  const playerPower = BattleManager.getPlayerPower(state);
  const totalTroops = Object.values(state.troops).reduce((sum, count) => sum + count, 0);
  const isHeroReady = !HeroManager.isHeroRecovering(state);

  const handleFight = (index: number) => {
    if (state.energy < GameConfig.territories[index].energyCost) return;
    setSelectedNode(null);
    setCampaignBattleIndex(index);
  };

  if (campaignBattleIndex !== null) {
    return (
      <AttackScreen
        campaignTerritoryIndex={campaignBattleIndex}
        onClose={() => setCampaignBattleIndex(null)}
      />
    );
  }

  // Group territories into rows of alternating left-right alignment
  const territories = GameConfig.territories;

  // Get background gradient based on territory index
  const getTerrainColor = (i: number) => {
    if (i < 5) return 'rgba(45, 107, 48, 0.15)'; // green forest
    if (i < 10) return 'rgba(194, 178, 128, 0.15)'; // sandy
    if (i < 15) return 'rgba(139, 69, 19, 0.15)'; // brown mountains
    return 'rgba(120, 20, 20, 0.15)'; // volcanic
  };

  return (
    <div className="flex-col gap-3" style={{ position: 'relative' }}>
      {/* Dynamic Background */}
      <div 
        style={{
          position: 'absolute',
          inset: -20,
          background: 'url(/assets/village_background.jpg) center/cover',
          opacity: 0.15,
          filter: 'blur(10px)',
          pointerEvents: 'none',
          zIndex: -1
        }}
      />

      {/* Header */}
      <div className="glass-panel" style={{ textAlign: 'center', padding: '12px 16px', borderTop: '4px solid var(--accent-gold)' }}>
        <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '22px', textShadow: '0 2px 10px rgba(255,215,0,0.4)' }}>
          Mapa de Conquista
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--accent-danger)', fontWeight: 800, marginTop: '4px', letterSpacing: '1px' }}>
          Tu Poder: ⚔️ {Math.floor(playerPower)}
        </p>
      </div>

      {/* Prestige banner */}
      {state.territoryProgress >= territories.length && (
        <div className="glass-panel animate-pop" style={{ textAlign: 'center', border: '2px solid var(--accent-gold)', background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(26,14,46,0.95))' }}>
          <h2 style={{ color: 'var(--accent-gold)', fontSize: '20px', textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>👑 ¡El Reino es Tuyo!</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: '8px 0' }}>Has conquistado todos los territorios.</p>
          <button className="btn-upgrade pulse-glow" onClick={prestigeAscension} style={{ width: '100%', fontSize: '16px' }}>
            ⭐ Ascensión de Prestigio
          </button>
        </div>
      )}

      {/* Map path */}
      <div className="map-container" style={{ padding: '10px 0' }}>
        <div className="map-path">
          {territories.map((territory, index) => {
            const isCompleted = index < state.territoryProgress;
            const isAvailable = index === state.territoryProgress;
            const isLocked = index > state.territoryProgress;
            const isBoss = territory.isBoss;
            const hasEnergy = state.energy >= territory.energyCost;

            // Zigzag: alternate left/right positioning
            const isEven = index % 2 === 0;
            const offset = isEven ? '-60px' : '60px';

            return (
              <div key={territory.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {/* Connector line */}
                {index > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'center', height: '40px', alignItems: 'center' }}>
                    <div 
                      className={`map-connector ${isCompleted || isAvailable ? 'active' : ''}`} 
                      style={{ 
                        height: '40px', 
                        transform: `rotate(${isEven ? '30deg' : '-30deg'})`,
                        boxShadow: isCompleted || isAvailable ? '0 0 10px var(--accent-success)' : 'none'
                      }} 
                    />
                  </div>
                )}

                {/* Node row */}
                <div 
                  className={`map-row ${isAvailable ? 'animate-float' : ''}`} 
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${getTerrainColor(index)}, transparent)`, 
                    borderRadius: '24px', 
                    marginBottom: '8px',
                    padding: '10px 0',
                    width: '90%',
                    borderTop: isAvailable ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    borderBottom: isAvailable ? '1px solid rgba(0,0,0,0.5)' : 'none',
                  }}
                >
                  <div
                    className={`map-node ${isCompleted ? 'completed' : ''} ${isAvailable ? 'available' : ''} ${isLocked ? 'locked' : ''} ${isBoss ? 'boss' : ''}`}
                    style={{ 
                      transform: `translateX(${offset}) scale(${selectedNode === index ? 1.1 : 1})`,
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}
                    onClick={() => {
                      if (isAvailable) setSelectedNode(selectedNode === index ? null : index);
                    }}
                  >
                    {isCompleted && '⭐'}
                    {isAvailable && (isBoss ? '👑' : '⚔️')}
                    {isLocked && '🔒'}
                    {isBoss && !isLocked && (
                      <div className="map-node-info pulse-glow" style={{ background: 'var(--accent-danger)' }}>B</div>
                    )}
                  </div>

                  {/* Territory name to the side */}
                  <div
                    style={{
                      position: 'absolute',
                      [isEven ? 'right' : 'left']: '24px',
                      textAlign: isEven ? 'right' : 'left',
                      opacity: isLocked ? 0.4 : 1,
                      transform: selectedNode === index ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.2s',
                    }}
                  >
                    <div style={{ 
                      fontSize: isAvailable ? '15px' : '13px', 
                      fontWeight: 800, 
                      color: isCompleted ? 'var(--accent-success)' : isAvailable ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      textShadow: isAvailable ? '0 2px 4px rgba(0,0,0,0.8)' : 'none'
                    }}>
                      {territory.name}
                    </div>
                    {!isLocked && (
                      <div style={{ fontSize: '11px', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                        ⚔️ {Math.floor(territory.enemyPower)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded info for selected node */}
                {selectedNode === index && isAvailable && (() => {
                  const mission = CAMPAIGN_MISSIONS[index];
                  const unlockTroop = mission?.unlockedTroopId ? GameConfig.troops[mission.unlockedTroopId] : null;

                  return (
                    <div className="glass-panel animate-slide-up" style={{ margin: '8px 0 16px 0', padding: '16px', width: '90%', border: '2px solid var(--accent-gold)' }}>
                      <div className="flex-col gap-3">
                        <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,215,0,0.2)', paddingBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', color: 'var(--accent-gold)', margin: 0 }}>
                            {mission?.name || territory.name} {isBoss && '👑'}
                          </h3>
                          {mission?.subtitle && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                              {mission.subtitle}
                            </div>
                          )}
                        </div>

                        {mission?.description && (
                          <p style={{ fontSize: '13px', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '8px', margin: 0, lineHeight: 1.4 }}>
                            {mission.description}
                          </p>
                        )}

                        {unlockTroop && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'linear-gradient(90deg, rgba(46, 213, 115, 0.2), rgba(26, 14, 46, 0.7))',
                            border: '1px solid #2ed573',
                            borderRadius: '8px',
                            padding: '10px'
                          }}>
                            <span style={{ fontSize: '24px' }}>{mission.unlockedTroopId ? TROOP_ICONS[mission.unlockedTroopId] : '⚔️'}</span>
                            <div>
                              <div style={{ fontSize: '11px', color: '#2ed573', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                ¡Recompensa de Asedio!
                              </div>
                              <div style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>
                                Desbloquea: {unlockTroop.name}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex-row justify-between" style={{ fontSize: '14px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Defensas de la Aldea</span>
                          <span style={{ color: 'var(--accent-danger)', fontWeight: 800 }}>⚔️ Nv. {index + 1} Asedio Real</span>
                        </div>
                        <div className="flex-row justify-between" style={{ fontSize: '14px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Botín por Conquista</span>
                          <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>🪙 {territory.rewardCoins} | Exp {territory.rewardExp}</span>
                        </div>

                        {territory.isBoss && territory.bossTrait && (
                          <div className="pulse-glow" style={{ fontSize: '12px', color: 'white', fontWeight: 700, marginTop: '2px', background: 'linear-gradient(90deg, var(--accent-danger), #8b0000)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                            {territory.bossTrait === 'magic_shield' && '🛡️ Escudo Mágico: Aldea protegida con barreras arcanas'}
                            {territory.bossTrait === 'thick_armor' && '🧱 Armadura Gruesa: Murallas dobles de piedra maciza'}
                            {territory.bossTrait === 'dragon_fire' && '🔥 Fuego de Dragón: Cañones dobles de alto calibre'}
                          </div>
                        )}

                        {totalTroops === 0 && !isHeroReady && (
                          <div style={{ fontSize: '11px', color: '#ff4757', background: 'rgba(255,71,87,0.15)', border: '1px solid #ff4757', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                            ⚠️ No tienes tropas en el campamento ni a tu héroe disponible. Entrena soldados en el Cuartel para poder ganar.
                          </div>
                        )}

                        <button
                          className="btn-fight"
                          disabled={!hasEnergy}
                          onClick={() => handleFight(index)}
                          style={{
                            width: '100%',
                            marginTop: '4px',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)'
                          }}
                        >
                          ⚔️ ¡INICIAR ASEDIO 3D! — ⚡{territory.energyCost}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
