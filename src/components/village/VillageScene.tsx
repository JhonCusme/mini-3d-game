import { useRef } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { MOUSE, TOUCH, type Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { BUILDINGS, mineCapacity } from '../../config/BuildingsConfig';
import type { PlacedBuilding } from '../../core/GameState';
import type { KingdomType } from '../../core/GameState';
import { getKingdomConfig, type KingdomVisualTheme } from '../../config/KingdomsConfig';
import { BuildingModel, Scaffolding } from './BuildingModels';
import { VillageTerrain, Walls } from './VillageTerrain';

export const CAMERA_POSITION: [number, number, number] = [13, 17, 13];
const PAN_LIMIT = 18;
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
export const RtsControls: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const ref = useRef<OrbitControlsImpl>(null);
  return (
    <OrbitControls
      ref={ref}
      enabled={enabled}
      enableRotate={false}
      screenSpacePanning={false}
      minDistance={14}
      maxDistance={48}
      mouseButtons={{ LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
      touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
      onChange={() => {
        const c = ref.current;
        if (!c) return;
        const t = c.target;
        const cx = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, t.x));
        const cz = Math.max(-PAN_LIMIT, Math.min(PAN_LIMIT, t.z));
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
        theme?.hemisphereSky || '#dff2ff',
        theme?.hemisphereGround || '#4f7a3a',
        0.75,
      ]}
    />
    <directionalLight
      position={[18, 30, 10]}
      intensity={theme?.lightIntensity || 1.6}
      color={theme?.lightColor || '#ffffff'}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-20}
      shadow-camera-right={20}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
    />
  </>
);

export function buildingCenter(b: Pick<PlacedBuilding, 'type' | 'x' | 'z'>): [number, number, number] {
  const s = BUILDINGS[b.type].size;
  return [b.x + s / 2, 0, b.z + s / 2];
}

interface VillageSceneProps {
  village: PlacedBuilding[];
  wallsLevel: number;
  now: number;
  selectedUid: string | null;
  moving: { uid: string; x: number; z: number; valid: boolean } | null;
  kingdom?: KingdomType;
  onSelect: (uid: string | null) => void;
  onMoveTo: (x: number, z: number) => void;
  onCollect: (uid: string) => void;
}

/** Spinning gold coin above the mine: tap it to collect. */
const CollectCoin: React.FC<{ onCollect: () => void }> = ({ onCollect }) => {
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
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.15, 24]} />
        <meshStandardMaterial color="#ffd23a" metalness={0.8} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.95, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

const BuildingNode: React.FC<{
  b: PlacedBuilding; now: number; selected: boolean; ghost?: { x: number; z: number; valid: boolean };
  onSelect: (uid: string) => void; onCollect: (uid: string) => void;
}> = ({ b, now, selected, ghost, onSelect, onCollect }) => {
  const def = BUILDINGS[b.type];
  const [cx, , cz] = buildingCenter(ghost ? { ...b, x: ghost.x, z: ghost.z } : b);
  const upgrading = b.upgradingUntil > now;
  const cap = b.type === 'goldmine' ? mineCapacity(b.level) : 0;
  const showCollect = b.type === 'goldmine' && b.stored >= Math.min(10, cap * 0.05) && !ghost;

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
        <BuildingModel type={b.type} level={Math.max(1, b.level)} />
      </group>
      {upgrading && <Scaffolding size={def.size} />}

      {(selected || upgrading) && (
        <Html position={[0, def.size + 1.2, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="scene-label">
            {selected && <div className="scene-label-title">{def.name} <span>Nv.{b.level}</span></div>}
            {upgrading && <div className="scene-label-timer">🔨 {formatDuration(b.upgradingUntil - now)}</div>}
          </div>
        </Html>
      )}

      {showCollect && <CollectCoin onCollect={() => onCollect(b.uid)} />}
    </group>
  );
};

export const VillageScene: React.FC<VillageSceneProps> = ({
  village, wallsLevel, now, selectedUid, moving, kingdom = 'emerald', onSelect, onMoveTo, onCollect,
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
    <Canvas shadows camera={{ position: CAMERA_POSITION, fov: 38 }} className="village-canvas">
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
      <Walls level={wallsLevel} kingdom={kingdom} />

      {village.map(b => (
        <BuildingNode
          key={b.uid}
          b={b}
          now={now}
          selected={b.uid === selectedUid}
          ghost={moving?.uid === b.uid ? moving : undefined}
          onSelect={uid => { if (!moving) onSelect(uid); }}
          onCollect={onCollect}
        />
      ))}
    </Canvas>
  );
};
