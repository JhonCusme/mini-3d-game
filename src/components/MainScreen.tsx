import { Component, useState, Suspense, useMemo, type ReactNode } from 'react';
import { useGame } from '../core/GameContext';
import { GameConfig } from '../config/GameConfig';
import { UpgradeManager } from '../core/UpgradeManager';
import { EconomyManager } from '../core/EconomyManager';
import { HeroManager } from '../core/HeroManager';
import { EffectManager } from '../core/EffectManager';
import { PvpManager } from '../core/pvp/PvpManager';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useGLTF } from '@react-three/drei';

interface BuildingDef {
  id: string;
  icon: string;
  name: string;
  upgradeId?: keyof typeof GameConfig.upgrades;
  type: 'castle' | 'upgrade' | 'troops' | 'hero';
  position: [number, number, number];
  color: string;
}

const BUILDINGS: BuildingDef[] = [
  { id: 'castle', icon: '/assets/buildings/castle.jpg', name: 'Castillo', type: 'castle', position: [0, 0, -2], color: '#ffd700' },
  { id: 'goldmine', icon: '/assets/buildings/goldmine.jpg', name: 'Mina', upgradeId: 'economy', type: 'upgrade', position: [-6, 0, 0], color: '#b8860b' },
  { id: 'barracks', icon: '/assets/buildings/barracks.jpg', name: 'Cuartel', upgradeId: 'troopCapacity', type: 'troops', position: [6, 0, 0], color: '#8b0000' },
  { id: 'blacksmith', icon: '/assets/buildings/blacksmith.jpg', name: 'Herrería', upgradeId: 'attackPower', type: 'upgrade', position: [-3, 0, 4], color: '#555555' },
  { id: 'armory', icon: '/assets/buildings/armory.jpg', name: 'Armería', upgradeId: 'troopHealth', type: 'upgrade', position: [3, 0, 4], color: '#4682b4' },
  { id: 'arena', icon: '/assets/buildings/arena.jpg', name: 'Arena', upgradeId: 'critRate', type: 'upgrade', position: [0, 0, 6], color: '#cd853f' },
  { id: 'hero', icon: '/assets/buildings/hero_altar.jpg', name: 'Altar', type: 'hero', position: [0, 0, 2], color: '#7b4dff' },
];

const TROOP_ICONS: Record<string, string> = {
  infantry: '🗡️',
  archers: '🏹',
  cavalry: '🐴',
  mages: '🧙',
  catapults: '💣',
  healers: '💚',
};

// Catches model loading errors (e.g. missing .gltf files) and shows a simple fallback instead
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* fallback shown */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

type PropTransform = { position: [number, number, number]; rotation: [number, number, number]; scale?: number };

const GltfModel = ({ url, position, rotation, scale = 1 }: PropTransform & { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} receiveShadow castShadow />;
};

const GrassFallback = ({ position, rotation, scale = 1 }: PropTransform) => (
  <mesh position={position} rotation={rotation} scale={scale * 0.3} castShadow>
    <coneGeometry args={[0.4, 1, 5]} />
    <meshStandardMaterial color="#3fa34d" roughness={1} />
  </mesh>
);

const TreeFallback = ({ position, rotation, scale = 1 }: PropTransform) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.45, 3, 6]} />
      <meshStandardMaterial color="#6b4423" roughness={1} />
    </mesh>
    <mesh position={[0, 4.5, 0]} castShadow>
      <icosahedronGeometry args={[2, 0]} />
      <meshStandardMaterial color="#8e5ab8" roughness={0.9} flatShading />
    </mesh>
  </group>
);

const RockFallback = ({ position, rotation, scale = 1 }: PropTransform) => (
  <mesh position={position} rotation={rotation} scale={scale * 1.5} castShadow receiveShadow>
    <dodecahedronGeometry args={[0.8, 0]} />
    <meshStandardMaterial color="#8a8275" roughness={1} flatShading />
  </mesh>
);

