import React, { useRef, useMemo, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { PlacedBuilding, TroopCounts, TroopId } from '../../core/GameState';
import { GameConfig } from '../../config/GameConfig';
import { BUILDINGS } from '../../config/BuildingsConfig';
import { StylizedTroop, HeroKingModel } from '../common/StylizedCharacters';
import { AudioManager } from '../../core/AudioManager';

interface VillageTroopsProps {
  village: PlacedBuilding[];
  garrison?: TroopCounts;
  troops?: TroopCounts;
  kingdom?: string;
  heroLevel?: number;
  heroRecoveringUntil?: number;
  now?: number;
}

const EMPTY_COUNTS: TroopCounts = {
  infantry: 0,
  archers: 0,
  cavalry: 0,
  mages: 0,
  catapults: 0,
  healers: 0,
  skeletons: 0,
};

// ---------------------------------------------------------------------------
// Spatial Collision Detection & Pathfinding Helpers
// ---------------------------------------------------------------------------

export function isPositionBlocked(x: number, z: number, village: PlacedBuilding[], margin = 0.38): boolean {
  // Village outer boundary bounds
  if (x < -8.7 || x > 8.7 || z < -8.7 || z > 8.7) return true;

  for (const b of village) {
    const size = BUILDINGS[b.type]?.size ?? 2;
    const minX = b.x - margin;
    const maxX = b.x + size + margin;
    const minZ = b.z - margin;
    const maxZ = b.z + size + margin;

    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
      return true;
    }
  }
  return false;
}

export function getNearestClearPoint(x: number, z: number, village: PlacedBuilding[]): { x: number; z: number } {
  if (!isPositionBlocked(x, z, village, 0.35)) return { x, z };
  for (let r = 0.5; r <= 4.0; r += 0.5) {
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const testX = Math.max(-8.5, Math.min(8.5, x + Math.cos(angle) * r));
      const testZ = Math.max(-8.5, Math.min(8.5, z + Math.sin(angle) * r));
      if (!isPositionBlocked(testX, testZ, village, 0.35)) {
        return { x: testX, z: testZ };
      }
    }
  }
  return { x, z };
}

export function findClearPatrolPoint(
  startX: number,
  startZ: number,
  village: PlacedBuilding[],
  minDist = 2.0,
  maxDist = 5.5,
  maxAttempts = 16
): { x: number; z: number } {
  for (let i = 0; i < maxAttempts; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const candX = Math.max(-8.5, Math.min(8.5, startX + Math.cos(angle) * dist));
    const candZ = Math.max(-8.5, Math.min(8.5, startZ + Math.sin(angle) * dist));

    if (!isPositionBlocked(candX, candZ, village, 0.45)) {
      return { x: candX, z: candZ };
    }
  }
  return { x: startX, z: startZ };
}

// ---------------------------------------------------------------------------
// 3D Unit Mesh (Stylized Characters with training/marching animations)
// ---------------------------------------------------------------------------

interface UnitMeshProps {
  type: TroopId;
  teamColor?: string;
  isPracticing?: boolean;
  isMoving?: boolean;
  practiceType?: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
  animOffset?: number;
}

const VillageUnitMesh: React.FC<UnitMeshProps> = ({
  type,
  teamColor = '#3a7bd5',
  isPracticing = false,
  isMoving = false,
  practiceType = 'sword',
  animOffset = 0,
}) => {
  return (
    <StylizedTroop
      type={type}
      teamColor={teamColor}
      isMoving={isPracticing ? false : isMoving}
      isPracticing={isPracticing}
      practiceType={practiceType}
      animOffset={animOffset}
      scale={type === 'catapults' || type === 'cavalry' ? 0.95 : 0.9}
    />
  );
};

// ---------------------------------------------------------------------------
// Patrolling Guard (Wandering around the Village pathways & defenses)
// ---------------------------------------------------------------------------

interface PatrollingGuardProps {
  id: string;
  type: TroopId;
  initialX: number;
  initialZ: number;
  teamColor: string;
  village: PlacedBuilding[];
  onClick: (name: string, phrase: string, pos: [number, number, number]) => void;
}

