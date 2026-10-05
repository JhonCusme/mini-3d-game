import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { SimBuilding, SimEffect, SimProjectile, SimUnit, SimWall } from '../../core/pvp/AttackSim';
import { UNIT_STATS } from '../../core/pvp/AttackSim';
import { BuildingModel, WallModel } from '../village/BuildingModels';
import { HeroKingModel, StylizedTroop } from '../common/StylizedCharacters';
import { ProceduralTextures } from '../../core/textures/ProceduralTextures';

const TEAM = { attacker: '#3a7bd5', defender: '#d63a3a' };

/** Health bar that always faces the camera. `get` returns 0..1. */
const HpBar: React.FC<{ y: number; width: number; get: () => number; color?: string }> = ({ y, width, get, color = '#2ed573' }) => {
  const group = useRef<Group>(null);
  const fill = useRef<Mesh>(null);
  useFrame(() => {
    const v = get();
    if (group.current) group.current.visible = v > 0 && v < 0.999;
    if (fill.current) {
      fill.current.scale.x = Math.max(0.001, v);
      fill.current.position.x = -(width * (1 - v)) / 2;
    }
  });
  return (
    <Billboard ref={group} position={[0, y, 0]}>
      <mesh>
        <planeGeometry args={[width + 0.08, 0.16]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh ref={fill} position={[0, 0, 0.01]}>
        <planeGeometry args={[width, 0.1]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </Billboard>
  );
};

/** Enemy battle pennant flying over hostile headquarters. */
const EnemyFlag: React.FC<{ y: number }> = ({ y }) => (
  <group position={[0, y, 0]}>
    {/* Flag pole */}
    <mesh position={[0, 0.7, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />
      <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Crimson battle pennant */}
    <mesh position={[0.3, 1.15, 0]} rotation={[0, 0, -0.05]} castShadow>
      <boxGeometry args={[0.6, 0.35, 0.02]} />
      <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d63031')} roughness={0.6} />
    </mesh>
    {/* Golden skull / enemy emblem */}
    <mesh position={[0.3, 1.15, 0.015]}>
      <circleGeometry args={[0.09, 12]} />
      <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} />
    </mesh>
  </group>
);

export const BuildingActor: React.FC<{ b: SimBuilding }> = ({ b }) => {
  const alive = useRef<Group>(null);
  const rubble = useRef<Group>(null);
  const turret = useRef<Group>(null);
  useFrame(() => {
    if (alive.current) alive.current.visible = !b.destroyed;
    if (rubble.current) rubble.current.visible = b.destroyed;
    if (turret.current) turret.current.rotation.y = b.aim;
  });
  return (
    <group position={[b.x, 0, b.z]}>
      <group ref={alive}>
        {b.type === 'cannon' || b.type === 'archertower'
          ? <group ref={turret}><BuildingModel type={b.type} level={b.level} aimAngle={0} /></group>
          : <BuildingModel type={b.type} level={b.level} />}
        {b.type === 'townhall' && <EnemyFlag y={b.size * 0.85} />}
        <HpBar y={b.size + 1} width={b.size * 0.7} get={() => b.hp / b.maxHp} />
      </group>
      <group ref={rubble} visible={false}>
        {[[-0.3, -0.2], [0.35, 0.1], [0, 0.35], [-0.2, 0.3]].map(([x, z], i) => (
          <mesh key={i} position={[x * b.size * 0.6, 0.15, z * b.size * 0.6]} rotation={[i, i * 2, 0]} castShadow>
            <dodecahedronGeometry args={[0.25 + (i % 2) * 0.15, 0]} />
            <meshStandardMaterial color="#5a5550" flatShading />
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[b.size * 0.5, 12]} />
          <meshStandardMaterial color="#2d2a26" />
        </mesh>
      </group>
    </group>
  );
};

export const WallActor: React.FC<{ w: SimWall }> = ({ w }) => {
  const alive = useRef<Group>(null);
  const rubble = useRef<Group>(null);
  useFrame(() => {
    if (alive.current) alive.current.visible = !w.destroyed;
    if (rubble.current) rubble.current.visible = w.destroyed;
  });
  return (
    <group position={[w.x, 0, w.z]}>
      <group ref={alive}>
        <WallModel level={w.level || 1} />
        {w.hp < w.maxHp && (
          <HpBar y={1.2} width={0.8} get={() => w.hp / w.maxHp} />
        )}
      </group>
      <group ref={rubble} visible={false}>
        {[[-0.15, -0.1], [0.18, 0.05], [0, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.1, z]} rotation={[i, i * 2, 0]} castShadow>
            <dodecahedronGeometry args={[0.16 + (i % 2) * 0.08, 0]} />
            <meshStandardMaterial color="#4a4b4d" flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const UnitActor: React.FC<{ u: SimUnit }> = ({ u }) => {
  const ref = useRef<Group>(null);
  const body = useRef<Group>(null);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    g.visible = !u.dead;
    g.position.set(u.x, 0, u.z);
    if (body.current) {
      body.current.rotation.y = u.heading;
      // Flying units (healers) hover above ground smoothly
      if (UNIT_STATS[u.type].flying) {
        body.current.position.y = 0.2 + Math.sin(clock.elapsedTime * 3 + u.id) * 0.12;
      } else {
        body.current.position.y = 0;
      }
    }
  });

  const isAttacking = u.targetKind !== null && u.cooldown > 0;
  const isMoving = !u.dead && !isAttacking;
  const scale = u.type === 'catapults' || u.type === 'cavalry' ? 1.35 : 1.25;

  return (
    <group ref={ref}>
      <group ref={body}>
        {u.isHero ? (
          <group position={[0, 0, 0]}>
            <HeroKingModel level={u.heroLevel || 1} scale={1.35} />
          </group>
        ) : (
          <StylizedTroop
            type={u.type}
            teamColor={TEAM[u.side]}
            isMoving={isMoving}
            isAttacking={isAttacking}
            animOffset={u.id}
            scale={scale}
          />
        )}
      </group>
      {/* Selection / placement team ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={u.isHero ? [0.45, 0.65, 24] : [0.3, 0.44, 16]} />
        <meshBasicMaterial color={u.isHero ? '#ffd700' : TEAM[u.side]} transparent opacity={u.isHero ? 0.85 : 0.7} />
      </mesh>
      <HpBar
        y={u.isHero ? 2.3 : UNIT_STATS[u.type].flying ? 2.2 : 1.65}
        width={u.isHero ? 1.2 : 0.75}
        get={() => u.hp / u.maxHp}
        color={u.isHero ? '#ffd700' : u.side === 'attacker' ? '#4fc3ff' : '#ff6b6b'}
      />
    </group>
  );
};

const PROJECTILE_STYLE: Record<SimProjectile['kind'], { color: string; size: number; arc: number }> = {
  cannonball: { color: '#222', size: 0.16, arc: 0.6 },
  arrow: { color: '#c8a06e', size: 0.07, arc: 0.8 },
  magic: { color: '#b48cff', size: 0.14, arc: 0.2 },
  boulder: { color: '#6b6b6b', size: 0.22, arc: 3 },
  lightning: { color: '#4fc3ff', size: 0.2, arc: 0 },
};

export const ProjectileActor: React.FC<{ p: SimProjectile }> = ({ p }) => {
  const group = useRef<Group>(null);
  const style = PROJECTILE_STYLE[p.kind];

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const k = Math.min(1, p.t / p.duration);
    g.visible = p.t < p.duration;

    const curX = p.fromX + (p.toX - p.fromX) * k;
    const curY = p.fromY + (0.4 - p.fromY) * k + Math.sin(Math.PI * k) * style.arc;
    const curZ = p.fromZ + (p.toZ - p.fromZ) * k;
    g.position.set(curX, curY, curZ);

    // Tangent flight orientation
    const nextK = Math.min(1, k + 0.04);
    const nX = p.fromX + (p.toX - p.fromX) * nextK;
    const nY = p.fromY + (0.4 - p.fromY) * nextK + Math.sin(Math.PI * nextK) * style.arc;
    const nZ = p.fromZ + (p.toZ - p.fromZ) * nextK;
    if (Math.abs(nX - curX) > 0.001 || Math.abs(nZ - curZ) > 0.001 || Math.abs(nY - curY) > 0.001) {
      g.lookAt(nX, nY, nZ);
    }
  });

  if (p.kind === 'arrow') {
    return (
      <group ref={group}>
        {/* Real 3D Arrow: Shaft, steel tip & feathers */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.45, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
        </mesh>
        <mesh position={[0, 0, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <coneGeometry args={[0.045, 0.1, 5]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.01]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#e84393')} />
        </mesh>
      </group>
    );
  }

  if (p.kind === 'cannonball') {
    return (
      <group ref={group}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (p.kind === 'boulder') {
    return (
      <group ref={group}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.26, 1]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[style.size, 10, 8]} />
        <meshStandardMaterial color={style.color} emissive={style.color} emissiveIntensity={1.2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[style.size * 1.1, style.size * 1.5, 12]} />
        <meshBasicMaterial color={style.color} transparent opacity={0.65} side={2} />
      </mesh>
    </group>
  );
};

const EFFECT_COLORS: Record<SimEffect['kind'], string> = {
  lightning: '#9fe3ff', heal: '#7bed9f', quake: '#b0895a', shadow: '#7b4dff', explosion: '#ff9f43',
};

export const EffectActor: React.FC<{ e: SimEffect }> = ({ e }) => {
  const ring = useRef<Mesh>(null);
  const bolt = useRef<Mesh>(null);
  useFrame(() => {
    const k = Math.min(1, e.t / 1.2);
    if (ring.current) {
      ring.current.scale.setScalar(0.2 + k);
      (ring.current.material as MeshBasicMaterial).opacity = 0.8 * (1 - k);
    }
    if (bolt.current) {
      bolt.current.visible = k < 0.35;
    }
  });
  return (
    <group position={[e.x, 0, e.z]}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[e.radius * 0.6, e.radius, 32]} />
        <meshBasicMaterial color={EFFECT_COLORS[e.kind]} transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {e.kind === 'lightning' && (
        <mesh ref={bolt} position={[0, 6, 0]}>
          <cylinderGeometry args={[0.08, 0.25, 12, 6]} />
          <meshBasicMaterial color="#e8f7ff" />
        </mesh>
      )}
      {e.kind === 'explosion' && (
        <mesh ref={bolt} position={[0, 0.6, 0]}>
          <sphereGeometry args={[e.radius * 0.7, 10, 8]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};
