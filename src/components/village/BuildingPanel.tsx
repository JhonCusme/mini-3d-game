import { useGame } from '../../core/GameContext';
import { GameConfig } from '../../config/GameConfig';
import {
  BUILDINGS, buildingHp, defenseDamage, mineCapacity, mineRatePerSecond,
} from '../../config/BuildingsConfig';
import type { PlacedBuilding } from '../../core/GameState';
import { HeroManager } from '../../core/HeroManager';
import { EffectManager } from '../../core/EffectManager';
import { UpgradeManager } from '../../core/UpgradeManager';
import { Sheet } from '../ui/Sheet';
import { DefensePanel, GodsPanel, TrainTroopsPanel, TroopUpgradePanel, panel } from '../panels/Panels';

const Stat: React.FC<{ label: string; value: React.ReactNode; next?: React.ReactNode }> = ({ label, value, next }) => (
  <div className="troop-row">
    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{label}</span>
    <span style={{ fontWeight: 700 }}>
      {value}{next !== undefined && <span style={{ color: 'var(--accent-success)', marginLeft: 6 }}>→ {next}</span>}
    </span>
  </div>
);

function upgradeBonus(id: 'attackPower' | 'troopHealth' | 'critRate', level: number): string {
  const u = GameConfig.upgrades[id];
  if (id === 'critRate') return `${Math.round(level * u.effectBase * u.effectMultiplier)}%`;
  if (level <= 0) return '0%';
  return `${Math.round(u.effectBase * Math.pow(u.effectMultiplier, level - 1))}%`;
}

export const BuildingPanel: React.FC<{ building: PlacedBuilding; onClose: () => void }> = ({ building: b, onClose }) => {
  const { state, upgradeHero, healHeroWithGems } = useGame();
  const def = BUILDINGS[b.type];
  const lvl = Math.max(1, b.level);

  const renderStats = () => {
    switch (b.type) {
      case 'townhall':
        return (
          <>
            <Stat label="Nivel máximo del resto de edificios" value={lvl + 1} />
            <Stat label="Cañones permitidos" value={BUILDINGS.cannon.maxCount(lvl)} />
            <Stat label="Torres de arqueros permitidas" value={BUILDINGS.archertower.maxCount(lvl)} />
          </>
        );
      case 'goldmine':
        return (
          <>
            <Stat label="Producción" value={`${Math.round(mineRatePerSecond(lvl) * 3600)}/h`} next={`${Math.round(mineRatePerSecond(lvl + 1) * 3600)}/h`} />
            <Stat label="Capacidad" value={mineCapacity(lvl)} next={mineCapacity(lvl + 1)} />
            <Stat label="Acumulado" value={`🪙 ${Math.floor(b.stored)}`} />
          </>
        );
      case 'barracks':
        return <Stat label="Capacidad de tropas" value={UpgradeManager.getTroopCapacity(state)} />;
      case 'blacksmith':
        return (
          <>
            <Stat label="Nivel máx. de tropas" value={`Nv. ${lvl + 1}`} />
            <Stat label="Ataque extra global" value={upgradeBonus('attackPower', lvl - 1)} next={upgradeBonus('attackPower', lvl)} />
          </>
        );
      case 'armory':
        return <Stat label="Menos bajas" value={upgradeBonus('troopHealth', lvl - 1)} next={upgradeBonus('troopHealth', lvl)} />;
      case 'arena':
        return <Stat label="Golpe crítico" value={upgradeBonus('critRate', lvl - 1)} next={upgradeBonus('critRate', lvl)} />;
      case 'cannon':
      case 'archertower':
        return (
          <>
            <Stat label="Daño por disparo" value={defenseDamage(b.type, lvl)} next={defenseDamage(b.type, lvl + 1)} />
            <Stat label="Alcance" value={`${def.range} casillas`} />
            <Stat label="Cadencia" value={`${def.fireRate}s`} />
          </>
        );
      case 'wall':
        return (
          <>
            <Stat label="Puntos de Vida (HP)" value={buildingHp('wall', lvl)} next={buildingHp('wall', lvl + 1)} />
            <Stat label="Tamaño en casillas" value="1x1" />
            <Stat label="Material" value={lvl <= 2 ? '🪵 Troncos rústicos' : lvl <= 4 ? '🧱 Piedra reforzada' : lvl <= 7 ? '🏰 Almenas de castillo' : '👑 Obsidiana imperial y oro'} />
          </>
        );
      default:
        return null;
    }
  };

  const heroCost = HeroManager.getUpgradeCost(state.heroLevel);

  return (
    <Sheet title={<>{def.name} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nv.{b.level}</span></>} onClose={onClose} wide>
      <div className="flex-col gap-3">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{def.description}</p>
        <div className="two-col">
          <div style={panel} className="flex-col gap-2">
            <Stat label="Vida" value={buildingHp(b.type, lvl)} />
            {renderStats()}
          </div>

          {b.type === 'altar' && (() => {
            const hStats = HeroManager.heroStats(state.heroLevel);
            const isRec = HeroManager.isHeroRecovering(state);
            const recMs = HeroManager.heroRecoveryTimeLeft(state);
            const healCost = HeroManager.healCostGems(state);

            return (
              <div style={panel} className="flex-col gap-2">
                <b>👑 {hStats.name}</b>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  ⚔️ Vida: <b>{hStats.hp}</b> · Daño: <b>{hStats.dps} DPS</b> (Hendidura)
                </div>
                {isRec ? (
                  <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 159, 67, 0.15)', border: '1px solid #ff9f43' }}>
                    <div style={{ fontSize: '12px', color: '#ff9f43', fontWeight: 600 }}>
                      💤 Recuperándose: {Math.ceil(recMs / 1000)}s
                    </div>
                    <button className="btn-gem" style={{ width: '100%', marginTop: '6px', padding: '6px 10px', fontSize: '12px' }}
                      disabled={state.gems < healCost}
                      onClick={() => healHeroWithGems()}>
                      Despertar al instante — 💎 {healCost}
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#2ed573' }}>
                    ✓ Listo para el combate. Úsalo sin límite mientras sobreviva.
                  </div>
                )}
                <button className="btn-gem" disabled={state.gems < heroCost} style={{ padding: '8px 10px', marginTop: '4px' }}
                  onClick={() => { upgradeHero(); EffectManager.fireHeroUpgrade(); }}>
                  Mejorar Héroe — 💎 {heroCost}
                </button>
              </div>
            );
          })()}
        </div>

        {b.type === 'blacksmith' && (
          <div className="flex-col gap-2" style={{ marginTop: '8px' }}>
            <b style={{ fontSize: '15px', color: 'var(--accent-gold)' }}>⚒️ Mejoras de Tropas y Héroe</b>
            <TroopUpgradePanel initialTab="troops" />
          </div>
        )}
        {b.type === 'barracks' && (
          <div className="flex-col gap-3">
            <TrainTroopsPanel />
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
              <b style={{ fontSize: '15px', color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚒️</span> Laboratorio de Tropas
              </b>
              <TroopUpgradePanel initialTab="troops" />
            </div>
          </div>
        )}
        {b.type === 'townhall' && <DefensePanel />}
        {b.type === 'altar' && (
          <div className="flex-col gap-3">
            <TroopUpgradePanel initialTab="hero" />
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
              <b style={{ fontSize: '15px', color: 'var(--accent-gold)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔱</span> Panteón de los Dioses
              </b>
              <GodsPanel />
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
};