const GUARD_PHRASES: Record<TroopId, string[]> = {
  infantry: [
    '¡Aldea protegida mi señor!',
    '¡Por el honor del Reino!',
    '¡Murallas vigiladas y en guardia!',
    '¡Mi espada está a vuestro servicio!'
  ],
  archers: [
    '¡Perímetro despejado desde la distancia!',
    '¡Flechas en el carcaj listas!',
    '¡Ningún invasor pasará este muro!',
    '¡Vista de lince en las almenas!'
  ],
  cavalry: [
    '¡Patrulla rápida por los caminos!',
    '¡Todo en orden en el frente!',
    '¡A galope por la paz del reino!',
    '¡La caballería está lista para la carga!'
  ],
  mages: [
    '¡Los orbes no detectan peligro!',
    '¡Barrera arcana en torno a la aldea!',
    '¡La energía mágica fluye en calma!',
    '¡Hechizos listos para el asedio!'
  ],
  catapults: [
    '¡Rocas de defensa cargadas!',
    '¡Mecanismos engrasados y listos!',
    '¡Que intenten cruzar el foso!',
    '¡Potencia máxima de disparo!'
  ],
  healers: [
    '¡Bendiciones a toda la aldea!',
    '¡Tropas con salud y ánimo pleno!',
    '¡Luz sagrada sobre el reino!',
    '¡La salud de los soldados está asegurada!'
  ],
  skeletons: [
    '¡Huesos listos para el combate!',
    '¡Vigilando desde las sombras!',
    '¡Los no-muertos no duermen!',
    '¡Ningún enemigo escapará a nuestro enjambre!'
  ],
};

