import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGame } from '../../core/GameContext';
import { GameConfig } from '../../config/GameConfig';
import type { TroopId } from '../../core/GameState';
import { UpgradeManager } from '../../core/UpgradeManager';
import { EconomyManager } from '../../core/EconomyManager';
import { PvpManager } from '../../core/pvp/PvpManager';
import { TROOP_ICONS } from '../troopIcons';
import { StylizedTroop } from '../common/StylizedCharacters';

const TROOP_IDS = Object.keys(GameConfig.troops) as TroopId[];

interface TroopMeta {
  role: string;
  targetType: string;
  speed: string;
  description: string;
  modelScale: number;
  cameraY: number;
}

const TROOP_META: Record<TroopId, TroopMeta> = {
  infantry: {
    role: 'Asalto Melé & Vanguardia',
    targetType: 'Terrestre (Cuerpo a cuerpo)',
    speed: 'Media (1.0x)',
    description: 'Guerrero fiero de primera línea. Equipado con espadón templado y hombreras de hierro, resiste el fuego enemigo y abre paso al resto del ejército.',
    modelScale: 1.25,
    cameraY: 0.65,
  },
  archers: {
    role: 'Tiradora Ágil a Distancia',
    targetType: 'Terrestre y Aéreo (Flechas)',
    speed: 'Rápida (1.2x)',
    description: 'Experta arquera elfa de cabellera magenta. Dispara ráfagas veloces de flechas certeras desde la retaguardia, perfecta para abatir defensas lejanas.',
    modelScale: 1.25,
    cameraY: 0.65,
  },
  cavalry: {
    role: 'Carga Pesada & Flanqueo',
    targetType: 'Terrestre (Lanza de torneo)',
    speed: 'Muy Rápida (1.6x)',
    description: 'Caballero montado con armadura completa y corcel de guerra. Su devastadora carga rompe las filas enemigas y alcanza objetivos clave con rapidez.',
    modelScale: 1.1,
    cameraY: 0.72,
  },
  mages: {
    role: 'Bruja Arcana & Hechicera',
    targetType: 'Terrestre y Aéreo (Hechizos arcanos)',
    speed: 'Rápida (Vuelo en escoba mágica)',
    description: 'Poderosa bruja mística montada en su escoba voladora encantada. Con su icónico sombrero puntiagudo y cabellos oscuros, surca los cielos y desata ráfagas de magia arcana sobre las defensas enemigas.',
    modelScale: 0.95,
    cameraY: 0.72,
  },
  catapults: {
    role: 'Asedio & Destrucción de Murallas',
    targetType: 'Estructuras y Murallas (Área)',
    speed: 'Lenta (0.7x)',
    description: 'Ingeniería de asedio pesada construida con madera de roble y engranajes de hierro. Arroja peñascos llameantes que pulverizan las murallas y baluartes más resistentes.',
    modelScale: 1.05,
    cameraY: 0.55,
  },
  healers: {
    role: 'Apoyo Sagrado & Sanación',
    targetType: 'Tropas aliadas (Regeneración)',
    speed: 'Rápida (Alas angelicales)',
    description: 'Serena sacerdotisa bendecida con alas sagradas y aureola mística. Proyecta halos de luz divina que restauran continuamente la salud de las tropas heridas.',
    modelScale: 1.2,
    cameraY: 0.65,
  },
  skeletons: {
    role: 'Horda Ágil de Esqueletos',
    targetType: 'Terrestre (Cuerpo a cuerpo en enjambre)',
    speed: 'Muy Rápida (1.5x)',
    description: 'Enjambre de ágiles guerreros no-muertos resucitados de las catacumbas. Aunque frágiles individualmente, avanzan en horda implacable y abruman a las defensas enemigas con ataques masivos.',
    modelScale: 1.15,
    cameraY: 0.48,
  },
};

/** 3D Pedestal Stage for previewing the character with 360° orbit rotation */
const Troop3DStage: React.FC<{
  troopId: TroopId;
  isAttacking: boolean;
  isMoving?: boolean;
}> = ({ troopId, isAttacking, isMoving = false }) => {
  const meta = TROOP_META[troopId] || TROOP_META.mages;

  return (
    <Canvas
      shadows
      camera={{ position: [0, meta.cameraY + 0.15, 2.9], fov: 44 }}
      style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}
    >
      {/* Dynamic studio lighting */}
      <ambientLight intensity={0.95} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.65} color="#8ec5fc" />
      <pointLight position={[0, 3, 0]} intensity={0.8} color="#e0c3fc" />

      {/* OrbitControls targeting the character's torso / center for perfect framing */}
      <OrbitControls
        target={[0, meta.cameraY, 0]}
        enableZoom={true}
        minDistance={1.5}
        maxDistance={4.2}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!isAttacking && !isMoving}
        autoRotateSpeed={0.9}
        makeDefault
      />

      <Suspense fallback={null}>
        <group position={[0, 0, 0]}>
          {/* Circular Stage / Pedestal */}
          <mesh position={[0, -0.04, 0]} receiveShadow>
            <cylinderGeometry args={[1.1, 1.22, 0.08, 36]} />
            <meshStandardMaterial color="#1e2330" roughness={0.65} metalness={0.3} />
          </mesh>
          <mesh position={[0, -0.001, 0]} receiveShadow>
            <cylinderGeometry args={[0.98, 1.08, 0.02, 36]} />
            <meshStandardMaterial color="#2d3748" roughness={0.5} />
          </mesh>
          {/* Glowing Golden Arcane Rim */}
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.96, 1.02, 36]} />
            <meshBasicMaterial color="#f6b93b" />
          </mesh>

          {/* Active 3D Character Model */}
          <group position={[0, 0, 0]}>
            <StylizedTroop
              type={troopId}
              isMoving={isMoving}
              isAttacking={isAttacking}
              animOffset={0}
              scale={meta.modelScale}
            />
          </group>
        </group>
      </Suspense>
    </Canvas>
  );
};