const GrassModel = (p: PropTransform) => (
  <ModelBoundary fallback={<GrassFallback {...p} />}>
    <GltfModel url="/assets/models/grass/grass_medium_01_4k.gltf" {...p} />
  </ModelBoundary>
);

const TreeModel = (p: PropTransform) => (
  <ModelBoundary fallback={<TreeFallback {...p} />}>
    <GltfModel url="/assets/models/tree/jacaranda_tree_4k.gltf" {...p} />
  </ModelBoundary>
);

const RockModel = (p: PropTransform) => (
  <ModelBoundary fallback={<RockFallback {...p} />}>
    <GltfModel url="/assets/models/rock/namaqualand_boulder_02_4k.gltf" {...p} />
  </ModelBoundary>
);

const BuildingMesh = ({ b, level, canUpgrade, onClick }: any) => {
  const isCastle = b.type === 'castle';
  
  return (
    <group position={b.position} onClick={(e) => { e.stopPropagation(); onClick(b); }}>
      <mesh castShadow receiveShadow>
        {isCastle ? (
          <>
            <cylinderGeometry args={[2, 2.5, 3, 8]} />
            <meshStandardMaterial color={b.color} roughness={0.6} metalness={0.2} />
            <mesh position={[0, 2.5, 0]} castShadow>
              <coneGeometry args={[2.2, 2, 8]} />
              <meshStandardMaterial color="#ff4757" />
            </mesh>
          </>
        ) : (
          <>
            <boxGeometry args={[2, 1.5, 2]} />
            <meshStandardMaterial color={b.color} roughness={0.8} />
            <mesh position={[0, 1.2, 0]} castShadow>
              <coneGeometry args={[1.5, 1, 4]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
          </>
        )}
      </mesh>

      <Html position={[0, isCastle ? 4.5 : 2.5, 0]} center zIndexRange={[100, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.85)', padding: '6px 10px', borderRadius: '12px', 
          border: '2px solid ' + (canUpgrade ? '#2ed573' : 'rgba(255,215,0,0.5)'),
          color: 'white', whiteSpace: 'nowrap', textAlign: 'center', pointerEvents: 'none',
          boxShadow: canUpgrade ? '0 0 15px rgba(46, 213, 115, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
          transform: canUpgrade ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s',
          fontFamily: 'Outfit, sans-serif'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '800' }}>{b.name}</div>
          <div style={{ fontSize: '11px', color: '#ffd700', fontWeight: '600' }}>Nv. {level}</div>
          {canUpgrade && <div style={{ fontSize: '10px', color: '#2ed573', marginTop: '2px', fontWeight: '800' }}>⬆ MEJORAR</div>}
        </div>
      </Html>
    </group>
  );
};