const PatrollingGuard: React.FC<PatrollingGuardProps> = ({
  type,
  initialX,
  initialZ,
  teamColor,
  village,
  onClick,
}) => {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const [isMoving, setIsMoving] = useState(false);

  const patrolState = useRef({
    x: initialX,
    z: initialZ,
    targetX: initialX,
    targetZ: initialZ,
    isIdle: true,
    idleTimer: 1.5 + Math.random() * 2.5,
    heading: Math.random() * Math.PI * 2,
    speed: 0.85 + Math.random() * 0.35,
    jumpTimer: 0,
  });

  const pickNewTarget = () => {
    // Pick an unobstructed waypoint within village pathways
    const pt = findClearPatrolPoint(patrolState.current.x, patrolState.current.z, village, 2.5, 6.0);
    patrolState.current.targetX = pt.x;
    patrolState.current.targetZ = pt.z;
    patrolState.current.isIdle = false;

    const dx = pt.x - patrolState.current.x;
    const dz = pt.z - patrolState.current.z;
    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      patrolState.current.heading = Math.atan2(dx, dz);
    }
  };

  useFrame(({ clock }, dt) => {
    const s = patrolState.current;
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    if (s.jumpTimer > 0) {
      s.jumpTimer -= dt;
      root.position.y = Math.sin(s.jumpTimer * Math.PI * 4) * 0.45;
    } else {
      root.position.y = 0;
    }

    if (s.isIdle) {
      s.idleTimer -= dt;
      body.position.y = Math.sin(clock.elapsedTime * 2 + initialX) * 0.03;
      if (isMoving) setIsMoving(false);
      if (s.idleTimer <= 0) {
        pickNewTarget();
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        s.isIdle = true;
        s.idleTimer = 3.0 + Math.random() * 3.5;
        body.position.y = 0;
        if (isMoving) setIsMoving(false);
      } else {
        const step = Math.min(dist, s.speed * dt);
        const moveX = (dx / dist) * step;
        const moveZ = (dz / dist) * step;

        let moved = false;
        // 1. Try moving directly towards target
        if (!isPositionBlocked(s.x + moveX, s.z + moveZ, village, 0.35)) {
          s.x += moveX;
          s.z += moveZ;
          moved = true;
        } else if (!isPositionBlocked(s.x + moveX, s.z, village, 0.35)) {
          // 2. Wall slide along X
          s.x += moveX;
          moved = true;
        } else if (!isPositionBlocked(s.x, s.z + moveZ, village, 0.35)) {
          // 3. Wall slide along Z
          s.z += moveZ;
          moved = true;
        }

        if (moved) {
          if (!isMoving) setIsMoving(true);
          const isFlying = type === 'mages' || type === 'healers';
          body.position.y = isFlying
            ? Math.sin(clock.elapsedTime * 3) * 0.08
            : Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.07;
          body.rotation.y = Math.atan2(dx, dz);
        } else {
          // Path obstructed completely by walls/structures, stop walking
          s.isIdle = true;
          s.idleTimer = 1.0 + Math.random() * 2.0;
          body.position.y = 0;
          if (isMoving) setIsMoving(false);
        }
      }
    }

    root.position.x = s.x;
    root.position.z = s.z;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    patrolState.current.jumpTimer = 0.55;
    AudioManager.playClick();
    const phrases = GUARD_PHRASES[type] || ['¡En guardia!'];
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    onClick(GameConfig.troops[type]?.name || 'Guardián', p, [patrolState.current.x, 0, patrolState.current.z]);
  };

  return (
    <group ref={rootRef} position={[initialX, 0, initialZ]} onPointerDown={handlePointerDown}>
      <group ref={bodyRef}>
        <VillageUnitMesh type={type} teamColor={teamColor} isPracticing={false} isMoving={isMoving} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Hero King Patrol (Walking across the Village with Crown & Cape)
// ---------------------------------------------------------------------------

interface HeroKingPatrolProps {
  heroLevel: number;
  isRecovering: boolean;
  village: PlacedBuilding[];
  onClick: (name: string, phrase: string, pos: [number, number, number]) => void;
}

const HERO_PHRASES = [
  '¡Por el honor y la gloria del Reino!',
  '¡Nuestras murallas son invencibles!',
  '¡Mis tropas están listas para conquistar cualquier aldea enemiga!',
  '¡Vigilad los límites! Mi espada defenderá a nuestro pueblo.',
  '¡Adelante valientes guerreros! La victoria es nuestra.'
];

const HeroKingPatrol: React.FC<HeroKingPatrolProps> = ({
  heroLevel,
  isRecovering,
  onClick,
  village,
}) => {
  const rootRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const [isMoving, setIsMoving] = useState(false);

  const th = village.find((b) => b.type === 'townhall') || { x: 0, z: 0 };
  const altar = village.find((b) => b.type === 'altar');

  const rawStartX = altar ? altar.x + 2.4 : th.x + 3.4;
  const rawStartZ = altar ? altar.z + 1.0 : th.z + 1.5;
  const safeStart = useMemo(() => getNearestClearPoint(rawStartX, rawStartZ, village), [rawStartX, rawStartZ, village]);

  const state = useRef({
    x: safeStart.x,
    z: safeStart.z,
    targetX: safeStart.x,
    targetZ: safeStart.z,
    isIdle: true,
    idleTimer: 2.0,
    heading: 0,
    speed: 0.8,
    jumpTimer: 0,
  });

  const pickTarget = () => {
    const pt = findClearPatrolPoint(state.current.x, state.current.z, village, 2.5, 5.5);
    state.current.targetX = pt.x;
    state.current.targetZ = pt.z;
    state.current.isIdle = false;
    const dx = pt.x - state.current.x;
    const dz = pt.z - state.current.z;
    if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
      state.current.heading = Math.atan2(dx, dz);
    }
  };

  useFrame(({ clock }, dt) => {
    const s = state.current;
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    if (s.jumpTimer > 0) {
      s.jumpTimer -= dt;
      root.position.y = Math.sin(s.jumpTimer * Math.PI * 4) * 0.45;
    } else {
      root.position.y = 0;
    }

    if (isRecovering) {
      body.position.y = 0;
      if (isMoving) setIsMoving(false);
      return;
    }

    if (s.isIdle) {
      s.idleTimer -= dt;
      body.position.y = Math.sin(clock.elapsedTime * 2) * 0.025;
      if (isMoving) setIsMoving(false);
      if (s.idleTimer <= 0) {
        pickTarget();
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        s.isIdle = true;
        s.idleTimer = 4.0 + Math.random() * 3.5;
        body.position.y = 0;
        if (isMoving) setIsMoving(false);
      } else {
        const step = Math.min(dist, s.speed * dt);
        const moveX = (dx / dist) * step;
        const moveZ = (dz / dist) * step;

        let moved = false;
        if (!isPositionBlocked(s.x + moveX, s.z + moveZ, village, 0.4)) {
          s.x += moveX;
          s.z += moveZ;
          moved = true;
        } else if (!isPositionBlocked(s.x + moveX, s.z, village, 0.4)) {
          s.x += moveX;
          moved = true;
        } else if (!isPositionBlocked(s.x, s.z + moveZ, village, 0.4)) {
          s.z += moveZ;
          moved = true;
        }

        if (moved) {
          if (!isMoving) setIsMoving(true);
          body.position.y = Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.08;
          body.rotation.y = Math.atan2(dx, dz);
        } else {
          s.isIdle = true;
          s.idleTimer = 1.0 + Math.random() * 2.0;
          body.position.y = 0;
          if (isMoving) setIsMoving(false);
        }
      }
    }

    root.position.x = s.x;
    root.position.z = s.z;
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    state.current.jumpTimer = 0.6;
    AudioManager.playVictory();
    if (isRecovering) {
      onClick(`Rey Héroe (Nv.${heroLevel})`, 'Zzz... Reponiendo fuerzas tras la última batalla...', [state.current.x, 0, state.current.z]);
    } else {
      const p = HERO_PHRASES[Math.floor(Math.random() * HERO_PHRASES.length)];
      onClick(`Rey Héroe (Nv.${heroLevel})`, p, [state.current.x, 0, state.current.z]);
    }
  };

  return (
    <group ref={rootRef} position={[safeStart.x, 0, safeStart.z]} onPointerDown={handlePointerDown}>
      <group ref={bodyRef}>
        <HeroKingModel level={heroLevel} scale={0.95} isMoving={isMoving} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// 3D Military Campgrounds Scenery (Command Tent, Campfire, Dummies & Targets)
// ---------------------------------------------------------------------------

const TrainingCampScenery: React.FC<{ x: number; z: number; teamColor?: string }> = ({
  x,
  z,
  teamColor = '#3a7bd5',
}) => {
  const fireRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (fireRef.current) {
      const f = 1 + Math.sin(clock.elapsedTime * 12) * 0.15;
      fireRef.current.scale.set(f, f * 1.1, f);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Compact sandy training ground floor pad (radius 1.35) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[1.35, 20]} />
        <meshStandardMaterial color="#c29b68" roughness={0.9} />
      </mesh>

      {/* 4 corner torch brackets on perimeter */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const px = Math.cos(angle) * 1.22;
        const pz = Math.sin(angle) * 1.22;
        return (
          <group key={i} position={[px, 0, pz]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.4, 5]} />
              <meshStandardMaterial color="#593b22" />
            </mesh>
            <mesh position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.045, 6, 6]} />
              <meshStandardMaterial color="#f1c40f" emissive="#e67e22" emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Mini Command Pavilion / Banner at North edge */}
      <group position={[0, 0, -0.9]} rotation={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 1.0, 5]} />
          <meshStandardMaterial color="#4a2e12" />
        </mesh>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.3, 0.18, 0.02]} />
          <meshStandardMaterial color={teamColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <coneGeometry args={[0.04, 0.08, 4]} />
          <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Small supply crate */}
        <mesh position={[0.26, 0.1, 0.05]} castShadow>
          <boxGeometry args={[0.2, 0.2, 0.2]} />
          <meshStandardMaterial color="#6a4521" roughness={0.8} />
        </mesh>
      </group>

      {/* Central Warming Campfire (Compact) */}
      <group position={[0, 0, 0]}>
        {/* Stone ring */}
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.26, 0.05, Math.sin(a) * 0.26]}>
              <dodecahedronGeometry args={[0.06, 0]} />
              <meshStandardMaterial color="#57606f" />
            </mesh>
          );
        })}
        {/* Wood logs */}
        <mesh position={[0, 0.07, 0]} rotation={[0.4, 0.8, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3]} />
          <meshStandardMaterial color="#2f1a08" />
        </mesh>
        <mesh position={[0, 0.07, 0]} rotation={[-0.4, -0.6, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.3]} />
          <meshStandardMaterial color="#2f1a08" />
        </mesh>
        {/* Animated campfire flame */}
        <group ref={fireRef} position={[0, 0.16, 0]}>
          <mesh>
            <coneGeometry args={[0.13, 0.28, 5]} />
            <meshBasicMaterial color="#ff4757" />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <coneGeometry args={[0.09, 0.2, 5]} />
            <meshBasicMaterial color="#ffa502" />
          </mesh>
        </group>
      </group>

      {/* Target Dummy (Wooden sparring doll, compact) */}
      <group position={[-0.8, 0, 0.55]} rotation={[0, 0.8, 0]} scale={0.72}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.1]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.25, 4, 8]} />
          <meshStandardMaterial color="#d4a373" roughness={1} />
        </mesh>
        <mesh position={[0, 0.95, 0]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.14, 0.16, 6]} />
          <meshStandardMaterial color="#747d8c" metalness={0.7} />
        </mesh>
      </group>

      {/* Archery Target Board (Compact) */}
      <group position={[0.85, 0, -0.55]} rotation={[0, -2.2, 0]} scale={0.72}>
        <mesh position={[-0.15, 0.45, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        <mesh position={[0.15, 0.45, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.06, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.72, 0.035]}>
          <circleGeometry args={[0.2, 14]} />
          <meshBasicMaterial color="#ff4757" />
        </mesh>
        <mesh position={[0, 0.72, 0.036]}>
          <circleGeometry args={[0.09, 14]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      </group>

      {/* Weapon Rack (Compact) */}
      <group position={[-0.8, 0, -0.5]} rotation={[0, 0.6, 0]} scale={0.65}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.08]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        <mesh position={[-0.25, 0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.36]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        <mesh position={[0.25, 0.18, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.36]} />
          <meshStandardMaterial color="#593b22" />
        </mesh>
        {[-0.15, 0.15].map((xOffset, i) => (
          <mesh key={i} position={[xOffset, 0.35, 0.06]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.45]} />
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
  onClick: (name: string, phrase: string, pos: [number, number, number]) => void;
}

const PRACTICE_PHRASES: Record<TroopId, string[]> = {
  infantry: [
    '¡Entrenando para el asedio!',
    '¡Golpe 1, 2, estocada!',
    '¡Espadas afiladas y listas para la orden!',
    '¡Un buen soldado nunca deja de practicar!'
  ],
  archers: [
    '¡Afinando la puntería!',
    '¡Diana perfecta!',
    '¡Diez flechas seguidas al centro del blanco!',
    '¡Listas para cubrir el avance!'
  ],
  cavalry: [
    '¡Calentando para la carga!',
    '¡Jinetes listos para el asalto!',
    '¡Fuerza, velocidad y disciplina!',
    '¡El corcel está impaciente por galopar!'
  ],
  mages: [
    '¡Concentrando energía arcana!',
    '¡Conjuros de batalla al 100%!',
    '¡Poder elemental en sincronía!',
    '¡La magia pulverizará las defensas!'
  ],
  catapults: [
    '¡Ajustando la tensión de disparo!',
    '¡Cálculo balístico exacto!',
    '¡Listas para destruir murallas y torres!',
    '¡Piedras pesadas listas para volar!'
  ],
  healers: [
    '¡Canalizando auras de protección!',
    '¡El ejército no caerá en batalla!',
    '¡Bendición de combate lista!',
    '¡Sanan las heridas de los valientes!'
  ],
  skeletons: [
    '¡Chasquido de huesos y espadas!',
    '¡Afilando espadas del inframundo!',
    '¡Practicando el asalto en horda!',
    '¡Resucitados para la gloria!'
  ],
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
        rootRef.current.position.y = Math.sin(jump * Math.PI) * 0.45;
      }
    } else if (rootRef.current) {
      rootRef.current.position.y = 0;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setJump(1);
    AudioManager.playClick();
    const phrases = PRACTICE_PHRASES[type] || ['¡Entrenando!'];
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    onClick(GameConfig.troops[type]?.name || 'Tropa de Asalto', p, [x, 0, z]);
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
  heroLevel = 0,
  heroRecoveringUntil = 0,
  now = Date.now(),
}) => {
  const [balloon, setBalloon] = useState<{
    name: string;
    phrase: string;
    pos: [number, number, number];
  } | null>(null);

  const barracks = village.find((b) => b.type === 'barracks');
  const campPos = useMemo<[number, number]>(() => {
    if (barracks) {
      const candidates: [number, number][] = [
        [barracks.x + 2.5, barracks.z + 1.0], // East
        [barracks.x + 1.0, barracks.z + 2.5], // South
        [barracks.x - 1.5, barracks.z + 1.0], // West
        [barracks.x + 1.0, barracks.z - 1.5], // North
      ];
      const otherBuildings = village.filter((b) => b.uid !== barracks.uid);
      for (const [candX, candZ] of candidates) {
        const cx = Math.max(-7.5, Math.min(7.5, candX));
        const cz = Math.max(-7.5, Math.min(7.5, candZ));
        if (!isPositionBlocked(cx, cz, otherBuildings, 0.7)) {
          return [cx, cz];
        }
      }
      return [
        Math.max(-7.5, Math.min(7.5, barracks.x + 2.4)),
        Math.max(-7.5, Math.min(7.5, barracks.z + 1.0)),
      ];
    }
    return [5.5, -0.5];
  }, [barracks, village]);

  const teamColor = useMemo(() => {
    switch (kingdom) {
      case 'frost':
        return '#38ada9';
      case 'golden':
        return '#f6b93b';
      default:
        return '#2ed573';
    }
  }, [kingdom]);

  const villageLayoutKey = useMemo(() => {
    return village.map((b) => `${b.uid}:${b.x},${b.z}`).join(';');
  }, [village]);

  // Generate patrolling guards from BOTH active troops and garrison with unobstructed spawn coordinates
  const patrollingGuards = useMemo(() => {
    const list: { id: string; type: TroopId; x: number; z: number }[] = [];
    const types = Object.keys(GameConfig.troops) as TroopId[];

    types.forEach((type) => {
      const count = (troops[type] || 0) + ((garrison && garrison[type]) || 0);
      if (count > 0) {
        // Spawn 1 to 3 representative patrol actors based on troop count
        const numActors = Math.min(3, Math.max(1, Math.ceil(count / 5)));
        for (let i = 0; i < numActors; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = 2.0 + Math.random() * 6.0;
          const rawX = Math.max(-8, Math.min(8, Math.cos(angle) * r));
          const rawZ = Math.max(-8, Math.min(8, Math.sin(angle) * r));
          const clearPt = getNearestClearPoint(rawX, rawZ, village);
          list.push({
            id: `patrol_${type}_${i}`,
            type,
            x: clearPt.x,
            z: clearPt.z,
          });
        }
      }
    });

    return list.slice(0, 16); // High performance cap
  }, [troops, garrison, villageLayoutKey]);

  // Generate practicing troops positioned compactly within the training camp pad
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

    // Swordsmen sparring near the dummy
    if ((troops.infantry || 0) > 0) {
      list.push({
        id: 'train_infantry_1',
        type: 'infantry',
        x: cx - 0.52,
        z: cz + 0.42,
        rot: 2.2,
        practiceType: 'sword',
      });
      if (troops.infantry > 6) {
        list.push({
          id: 'train_infantry_2',
          type: 'infantry',
          x: cx - 0.72,
          z: cz + 0.18,
          rot: 1.8,
          practiceType: 'sword',
        });
      }
    }

    // Archers taking aim at target boards
    if ((troops.archers || 0) > 0) {
      list.push({
        id: 'train_archers_1',
        type: 'archers',
        x: cx + 0.55,
        z: cz - 0.32,
        rot: -0.6,
        practiceType: 'bow',
      });
      if (troops.archers > 6) {
        list.push({
          id: 'train_archers_2',
          type: 'archers',
          x: cx + 0.72,
          z: cz - 0.12,
          rot: -0.6,
          practiceType: 'bow',
        });
      }
    }

    // Cavalry practicing trotting/lance
    if ((troops.cavalry || 0) > 0) {
      list.push({
        id: 'train_cavalry',
        type: 'cavalry',
        x: cx - 0.1,
        z: cz - 0.65,
        rot: Math.PI / 2,
        practiceType: 'horse',
      });
    }

    // Mages channeling arcane glyphs
    if ((troops.mages || 0) > 0) {
      list.push({
        id: 'train_mages',
        type: 'mages',
        x: cx - 0.55,
        z: cz - 0.15,
        rot: -0.4,
        practiceType: 'magic',
      });
    }

    // Healers praying for victory
    if ((troops.healers || 0) > 0) {
      list.push({
        id: 'train_healers',
        type: 'healers',
        x: cx + 0.15,
        z: cz + 0.65,
        rot: -2.0,
        practiceType: 'heal',
      });
    }

    // Catapults tuning siege counterweights
    if ((troops.catapults || 0) > 0) {
      list.push({
        id: 'train_catapult',
        type: 'catapults',
        x: cx + 0.65,
        z: cz + 0.45,
        rot: -1.2,
        practiceType: 'siege',
      });
    }

    return list;
  }, [troops, campPos]);

  const handleTroopClick = (name: string, phrase: string, pos?: [number, number, number]) => {
    setBalloon({ name, phrase, pos: pos || [campPos[0], 2.2, campPos[1]] });
    setTimeout(() => {
      setBalloon(null);
    }, 2800);
  };

  const totalAttackTroops = Object.values(troops || {}).reduce((a, b) => a + (b || 0), 0);
  const isHeroRecovering = heroRecoveringUntil > now;

  return (
    <group>
      {/* 1. Training Grounds & Military Campgrounds (visible if player has troops or barracks) */}
      {(totalAttackTroops > 0 || barracks) && (
        <TrainingCampScenery x={campPos[0]} z={campPos[1]} teamColor={teamColor} />
      )}

      {/* 2. Practicing Attack Troops in the Camp */}
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

      {/* 3. Patrolling Village Troops wandering pathways and defenses */}
      {patrollingGuards.map((g) => (
        <PatrollingGuard
          key={g.id}
          id={g.id}
          type={g.type}
          initialX={g.x}
          initialZ={g.z}
          teamColor={teamColor}
          village={village}
          onClick={handleTroopClick}
        />
      ))}

      {/* 4. Royal Hero King inspecting defenses and troops */}
      {heroLevel >= 1 && (
        <HeroKingPatrol
          heroLevel={heroLevel}
          isRecovering={isHeroRecovering}
          village={village}
          onClick={handleTroopClick}
        />
      )}

      {/* Speech Balloon positioned in 3D right above the clicked soldier */}
      {balloon && (
        <Html position={[balloon.pos[0], balloon.pos[1] + 1.6, balloon.pos[2]]} center zIndexRange={[120, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 32, 0.95), rgba(35, 25, 55, 0.95))',
              border: '2px solid var(--accent-gold)',
              borderRadius: '12px',
              padding: '8px 14px',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 12px rgba(255, 215, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              whiteSpace: 'nowrap',
              position: 'relative'
            }}
          >
            <b style={{ fontSize: '11px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{balloon.name}</b>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{balloon.phrase}</span>
            {/* Balloon triangle tail pointing down to unit */}
            <div
              style={{
                position: 'absolute',
                bottom: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '8px solid var(--accent-gold)'
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
};