export const TrainTroopsInspector: React.FC = () => {
  const { state, trainTroop } = useGame();
  // Default to 'mages' so the Bruja is immediately highlighted and visible!
  const [selectedTroop, setSelectedTroop] = useState<TroopId>('mages');
  const [animMode, setAnimMode] = useState<'idle' | 'run' | 'attack'>('idle');

  const isAttacking = animMode === 'attack';
  const isMoving = animMode === 'run';

  const total = PvpManager.totalTroops(state);
  const max = UpgradeManager.getTroopCapacity(state);
  const isFull = total >= max;

  const currentTroop = GameConfig.troops[selectedTroop];
  const meta = TROOP_META[selectedTroop] || TROOP_META.mages;
  const isUnlocked = UpgradeManager.isTroopUnlocked(state, selectedTroop);
  const reqText = UpgradeManager.getUnlockRequirementText(selectedTroop);
  const lvl = state.troopLevels?.[selectedTroop] || 1;
  const mult = 1 + (lvl - 1) * 0.22;
  const scaledPower = Math.round(currentTroop.power * mult);
  const scaledHp = Math.round(currentTroop.hp * mult);

  const canTrain1 = isUnlocked && EconomyManager.canAfford(state, currentTroop.cost, 'coins') && !isFull;
  const canTrain5 = isUnlocked && EconomyManager.canAfford(state, currentTroop.cost * 5, 'coins') && (total + 5 <= max);

  const handleTrain = (count: number) => {
    for (let i = 0; i < count; i++) {
      trainTroop(selectedTroop);
    }
  };

  return (
    <div className="flex-col gap-3" style={{ width: '100%' }}>
      {/* Army Global Capacity Header */}
      <div
        className="flex-row justify-between"
        style={{
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '8px 14px',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
        }}
      >
        <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>🪖</span>
          <div className="flex-col">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Capacidad Total del Cuartel</span>
            <span style={{ fontSize: '11px', color: isFull ? 'var(--accent-danger)' : '#2ed573', fontWeight: 600 }}>
              {isFull ? '⚠️ Capacidad Máxima Alcanzada' : 'Listo para reclutar tropas'}
            </span>
          </div>
        </div>
        <div className="flex-col" style={{ alignItems: 'flex-end' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: isFull ? 'var(--accent-danger)' : 'var(--accent-energy)',
            }}
          >
            {total} / {max}
          </span>
          <div
            style={{
              width: '100px',
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, (total / Math.max(1, max)) * 100)}%`,
                height: '100%',
                background: isFull ? 'var(--accent-danger)' : 'var(--accent-energy)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Troop Roster Tabs / Quick Selector */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
          gap: '6px',
          width: '100%',
        }}
      >
        {TROOP_IDS.map((id) => {
          const troop = GameConfig.troops[id];
          const unlocked = UpgradeManager.isTroopUnlocked(state, id);
          const isSelected = selectedTroop === id;
          const count = (state.troops[id] || 0) + (state.garrison?.[id] || 0);

          return (
            <button
              key={id}
              onClick={() => setSelectedTroop(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 4px',
                borderRadius: '12px',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(246, 185, 59, 0.25) 0%, rgba(225, 112, 85, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                boxShadow: isSelected ? '0 0 12px rgba(246, 185, 59, 0.35)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: unlocked ? 1 : 0.65,
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '24px', filter: unlocked ? 'none' : 'grayscale(1)' }}>
                {TROOP_ICONS[id]}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent-gold)' : '#fff',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {troop.name}
              </span>
              <div className="flex-row gap-1" style={{ alignItems: 'center', marginTop: '2px' }}>
                {unlocked ? (
                  <span style={{ fontSize: '10px', color: '#2ed573', fontWeight: 600 }}>×{count}</span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#ff6b81' }}>🔒</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Split-Screen Inspector Area */}
      <div
        className="inspector-split"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1.1fr) minmax(280px, 1fr)',
          gap: '14px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '16px',
          border: '1px solid var(--glass-border)',
          padding: '12px',
          minHeight: '380px',
        }}
      >
        {/* Left Side: Interactive 3D Model Stage */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            minHeight: '340px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 40%, rgba(45, 52, 71, 0.8) 0%, rgba(15, 20, 30, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Top Stage Badges */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              gap: '6px',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(0, 0, 0, 0.65)',
                color: 'var(--accent-gold)',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(246, 185, 59, 0.4)',
                backdropFilter: 'blur(4px)',
              }}
            >
              Nv.{lvl}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'rgba(0, 0, 0, 0.65)',
                color: isUnlocked ? '#2ed573' : '#ff6b81',
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {isUnlocked ? '✓ Disponible' : '🔒 Bloqueado'}
            </span>
          </div>

          {/* Animation Mode Action Buttons (Baile, Correr, Atacar) */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 10,
              display: 'flex',
              gap: '6px',
            }}
          >
            <button
              onClick={() => setAnimMode('idle')}
              style={{
                background: animMode === 'idle' ? 'rgba(108, 92, 231, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                border: animMode === 'idle' ? '1px solid #a29bfe' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
              title="Baile / Rattle"
            >
              🕺 Baile
            </button>
            <button
              onClick={() => setAnimMode('run')}
              style={{
                background: animMode === 'run' ? 'rgba(0, 184, 148, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                border: animMode === 'run' ? '1px solid #55efc4' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
              title="Carrera ágil"
            >
              🏃 Correr
            </button>
            <button
              onClick={() => setAnimMode('attack')}
              style={{
                background: animMode === 'attack' ? 'rgba(214, 48, 49, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                border: animMode === 'attack' ? '1px solid #ff7675' : '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 9px',
                borderRadius: '8px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
              title="Ataque con espada"
            >
              ⚔️ Atacar
            </button>
          </div>

          {/* The Live 3D Scene */}
          <Troop3DStage
            troopId={selectedTroop}
            isAttacking={isAttacking}
            isMoving={isMoving}
          />

          {/* 360° Drag & Rotate Helper Hint */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🔄</span> Arrastra para girar 360° · Rueda para zoom
          </div>
        </div>

        {/* Right Side: Troop Characteristics & Training HQ */}
        <div className="flex-col justify-between" style={{ gap: '10px', width: '100%' }}>
          {/* Header Info */}
          <div className="flex-col gap-1">
            <div className="flex-row justify-between" style={{ alignItems: 'baseline' }}>
              <h3
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#fff',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{TROOP_ICONS[selectedTroop]}</span>
                <span>{currentTroop.name}</span>
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--accent-gold)',
                  background: 'rgba(246, 185, 59, 0.15)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(246, 185, 59, 0.3)',
                }}
              >
                {meta.role}
              </span>
            </div>

            <p
              style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                margin: '4px 0 0 0',
                lineHeight: 1.4,
              }}
            >
              {meta.description}
            </p>
          </div>

          {/* Combat Characteristics Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              width: '100%',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>⚔️ Poder / Daño (DPS)</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ff7675', marginTop: '2px' }}>
                {scaledPower}{' '}
                {lvl > 1 && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    (+{scaledPower - currentTroop.power})
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>❤️ Salud (HP)</span>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#2ed573', marginTop: '2px' }}>
                {scaledHp}{' '}
                {lvl > 1 && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    (+{scaledHp - currentTroop.hp})
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🎯 Tipo de Ataque</span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#74b9ff', marginTop: '2px' }}>
                {meta.targetType}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>⚡ Velocidad</span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffeaa7', marginTop: '2px' }}>
                {meta.speed}
              </div>
            </div>
          </div>

          {/* Current Army Inventory for this unit */}
          <div
            className="flex-row justify-between"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '6px 10px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>En tu ejército:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
              {state.troops[selectedTroop] || 0} listos{' '}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                (+{state.garrison?.[selectedTroop] || 0} en defensa)
              </span>
            </span>
          </div>

          {/* Training Control Section */}
          <div className="flex-col gap-2" style={{ marginTop: 'auto' }}>
            {!isUnlocked ? (
              <div
                style={{
                  background: 'rgba(255, 107, 129, 0.15)',
                  border: '1px solid rgba(255, 107, 129, 0.4)',
                  padding: '10px',
                  borderRadius: '10px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '12px', color: '#ff6b81', fontWeight: 700 }}>
                  🔒 {reqText}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Puedes rotar y ver el modelo en 3D mientras desbloqueas su entrenamiento.
                </div>
              </div>
            ) : (
              <div className="flex-row gap-2" style={{ width: '100%' }}>
                <button
                  className="btn-primary"
                  disabled={!canTrain1}
                  onClick={() => handleTrain(1)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                  }}
                >
                  <span>Entrenar +1</span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>🪙 {currentTroop.cost}</span>
                </button>

                <button
                  className="btn-primary"
                  disabled={!canTrain5}
                  onClick={() => handleTrain(5)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    background: canTrain5
                      ? 'linear-gradient(135deg, #0984e3 0%, #6c5ce7 100%)'
                      : undefined,
                  }}
                >
                  <span>Entrenar +5</span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>🪙 {currentTroop.cost * 5}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
