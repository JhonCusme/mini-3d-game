import React, { useRef, useMemo, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import type { PlacedBuilding, TroopCounts, TroopId } from '../../core/GameState';
import { GameConfig } from '../../config/GameConfig';

interface VillageTroopsProps {
  village: PlacedBuilding[];
  garrison?: TroopCounts;
  troops?: TroopCounts;
  kingdom?: string;
}

const EMPTY_COUNTS: TroopCounts = {
  infantry: 0,
  archers: 0,
  cavalry: 0,
  mages: 0,
  catapults: 0,
  healers: 0,
};

// ---------------------------------------------------------------------------
// 3D Unit Mesh (Low-poly Clash style with animated appendages)
// ---------------------------------------------------------------------------

interface UnitMeshProps {
  type: TroopId;
  teamColor?: string;
  isPracticing?: boolean;
  practiceType?: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
  animOffset?: number;
}

const VillageUnitMesh: React.FC<UnitMeshProps> = ({
  type,
  teamColor = '#3a7bd5',
  isPracticing = false,
  practiceType = 'sword',
  animOffset = 0,
}) => {
  const armRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const weaponRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 4 + animOffset;

    if (isPracticing) {
      if (practiceType === 'sword' && armRef.current) {
        // Slashing sword drill
        const slash = Math.sin(t * 1.5);
        armRef.current.rotation.x = Math.max(-0.4, slash * 1.2);
        armRef.current.rotation.z = Math.sin(t * 1.5) * 0.3;
      } else if (practiceType === 'bow' && armRef.current) {
        // Pull string, aim, release drill
        const cycle = (t * 0.7) % (Math.PI * 2);
        const pull = Math.sin(cycle);
        armRef.current.rotation.x = -0.7 + pull * 0.3;
      } else if (practiceType === 'magic' && auraRef.current) {
        // Pulsing magical aura
        const pulse = 1 + Math.sin(t * 2) * 0.25;
        auraRef.current.scale.set(pulse, pulse, pulse);
        auraRef.current.rotation.y = t * 0.5;
      } else if (practiceType === 'heal' && auraRef.current) {
        const pulse = 1 + Math.cos(t * 1.8) * 0.2;
        auraRef.current.scale.set(pulse, pulse, pulse);
      }
    } else {
      // Idle head turning looking for intruders
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.5;
      }
    }
  });

  switch (type) {
    case 'cavalry':
      return (
        <group scale={0.85}>
          {/* Horse body */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.32, 0.32, 0.75]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
          </mesh>
          {/* Horse neck & head */}
          <mesh position={[0, 0.55, 0.38]} rotation={[-0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.18, 0.35, 0.22]} />
            <meshStandardMaterial color="#6e3e18" />
          </mesh>
          {/* Saddle */}
          <mesh position={[0, 0.52, -0.02]}>
            <boxGeometry args={[0.34, 0.05, 0.3]} />
            <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Rider */}
          <group position={[0, 0.75, -0.05]}>
            <mesh castShadow>
              <capsuleGeometry args={[0.12, 0.26, 4, 8]} />
              <meshStandardMaterial color={teamColor} />
            </mesh>
            <mesh position={[0, 0.26, 0]} castShadow>
              <sphereGeometry args={[0.1, 8, 6]} />
              <meshStandardMaterial color="#f1c27d" />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <coneGeometry args={[0.12, 0.16, 8]} />
              <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>
            {/* Lance / Spear */}
            <mesh position={[0.2, 0.2, 0.3]} rotation={[1.1, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.2]} />
              <meshStandardMaterial color="#dcdde1" metalness={0.8} />
            </mesh>
          </group>
        </group>
      );

    case 'catapults':
      return (
        <group scale={0.8}>
          {/* Wood chassis */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[0.65, 0.22, 0.85]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
          </mesh>
          {/* Wheels */}
          {[-0.35, 0.35].map((x, i) =>
            [-0.3, 0.3].map((z, j) => (
              <mesh key={`${i}-${j}`} position={[x, 0.18, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 0.08, 12]} />
                <meshStandardMaterial color="#4a2e16" />
              </mesh>
            ))
          )}
          {/* Throwing arm */}
          <group ref={armRef} position={[0, 0.3, -0.2]}>
            <mesh position={[0, 0.35, 0.2]} rotation={[0.5, 0, 0]} castShadow>
              <boxGeometry args={[0.08, 0.08, 0.85]} />
              <meshStandardMaterial color="#633917" />
            </mesh>
            {/* Rock cup */}
            <mesh position={[0, 0.65, -0.1]}>
              <cylinderGeometry args={[0.15, 0.08, 0.1, 8]} />
              <meshStandardMaterial color="#2f3542" />
            </mesh>
            <mesh position={[0, 0.72, -0.1]} castShadow>
              <dodecahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial color="#747d8c" roughness={0.9} />
            </mesh>
          </group>
        </group>
      );

    case 'mages':
      return (
        <group position={[0, 0.85, 0]} scale={0.9}>
          {/* Floating magic aura circle */}
          <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <ringGeometry args={[0.25, 0.45, 16]} />
            <meshBasicMaterial color="#a55eea" transparent opacity={0.6} />
          </mesh>
          {/* Robes */}
          <mesh castShadow>
            <coneGeometry args={[0.22, 0.65, 8]} />
            <meshStandardMaterial color="#574b90" emissive="#301b5e" emissiveIntensity={0.3} />
          </mesh>
          {/* Head & beard */}
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.13, 8, 6]} />
            <meshStandardMaterial color="#f1c27d" />
          </mesh>
          {/* Pointy wizard hat */}
          <mesh position={[0, 0.62, 0]}>
            <coneGeometry args={[0.18, 0.35, 8]} />
            <meshStandardMaterial color="#301b5e" />
          </mesh>
          {/* Glowing Orb / Staff */}
          <group position={[0.24, 0.2, 0.15]}>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8]} />
              <meshStandardMaterial color="#5a3d1c" />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.09, 12, 8]} />
              <meshStandardMaterial color="#00d2d3" emissive="#00d2d3" emissiveIntensity={0.9} />
            </mesh>
          </group>
        </group>
      );

    case 'healers':
      return (
        <group position={[0, 0.75, 0]} scale={0.88}>
          {/* Angelic floating aura */}
          <mesh ref={auraRef} position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.03, 8, 16]} />
            <meshBasicMaterial color="#ffd700" />
          </mesh>
          {/* White pristine robe */}
          <mesh castShadow>
            <coneGeometry args={[0.22, 0.65, 8]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.5} />
          </mesh>
          {/* Head */}
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color="#f5cd79" />
          </mesh>
          {/* Wings */}
          {[-1, 1].map((dir, i) => (
            <mesh key={i} position={[dir * 0.16, 0.25, -0.1]} rotation={[0, dir * 0.4, dir * 0.3]}>
              <boxGeometry args={[0.22, 0.35, 0.03]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
            </mesh>
          ))}
          {/* Emerald cross */}
          <mesh position={[0, 0.22, 0.16]}>
            <boxGeometry args={[0.12, 0.04, 0.02]} />
            <meshBasicMaterial color="#2ed573" />
          </mesh>
          <mesh position={[0, 0.22, 0.16]}>
            <boxGeometry args={[0.04, 0.12, 0.02]} />
            <meshBasicMaterial color="#2ed573" />
          </mesh>
        </group>
      );

    default: {
      // Infantry and Archers
      const isArcher = type === 'archers';
      const hatColor = isArcher ? '#2ed573' : '#747d8c';

      return (
        <group scale={0.85}>
          {/* Body */}
          <mesh position={[0, 0.36, 0]} castShadow>
            <capsuleGeometry args={[0.16, 0.32, 4, 8]} />
            <meshStandardMaterial color={teamColor} roughness={0.6} />
          </mesh>
          {/* Head */}
          <group ref={headRef} position={[0, 0.68, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.12, 8, 6]} />
              <meshStandardMaterial color="#f1c27d" />
            </mesh>
            {/* Helmet / Archer Hood */}
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.15, 0.18, 8]} />
              <meshStandardMaterial color={hatColor} metalness={isArcher ? 0.1 : 0.8} />
            </mesh>
          </group>

          {/* Weapon Arm */}
          <group ref={armRef} position={[0.22, 0.45, 0]}>
            {!isArcher ? (
              // Sword and Shield
              <group ref={weaponRef}>
                {/* Sword */}
                <mesh position={[0, 0, 0.2]} rotation={[0.8, 0, 0]}>
                  <boxGeometry args={[0.04, 0.04, 0.5]} />
                  <meshStandardMaterial color="#f1f2f6" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Crossguard */}
                <mesh position={[0, 0, 0.02]}>
                  <boxGeometry args={[0.12, 0.04, 0.04]} />
                  <meshStandardMaterial color="#ffd700" />
                </mesh>
              </group>
            ) : (
              // Wooden Recurve Bow
              <group ref={weaponRef}>
                <mesh position={[0, 0, 0.15]} rotation={[0, 0, 0.2]}>
                  <torusGeometry args={[0.22, 0.02, 6, 12, Math.PI]} />
                  <meshStandardMaterial color="#8b5a2b" />
                </mesh>
                <mesh position={[0, 0, 0.15]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.44]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            )}
          </group>

          {/* Shield for Infantry on other arm */}
          {!isArcher && (
            <mesh position={[-0.22, 0.4, 0.1]} rotation={[0, -0.4, 0]}>
              <boxGeometry args={[0.04, 0.35, 0.25]} />
              <meshStandardMaterial color="#2f3542" metalness={0.7} roughness={0.3} />
            </mesh>
          )}
        </group>
      );
    }
  }
};

