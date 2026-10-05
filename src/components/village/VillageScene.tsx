import { useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { MOUSE, TOUCH, ACESFilmicToneMapping, type Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { BUILDINGS, mineCapacity, farmCapacity } from '../../config/BuildingsConfig';
import type { PlacedBuilding, TroopCounts, KingdomType } from '../../core/GameState';
import { getKingdomConfig, type KingdomVisualTheme } from '../../config/KingdomsConfig';
import { BuildingModel, Scaffolding } from './BuildingModels';
import { VillageTerrain } from './VillageTerrain';
import { VillageTroops } from './VillageTroops';

export const CAMERA_POSITION: [number, number, number] = [13, 17, 13];
export const PAN_LIMIT = 6.5; // Strictly bounds camera so it cannot pan beyond the square boundary
const TAP_TOLERANCE = 8; // pixels a pointer may move and still count as a tap

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/** Isometric-style camera: pan with one finger / left mouse, pinch or wheel to zoom, no rotation. */
export const RtsControls: React.FC<{ enabled?: boolean; panLimit?: number }> = ({ enabled = true, panLimit = PAN_LIMIT }) => {
  const ref = useRef<OrbitControlsImpl>(null);
  return (
    <OrbitControls
      ref={ref}
      enabled={enabled}
      enableRotate={false}
      screenSpacePanning={false}
      minDistance={14}
      maxDistance={38}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
      onChange={() => {
        const c = ref.current;
        if (!c) return;
        const t = c.target;
        const cx = Math.max(-panLimit, Math.min(panLimit, t.x));
        const cz = Math.max(-panLimit, Math.min(panLimit, t.z));
        if (cx !== t.x || cz !== t.z || t.y !== 0) {
          c.object.position.x += cx - t.x;
          c.object.position.z += cz - t.z;
          t.set(cx, 0, cz);
        }
      }}
    />
  );
};

export const SceneLights: React.FC<{ theme?: KingdomVisualTheme }> = ({ theme }) => (
  <>
    <hemisphereLight
      args={[
        theme?.hemisphereSky || '#eaf4ff',
        theme?.hemisphereGround || '#3e5c2b',
        0.82,
      ]}
    />
    {/* Key Sun Directional Light */}
    <directionalLight
      position={[18, 32, 12]}
      intensity={theme?.lightIntensity ? theme.lightIntensity * 1.05 : 1.7}
      color={theme?.lightColor || '#fff8ec'}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-bias={-0.0004}
      shadow-camera-left={-22}
      shadow-camera-right={22}
      shadow-camera-top={22}
      shadow-camera-bottom={-22}
    />
    {/* Cinematic Rim/Fill Light for realistic 3D silhouettes & material sheen */}
    <directionalLight
      position={[-18, 22, -14]}
      intensity={0.52}
      color="#9bc5f5"
    />
  </>
);

export function buildingCenter(b: Pick<PlacedBuilding, 'type' | 'x' | 'z'>): [number, number, number] {
  const s = BUILDINGS[b.type].size;
  return [b.x + s / 2, 0, b.z + s / 2];
}

interface VillageSceneProps {
  village: PlacedBuilding[];
  now: number;
  selectedUid: string | null;
  moving: { uid: string; x: number; z: number; valid: boolean } | null;
  kingdom?: KingdomType;
  garrison?: TroopCounts;
  troops?: TroopCounts;
  onSelect: (uid: string | null) => void;
  onMoveTo: (x: number, z: number) => void;
  onCollect: (uid: string) => void;
  heroLevel?: number;
  heroRecoveringUntil?: number;
}

/** Spinning resource badge above goldmine (coin) or farm (bread/wheat): tap it to collect. */
const CollectResource: React.FC<{ type: 'goldmine' | 'farm'; onCollect: () => void }> = ({ type, onCollect }) => {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 2.5;
    ref.current.position.y = 3 + Math.sin(clock.elapsedTime * 3) * 0.2;
  });
  return (
    <group
      ref={ref}
      position={[0, 3, 0]}
      onClick={e => { e.stopPropagation(); if (e.delta <= TAP_TOLERANCE) onCollect(); }}
    >
      {type === 'goldmine' ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.6, 0.6, 0.15, 24]} />
          <meshStandardMaterial color="#ffd23a" metalness={0.8} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.5} />
        </mesh>
      ) : (
        <group>
          {/* Bread Loaf & Wheat harvest badge */}
          <mesh position={[0, 0, 0]} scale={[1.1, 0.7, 0.7]}>
            <sphereGeometry args={[0.55, 16, 12]} />
            <meshStandardMaterial color="#d49244" roughness={0.7} emissive="#965612" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.06, 0.08, 0.65, 8]} />
            <meshStandardMaterial color="#fef08a" emissive="#ca8a04" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.0, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

/** Floating worker fatigue badge above tired miners: tap to select and feed */
const WorkerFatigueBadge: React.FC<{ stamina: number; onClick: () => void }> = ({ stamina, onClick }) => {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 2.8 + Math.sin(clock.elapsedTime * 2.8) * 0.15;
  });
  return (
    <group
      ref={ref}
      position={[0, 2.8, 0]}
      onClick={e => { e.stopPropagation(); if (e.delta <= TAP_TOLERANCE) onClick(); }}
    >
      <Html center style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
        <div 
          onClick={onClick}
          className="animate-pop pulse-glow"
          style={{
            background: stamina < 15 
              ? 'linear-gradient(135deg, rgba(235, 77, 75, 0.95), rgba(192, 57, 43, 0.95))'
              : 'linear-gradient(135deg, rgba(243, 156, 18, 0.95), rgba(211, 84, 0, 0.95))',
            color: '#fff',
            padding: '3px 8px',
            borderRadius: '12px',
            border: '1.5px solid rgba(255,255,255,0.85)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            fontFamily: 'Outfit, sans-serif',
            userSelect: 'none'
          }}
        >
          <span>{stamina < 15 ? '😴' : '🥖'}</span>
          <span>{stamina < 15 ? '¡Agotados!' : 'Alimentar'}</span>
        </div>
      </Html>
    </group>
  );
};

