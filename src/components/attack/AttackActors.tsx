import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import type { Group, Mesh, MeshBasicMaterial } from 'three';
import type { SimBuilding, SimEffect, SimProjectile, SimUnit } from '../../core/pvp/AttackSim';
import { UNIT_STATS } from '../../core/pvp/AttackSim';
import { BuildingModel } from '../village/BuildingModels';

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
      <cylinderGeometry args={[0.04, 0.04, 1.4, 6]} />
      <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Crimson battle pennant */}
    <mesh position={[0.3, 1.15, 0]} rotation={[0, 0, -0.05]} castShadow>
      <boxGeometry args={[0.6, 0.35, 0.02]} />
      <meshStandardMaterial color="#d63031" roughness={0.6} />
    </mesh>
    {/* Golden skull / enemy emblem */}
    <mesh position={[0.3, 1.15, 0.015]}>
      <circleGeometry args={[0.09, 8]} />
      <meshBasicMaterial color="#f1c40f" />
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

const UnitBody: React.FC<{ type: SimUnit['type']; color: string }> = ({ type, color }) => {
  switch (type) {
    case 'cavalry':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.3, 0.3, 0.7]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
          <mesh position={[0, 0.5, 0.35]} castShadow>
            <boxGeometry args={[0.18, 0.3, 0.2]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
          <mesh position={[0, 0.72, -0.05]} castShadow>
            <capsuleGeometry args={[0.12, 0.25, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'catapults':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.6, 0.25, 0.8]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
          <mesh position={[0, 0.55, -0.1]} rotation={[0.6, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.8]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0.32, 0.15, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'mages':
      return (
        <group position={[0, 0.9, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.22, 0.6, 8]} />
            <meshStandardMaterial color="#7b4dff" emissive="#4a2a9e" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color="#f1c27d" />
          </mesh>
          <mesh position={[0, -0.36, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    default: {
      const hat = type === 'archers' ? '#2f8f3a' : type === 'healers' ? '#ffffff' : '#b0b0b8';
      return (
        <group>
          <mesh position={[0, 0.38, 0]} castShadow>
            <capsuleGeometry args={[0.15, 0.3, 4, 8]} />
            <meshStandardMaterial color={type === 'healers' ? '#f5f5f5' : color} />
          </mesh>
          <mesh position={[0, 0.72, 0]} castShadow>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color="#f1c27d" />
          </mesh>
          <mesh position={[0, 0.82, 0]}>
            <coneGeometry args={[0.14, 0.18, 8]} />
            <meshStandardMaterial color={hat} />
          </mesh>
          {type === 'infantry' && (
            <mesh position={[0.2, 0.45, 0.12]} rotation={[0.8, 0, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.45]} />
              <meshStandardMaterial color="#dfe6ee" metalness={0.7} roughness={0.3} />
            </mesh>
          )}
          {type === 'healers' && (
            <mesh position={[0, 0.42, 0.16]}>
              <boxGeometry args={[0.16, 0.05, 0.02]} />
              <meshBasicMaterial color="#2ed573" />
            </mesh>
          )}
        </group>
      );
    }
  }
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
      // little walking bob
      body.current.position.y = UNIT_STATS[u.type].flying ? Math.sin(clock.elapsedTime * 3 + u.id) * 0.1 : Math.abs(Math.sin(clock.elapsedTime * 10 + u.id)) * 0.05;
    }
  });
  const scale = u.type === 'catapults' || u.type === 'cavalry' ? 1.5 : 1.4;
  return (
    <group ref={ref}>
      <group ref={body} scale={scale}>
        <UnitBody type={u.type} color={TEAM[u.side]} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.3, 0.42, 16]} />
        <meshBasicMaterial color={TEAM[u.side]} />
      </mesh>
      <HpBar y={UNIT_STATS[u.type].flying ? 2.2 : 1.6} width={0.7} get={() => u.hp / u.maxHp} color={u.side === 'attacker' ? '#4fc3ff' : '#ff6b6b'} />
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
  const ref = useRef<Mesh>(null);
  const style = PROJECTILE_STYLE[p.kind];
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const k = Math.min(1, p.t / p.duration);
    m.visible = p.t < p.duration;
    m.position.set(
      p.fromX + (p.toX - p.fromX) * k,
      p.fromY + (0.4 - p.fromY) * k + Math.sin(Math.PI * k) * style.arc,
      p.fromZ + (p.toZ - p.fromZ) * k,
    );
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[style.size, 8, 6]} />
      <meshStandardMaterial color={style.color} emissive={p.kind === 'magic' ? '#7a4dff' : '#000'} emissiveIntensity={0.8} />
    </mesh>
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