export const MainScreen: React.FC = () => {
  const { state, purchaseUpgrade, trainTroop, upgradeHero } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDef | null>(null);

  const grassPatches = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      position: [(Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40] as [number, number, number],
      rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
      scale: 1.5 + Math.random() * 1.5,
    }));
  }, []);

  const trees = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: [(Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40] as [number, number, number],
      rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number],
      scale: 0.4 + Math.random() * 0.3, // Árboles más pequeños
    }));
  }, []);

  const rocks = useMemo(() => {
    return Array.from({ length: 8 }).map(() => ({
      position: [(Math.random() - 0.5) * 35, 0, (Math.random() - 0.5) * 35] as [number, number, number],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
      scale: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  const totalTroops = PvpManager.totalTroops(state);
  const maxCapacity = UpgradeManager.getTroopCapacity(state);
  const heroCost = HeroManager.getUpgradeCost(state.heroLevel);

  const canUpgradeBuilding = (b: BuildingDef) => {
    if (!b.upgradeId) return false;
    const currentLevel = state.upgrades[b.upgradeId] || 0;
    const cost = UpgradeManager.getCost(b.upgradeId, currentLevel);
    return EconomyManager.canAfford(state, cost, 'coins');
  };

  const getBuildingLevel = (b: BuildingDef) => {
    if (b.type === 'castle') return state.level;
    if (b.type === 'hero') return state.heroLevel;
    if (b.upgradeId) return state.upgrades[b.upgradeId] || 0;
    return 0;
  };

  const handleBuildingClick = (b: BuildingDef) => {
    setSelectedBuilding(b);
  };

  const renderUpgradeModal = () => {
    if (!selectedBuilding) return null;
    const b = selectedBuilding;

    return (
      <div className="building-modal-overlay" onClick={() => setSelectedBuilding(null)} style={{ zIndex: 1000 }}>
        <div className="building-modal animate-pop" onClick={e => e.stopPropagation()}>
          <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
            {/* Header */}
            <div className="modal-building-img">
              <img src={b.icon} alt={b.name} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '2px solid var(--accent-gold)' }} />
            </div>
            <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '22px' }}>
              {b.name}
            </h2>
            <div style={{ fontSize: '13px', color: 'var(--accent-gold)', background: 'rgba(255,215,0,0.1)', padding: '4px 14px', borderRadius: '12px' }}>
              Nivel {getBuildingLevel(b)}
            </div>

            {/* Castle info */}
            {b.type === 'castle' && (
              <div className="flex-col gap-2" style={{ width: '100%' }}>
                <div className="troop-row">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Experiencia</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{state.experience}</span>
                </div>
                <div className="troop-row">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Ingreso Pasivo</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                    +{Math.floor((state.upgrades.economy || 0) * GameConfig.upgrades.economy.effectBase * GameConfig.upgrades.economy.effectMultiplier)} 🪙/seg
                  </span>
                </div>
                <div className="troop-row">
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Prestigio</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-gem-light)' }}>⭐ {state.prestigeLevel}</span>
                </div>
              </div>
            )}

            {/* Upgrade building */}
            {b.type === 'upgrade' && b.upgradeId && (() => {
              const upgradeConfig = GameConfig.upgrades[b.upgradeId!];
              const currentLevel = state.upgrades[b.upgradeId!] || 0;
              const cost = UpgradeManager.getCost(b.upgradeId!, currentLevel);
              const canAfford = EconomyManager.canAfford(state, cost, 'coins');

              return (
                <div className="flex-col gap-3" style={{ width: '100%' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {upgradeConfig.description}
                  </p>
                  <button
                    className="btn-upgrade"
                    disabled={!canAfford}
                    onClick={() => { purchaseUpgrade(b.upgradeId!); }}
                    style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                  >
                    Mejorar — 🪙 {cost}
                  </button>
                </div>
              );
            })()}

            {/* Troops */}
            {b.type === 'troops' && (
              <div className="flex-col gap-2" style={{ width: '100%' }}>
                <div className="flex-row justify-between" style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ejército</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: totalTroops >= maxCapacity ? 'var(--accent-danger)' : 'var(--accent-energy)' }}>
                    {totalTroops} / {maxCapacity}
                  </span>
                </div>
                {Object.entries(GameConfig.troops).map(([id, troop]) => {
                  const count = state.troops[id as keyof typeof state.troops] || 0;
                  const canAfford = EconomyManager.canAfford(state, troop.cost, 'coins');
                  const canTrain = canAfford && totalTroops < maxCapacity;
                  return (
                    <div key={id} className="troop-row">
                      <div className="flex-row gap-2">
                        <span className="troop-icon">{TROOP_ICONS[id] || '⚔️'}</span>
                        <div className="flex-col">
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{troop.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>⚔️{troop.power} | ×{count}</span>
                        </div>
                      </div>
                      <button
                        className="btn-primary"
                        disabled={!canTrain}
                        onClick={() => trainTroop(id as any)}
                        style={{ padding: '6px 12px', fontSize: '12px', minWidth: '80px' }}
                      >
                        🪙 {troop.cost}
                      </button>
                    </div>
                  );
                })}
                {/* Also show barracks upgrade */}
                {b.upgradeId && (() => {
                  const currentLevel = state.upgrades[b.upgradeId!] || 0;
                  const cost = UpgradeManager.getCost(b.upgradeId!, currentLevel);
                  const canAfford = EconomyManager.canAfford(state, cost, 'coins');
                  return (
                    <button
                      className="btn-upgrade"
                      disabled={!canAfford}
                      onClick={() => purchaseUpgrade(b.upgradeId!)}
                      style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '8px' }}
                    >
                      Ampliar Cuartel — 🪙 {cost}
                    </button>
                  );
                })()}
              </div>
            )}

            {/* Hero */}
            {b.type === 'hero' && (
              <div className="flex-col gap-3" style={{ width: '100%' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Otorga +{Math.round((state.heroLevel - 1) * GameConfig.heroPowerMultiplierPerLevel * 100)}% de Poder Total a tus tropas.
                </p>
                <button
                  className="btn-gem"
                  disabled={state.gems < heroCost}
                  onClick={() => { upgradeHero(); EffectManager.fireHeroUpgrade(); }}
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  Subir de Nivel — 💎 {heroCost}
                </button>
              </div>
            )}

            {/* Close */}
            <button
              onClick={() => setSelectedBuilding(null)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
                padding: '10px',
                width: '100%',
                marginTop: '4px',
                boxShadow: 'none',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-col gap-3" style={{ height: '100%', flex: 1, paddingBottom: '20px' }}>
      
      {/* 3D World Canvas */}
      <div style={{ width: '100%', height: '420px', borderRadius: '24px', overflow: 'hidden', position: 'relative', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', border: '2px solid rgba(255,215,0,0.2)' }}>
        
        {/* Sky background gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)', zIndex: 0 }} />
        
        <Canvas shadows camera={{ position: [0, 8, 12], fov: 50 }} style={{ zIndex: 1, position: 'absolute', inset: 0 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
          
          <OrbitControls 
            enablePan={false} 
            maxPolarAngle={Math.PI / 2 - 0.1} 
            minDistance={5} 
            maxDistance={25} 
          />
          
          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#4caf50" roughness={1} />
          </mesh>

          <Suspense fallback={null}>
            {grassPatches.map((patch, i) => (
              <GrassModel key={`grass-${i}`} position={patch.position} rotation={patch.rotation} scale={patch.scale} />
            ))}
            {trees.map((t, i) => (
              <TreeModel key={`tree-${i}`} position={t.position} rotation={t.rotation} scale={t.scale} />
            ))}
            {rocks.map((r, i) => (
              <RockModel key={`rock-${i}`} position={r.position} rotation={r.rotation} scale={r.scale} />
            ))}
          </Suspense>

          {BUILDINGS.map((b) => (
            <BuildingMesh 
              key={b.id} 
              b={b} 
              level={getBuildingLevel(b)}
              canUpgrade={b.type === 'upgrade' && canUpgradeBuilding(b)}
              onClick={handleBuildingClick}
            />
          ))}
        </Canvas>
      </div>

      {/* Army summary */}
      <div className="glass-panel flex-row justify-between" style={{ padding: '14px 20px', margin: '0 4px' }}>
        <div className="flex-row gap-3">
          <span style={{ fontSize: '24px' }}>⚔️</span>
          <div className="flex-col">
            <span style={{ fontWeight: 800, fontSize: '15px' }}>Ejército</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {totalTroops}/{maxCapacity} tropas
            </span>
          </div>
        </div>
        <div className="flex-row gap-4" style={{ fontSize: '14px' }}>
          {Object.entries(state.troops).map(([id, count]) => {
            if (count <= 0) return null;
            return (
              <span key={id} style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {TROOP_ICONS[id]} <span style={{ color: 'var(--accent-gold)' }}>{count}</span>
              </span>
            );
          })}
        </div>
      </div>

      {renderUpgradeModal()}
    </div>
  );
};