const BuildingNode: React.FC<{
  b: PlacedBuilding; now: number; selected: boolean; ghost?: { x: number; z: number; valid: boolean };
  heroRecoveringUntil?: number;
  onSelect: (uid: string) => void; onCollect: (uid: string) => void;
}> = ({ b, now, selected, ghost, heroRecoveringUntil, onSelect, onCollect }) => {
  const def = BUILDINGS[b.type];
  const [cx, , cz] = buildingCenter(ghost ? { ...b, x: ghost.x, z: ghost.z } : b);
  const upgrading = b.upgradingUntil > now;
  const isHeroRecovering = b.type === 'altar' && !!heroRecoveringUntil && heroRecoveringUntil > now;
  const cap = b.type === 'goldmine' ? mineCapacity(b.level) : b.type === 'farm' ? farmCapacity(b.level) : 0;
  const showCollect = (b.type === 'goldmine' || b.type === 'farm') && b.stored >= Math.min(5, cap * 0.05) && !ghost;
  const isFatigued = b.type === 'goldmine' && (b.minerStamina ?? 100) < 35 && !showCollect && !upgrading;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > TAP_TOLERANCE) return;
    onSelect(b.uid);
  };

  return (
    <group position={[cx, 0, cz]} onClick={handleClick}>
      {/* Footprint pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[def.size - 0.1, def.size - 0.1]} />
        <meshStandardMaterial
          color={ghost ? (ghost.valid ? '#2ed573' : '#ff4757') : '#7a6a4f'}
          transparent opacity={ghost ? 0.6 : 0.35}
        />
      </mesh>
      {selected && !ghost && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[def.size * 0.62, def.size * 0.7, 32]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      )}

      <group scale={b.level === 0 ? 0.6 : 1}>
        <BuildingModel type={b.type} level={Math.max(1, b.level)} stamina={b.minerStamina} />
      </group>
      {upgrading && <Scaffolding size={def.size} />}

      {(selected || upgrading || isHeroRecovering) && (
        <Html position={[0, def.size + 1.2, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="scene-label">
            {selected && <div className="scene-label-title">{def.name} <span>Nv.{b.level}</span></div>}
            {upgrading && <div className="scene-label-timer">🔨 {formatDuration(b.upgradingUntil - now)}</div>}
            {!upgrading && isHeroRecovering && (
              <div className="scene-label-timer" style={{ color: '#ff9f43', border: '1.5px solid #ff9f43', background: 'rgba(20, 10, 5, 0.9)' }}>
                💤 {formatDuration((heroRecoveringUntil || 0) - now)}
              </div>
            )}
          </div>
        </Html>
      )}

      {showCollect && (b.type === 'goldmine' || b.type === 'farm') && (
        <CollectResource type={b.type} onCollect={() => onCollect(b.uid)} />
      )}

      {isFatigued && (
        <WorkerFatigueBadge stamina={b.minerStamina ?? 100} onClick={() => onSelect(b.uid)} />
      )}
    </group>
  );
};

export const VillageScene: React.FC<VillageSceneProps> = ({
  village, now, selectedUid, moving, kingdom = 'emerald', garrison, troops, heroLevel, heroRecoveringUntil, onSelect, onMoveTo, onCollect,
}) => {
  const kingdomInfo = getKingdomConfig(kingdom);
  const theme = kingdomInfo.visual;

  const groundPoint = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const b = moving && village.find(v => v.uid === moving.uid);
    if (!b) return;
    const s = BUILDINGS[b.type].size;
    onMoveTo(Math.round(e.point.x - s / 2), Math.round(e.point.z - s / 2));
  };

  return (
    <Canvas
      shadows
      camera={{ position: CAMERA_POSITION, fov: 38 }}
      className="village-canvas"
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
    >
      <color attach="background" args={[theme.skyColor]} />
      <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />
      <SceneLights theme={theme} />
      <RtsControls enabled={!moving} />

      <group
        onClick={e => { if (e.delta <= TAP_TOLERANCE && !moving) onSelect(null); }}
        onPointerDown={e => { if (moving) groundPoint(e); }}
        onPointerMove={e => { if (moving && e.buttons) groundPoint(e); }}
      >
        <VillageTerrain showGrid={!!moving} kingdom={kingdom} />
      </group>

      {village.map(b => (
        <BuildingNode
          key={b.uid}
          b={b}
          now={now}
          selected={b.uid === selectedUid}
          ghost={moving?.uid === b.uid ? moving : undefined}
          heroRecoveringUntil={heroRecoveringUntil}
          onSelect={uid => { if (!moving) onSelect(uid); }}
          onCollect={onCollect}
        />
      ))}

      {/* 3D Troops: Patrols wandering the village & Attack army practicing in training grounds */}
      <VillageTroops
        village={village}
        garrison={garrison}
        troops={troops}
        kingdom={kingdom}
        heroLevel={heroLevel}
        heroRecoveringUntil={heroRecoveringUntil}
        now={now}
      />
    </Canvas>
  );
};