// ---------------------------------------------------------------------------
// Patrolling Guard (Wandering around the Village)
// ---------------------------------------------------------------------------

interface PatrollingGuardProps {
  id: string;
  type: TroopId;
  initialX: number;
  initialZ: number;
  teamColor: string;
  onClick: (name: string, phrase: string) => void;
}

const GUARD_PHRASES: Record<TroopId, string[]> = {
  infantry: ['¡Aldea protegida!', '¡Por el honor del Reino!', '¡Murallas vigiladas!'],
  archers: ['¡Perímetro despejado!', '¡Flechas listas!', '¡Ningún invasor pasará!'],
  cavalry: ['¡Patrulla rápida!', '¡Todo en orden en el frente!', '¡A galope por la paz!'],
  mages: ['¡Los orbes no detectan peligro!', '¡Magia defensiva activa!', '¡Paz en las torres!'],
  catapults: ['¡Rocas de defensa cargadas!', '¡Calibración lista!', '¡Que intenten cruzar!'],
  healers: ['¡Bendiciones a la aldea!', '¡Tropas con salud plena!', '¡Luz en las murallas!'],
};

const PatrollingGuard: React.FC<PatrollingGuardProps> = ({
  type,
  initialX,
  initialZ,
  teamColor,
  onClick,
}) => {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);

  // Patrol state stored in ref for 60fps performance without React re-renders
  const patrolState = useRef({
    x: initialX,
    z: initialZ,
    targetX: initialX,
    targetZ: initialZ,
    isIdle: true,
    idleTimer: 2.0 + Math.random() * 2,
    heading: Math.random() * Math.PI * 2,
    speed: 0.9 + Math.random() * 0.4,
    jumpTimer: 0,
  });

  const pickNewTarget = () => {
    // Keep patrol inside the main secure village perimeter (-8.5 to 8.5)
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 5;
    const nx = Math.max(-8.5, Math.min(8.5, patrolState.current.x + Math.cos(angle) * dist));
    const nz = Math.max(-8.5, Math.min(8.5, patrolState.current.z + Math.sin(angle) * dist));
    patrolState.current.targetX = nx;
    patrolState.current.targetZ = nz;
    patrolState.current.isIdle = false;

    // Calculate heading toward target
    const dx = nx - patrolState.current.x;
    const dz = nz - patrolState.current.z;
    patrolState.current.heading = Math.atan2(dx, dz);
  };

  useFrame(({ clock }, dt) => {
    const s = patrolState.current;
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    if (s.jumpTimer > 0) {
      s.jumpTimer -= dt;
      root.position.y = Math.sin(s.jumpTimer * Math.PI * 4) * 0.4;
    } else {
      root.position.y = 0;
    }

    if (s.isIdle) {
      s.idleTimer -= dt;
      // Gentle idle breathing
      body.position.y = Math.sin(clock.elapsedTime * 2 + initialX) * 0.03;
      if (s.idleTimer <= 0) {
        pickNewTarget();
      }
    } else {
      // Move towards target
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        // Reached destination, pause for a guard watch
        s.isIdle = true;
        s.idleTimer = 3.0 + Math.random() * 3.5;
        body.position.y = 0;
      } else {
        // Move step
        const step = Math.min(dist, s.speed * dt);
        s.x += (dx / dist) * step;
        s.z += (dz / dist) * step;

        // Walking bob
        const isFlying = type === 'mages' || type === 'healers';
        body.position.y = isFlying
          ? Math.sin(clock.elapsedTime * 3) * 0.08
          : Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.07;

        // Smooth rotation to heading
        const targetRot = Math.atan2(dx, dz);
        body.rotation.y = targetRot;
      }
    }

    root.position.x = s.x;
    root.position.z = s.z;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    patrolState.current.jumpTimer = 0.5;
    const phrases = GUARD_PHRASES[type] || ['¡En guardia!'];
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    onClick(GameConfig.troops[type]?.name || 'Guardián', p);
  };

  return (
    <group ref={rootRef} position={[initialX, 0, initialZ]} onPointerDown={handlePointerDown}>
      <group ref={bodyRef}>
        <VillageUnitMesh type={type} teamColor={teamColor} isPracticing={false} />
      </group>

      {/* Subtle glowing guard base aura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Training Grounds Scenery (Target Dummies, Archery Targets, Campfire)
// ---------------------------------------------------------------------------

const TrainingCampScenery: React.FC<{ x: number; z: number }> = ({ x, z }) => {
  const fireRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (fireRef.current) {
      const f = 1 + Math.sin(clock.elapsedTime * 12) * 0.15;
      fireRef.current.scale.set(f, f * 1.1, f);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Sandy training ground floor pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[3.2, 24]} />
        <meshStandardMaterial color="#c29b68" roughness={0.9} />
      </mesh>

      {/* Decorative training ring border stakes */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const px = Math.cos(angle) * 3.0;
        const pz = Math.sin(angle) * 3.0;
        return (
          <mesh key={i} position={[px, 0.25, pz]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
            <meshStandardMaterial color="#593b22" />
          </mesh>
        );
      })}

      {/* Campfire in the center */}
      <group position={[0, 0, 0]}>
        {/* Stone ring */}
        {Array.from({ length: 7 }).map((_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.45, 0.08, Math.sin(a) * 0.45]}>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color="#57606f" />
            </mesh>
          );
        })}
        {/* Burning wood logs */}
        <mesh position={[0, 0.12, 0]} rotation={[0.4, 0.8, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5]} />
          <meshStandardMaterial color="#2f1a08" />
        </mesh>
        <mesh position={[0, 0.12, 0]} rotation={[-0.4, -0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5]} />
          <meshStandardMaterial color="#2f1a08" />
        </mesh>
        {/* Animated campfire flame */}
        <group ref={fireRef} position={[0, 0.28, 0]}>
          <mesh>
            <coneGeometry args={[0.22, 0.45, 6]} />
            <meshBasicMaterial color="#ff4757" />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <coneGeometry args={[0.15, 0.35, 6]} />
            <meshBasicMaterial color="#ffa502" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.08, 0.22, 6]} />
            <meshBasicMaterial color="#ffeaa7" />
          </mesh>
        </group>
      </group>

      {/* Target Dummy 1 (Wooden sparring doll) */}
      <group position={[-1.6, 0, 1.2]} rotation={[0, 0.8, 0]}>
        {/* Stand post */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Cross arms */}
        <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Straw body bag */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.25, 4, 8]} />
          <meshStandardMaterial color="#d4a373" roughness={1} />
        </mesh>
        {/* Old battle helmet on top */}
        <mesh position={[0, 0.95, 0]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.14, 0.16, 6]} />
          <meshStandardMaterial color="#747d8c" metalness={0.7} />
        </mesh>
      </group>

      {/* Archery Target Board */}
      <group position={[1.8, 0, -1.2]} rotation={[0, -2.2, 0]}>
        {/* Wooden legs */}
        <mesh position={[-0.2, 0.5, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        <mesh position={[0.2, 0.5, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        {/* Target face */}
        <mesh position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.08, 18]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        {/* Target rings */}
        <mesh position={[0, 0.8, 0.045]}>
          <circleGeometry args={[0.26, 16]} />
          <meshBasicMaterial color="#ff4757" />
        </mesh>
        <mesh position={[0, 0.8, 0.046]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
        {/* Arrows stuck into the bullseye */}
        <mesh position={[0.04, 0.82, 0.22]} rotation={[1.5, 0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4]} />
          <meshStandardMaterial color="#dfe4ea" />
        </mesh>
        <mesh position={[-0.06, 0.76, 0.24]} rotation={[1.6, -0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.45]} />
          <meshStandardMaterial color="#dfe4ea" />
        </mesh>
      </group>

      {/* Weapon Rack */}
      <group position={[-1.7, 0, -1.1]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.1]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        <mesh position={[-0.35, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        <mesh position={[0.35, 0.2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        {/* Racked swords */}
        {[-0.2, 0, 0.2].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 0.4, 0.08]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.55]} />
            <meshStandardMaterial color="#a4b0be" metalness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Practicing Troop in Training Grounds
// ---------------------------------------------------------------------------

interface PracticingTroopProps {
  type: TroopId;
  x: number;
  z: number;
  rotationY: number;
  practiceType: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
  animOffset: number;
  onClick: (name: string, phrase: string) => void;
}

const PRACTICE_PHRASES: Record<TroopId, string[]> = {
  infantry: ['¡Entrenando para el ataque!', '¡Golpe 1, 2, estocada!', '¡Espadas afiladas y listas!'],
  archers: ['¡Afinando la puntería!', '¡Diana perfecta!', '¡Diez flechas seguidas al centro!'],
  cavalry: ['¡Calentando para la carga!', '¡Jinetes listos para el asalto!', '¡Fuerza y velocidad!'],
  mages: ['¡Concentrando energía arcana!', '¡Conjuros de batalla al 100%!', '¡Poder elemental cargado!'],
  catapults: ['¡Ajustando la catapulta!', '¡Tensión de cuerda máxima!', '¡Listas para destruir murallas!'],
  healers: ['¡Canalizando auras de curación!', '¡El ejército no caerá!', '¡Bendición de combate lista!'],
};

const PracticingTroop: React.FC<PracticingTroopProps> = ({
  type,
  x,
  z,
  rotationY,
  practiceType,
  animOffset,
  onClick,
}) => {
  const rootRef = useRef<Group>(null);
  const [jump, setJump] = useState(0);

  useFrame((_, dt) => {
    if (jump > 0) {
      setJump((j) => Math.max(0, j - dt * 2.5));
      if (rootRef.current) {
        rootRef.current.position.y = Math.sin(jump * Math.PI) * 0.4;
      }
    } else if (rootRef.current) {
      rootRef.current.position.y = 0;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setJump(1);
    const phrases = PRACTICE_PHRASES[type] || ['¡Entrenando!'];
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    onClick(GameConfig.troops[type]?.name || 'Tropa de Asalto', p);
  };

  return (
    <group ref={rootRef} position={[x, 0, z]} rotation={[0, rotationY, 0]} onPointerDown={handlePointerDown}>
      <VillageUnitMesh
        type={type}
        teamColor="#ff4757"
        isPracticing={true}
        practiceType={practiceType}
        animOffset={animOffset}
      />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Main VillageTroops Container
// ---------------------------------------------------------------------------

export const VillageTroops: React.FC<VillageTroopsProps> = ({
  village,
  garrison = EMPTY_COUNTS,
  troops = EMPTY_COUNTS,
  kingdom = 'emerald',
}) => {
  const [balloon, setBalloon] = useState<{ name: string; phrase: string } | null>(null);

  // Position training grounds near the barracks or fallback location
  const barracks = village.find((b) => b.type === 'barracks');
  const campPos = useMemo<[number, number]>(() => {
    if (barracks) {
      // Offset camp adjacent to barracks
      const cx = barracks.x + 3.8;
      const cz = barracks.z + 1.2;
      // Clamp inside village bounds
      return [Math.max(-8, Math.min(8, cx)), Math.max(-8, Math.min(8, cz))];
    }
    return [6.5, -0.5];
  }, [barracks?.x, barracks?.z]);

  const teamColor = useMemo(() => {
    switch (kingdom) {
      case 'frost':
        return '#38ada9';
      case 'fire':
        return '#e55039';
      case 'golden':
        return '#f6b93b';
      case 'shadow':
        return '#6a0dad';
      default:
        return '#2ed573';
    }
  }, [kingdom]);

  // Generate patrolling guards from garrison
  const patrollingGuards = useMemo(() => {
    const list: { id: string; type: TroopId; x: number; z: number }[] = [];
    const types = Object.keys(GameConfig.troops) as TroopId[];

    types.forEach((type) => {
      const count = garrison[type] || 0;
      if (count > 0) {
        // Spawn 1 to 2 representative patrol actors per troop type in garrison
        const numActors = Math.min(2, Math.max(1, Math.ceil(count / 8)));
        for (let i = 0; i < numActors; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = 2 + Math.random() * 5.5;
          list.push({
            id: `patrol_${type}_${i}`,
            type,
            x: Math.cos(angle) * r,
            z: Math.sin(angle) * r,
          });
        }
      }
    });

    return list.slice(0, 10); // Performance cap
  }, [garrison]);

  // Generate practicing troops positioned around the training grounds
  const practicingTroops = useMemo(() => {
    const list: {
      id: string;
      type: TroopId;
      x: number;
      z: number;
      rot: number;
      practiceType: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
    }[] = [];

    const [cx, cz] = campPos;

    // Fixed sparring slots in the training circle
    if ((troops.infantry || 0) > 0) {
      list.push({
        id: 'train_infantry_1',
        type: 'infantry',
        x: cx - 1.0,
        z: cz + 0.9,
        rot: 2.2, // Facing the dummy
        practiceType: 'sword',
      });
      if (troops.infantry > 8) {
        list.push({
          id: 'train_infantry_2',
          type: 'infantry',
          x: cx - 1.2,
          z: cz + 0.3,
          rot: 1.8,
          practiceType: 'sword',
        });
      }
    }

    if ((troops.archers || 0) > 0) {
      list.push({
        id: 'train_archers_1',
        type: 'archers',
        x: cx + 0.8,
        z: cz - 0.7,
        rot: 0.9, // Aiming at target board
        practiceType: 'bow',
      });
      if (troops.archers > 8) {
        list.push({
          id: 'train_archers_2',
          type: 'archers',
          x: cx + 1.2,
          z: cz - 0.3,
          rot: 0.9,
          practiceType: 'bow',
        });
      }
    }

    if ((troops.cavalry || 0) > 0) {
      list.push({
        id: 'train_cavalry',
        type: 'cavalry',
        x: cx - 0.2,
        z: cz - 1.6,
        rot: Math.PI / 2,
        practiceType: 'horse',
      });
    }

    if ((troops.mages || 0) > 0) {
      list.push({
        id: 'train_mages',
        type: 'mages',
        x: cx - 1.5,
        z: cz - 0.2,
        rot: -0.4,
        practiceType: 'magic',
      });
    }

    if ((troops.healers || 0) > 0) {
      list.push({
        id: 'train_healers',
        type: 'healers',
        x: cx + 0.3,
        z: cz + 1.6,
        rot: -2.0,
        practiceType: 'heal',
      });
    }

    if ((troops.catapults || 0) > 0) {
      list.push({
        id: 'train_catapult',
        type: 'catapults',
        x: cx + 1.8,
        z: cz + 1.4,
        rot: -1.2,
        practiceType: 'siege',
      });
    }

    return list;
  }, [troops, campPos]);

  const handleTroopClick = (name: string, phrase: string) => {
    setBalloon({ name, phrase });
    setTimeout(() => {
      setBalloon(null);
    }, 2400);
  };

  const totalAttackTroops = Object.values(troops || {}).reduce((a, b) => a + (b || 0), 0);

  return (
    <group>
      {/* 1. Training Grounds Scenery (always visible if player has attack troops or barracks) */}
      {(totalAttackTroops > 0 || barracks) && (
        <TrainingCampScenery x={campPos[0]} z={campPos[1]} />
      )}

      {/* 2. Practicing Attack Troops */}
      {practicingTroops.map((t, idx) => (
        <PracticingTroop
          key={t.id}
          type={t.type}
          x={t.x}
          z={t.z}
          rotationY={t.rot}
          practiceType={t.practiceType}
          animOffset={idx * 1.5}
          onClick={handleTroopClick}
        />
      ))}

      {/* 3. Patrolling Village Garrison Troops */}
      {patrollingGuards.map((g) => (
        <PatrollingGuard
          key={g.id}
          id={g.id}
          type={g.type}
          initialX={g.x}
          initialZ={g.z}
          teamColor={teamColor}
          onClick={handleTroopClick}
        />
      ))}

      {/* Speech Balloon on click */}
      {balloon && (
        <Html position={[0, 4.5, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'rgba(20, 20, 30, 0.92)',
              border: '2px solid var(--accent-gold)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              animation: 'popIn 0.25s ease-out',
              whiteSpace: 'nowrap',
            }}
          >
            <b style={{ fontSize: '11px', color: 'var(--accent-gold)' }}>{balloon.name}</b>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{balloon.phrase}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
