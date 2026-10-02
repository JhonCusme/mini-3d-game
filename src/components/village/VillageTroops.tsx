import React, { useRef, useMemo, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import type { PlacedBuilding, TroopCounts, TroopId } from '../../core/GameState';
import { GameConfig } from '../../config/GameConfig';
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
};

// ---------------------------------------------------------------------------
// 3D Unit Mesh (Stylized Characters with training/marching animations)
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
  return (
    <StylizedTroop
      type={type}
      teamColor={teamColor}
      isMoving={!isPracticing}
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

  const patrolState = useRef({
    x: initialX,
    z: initialZ,
    targetX: initialX,
    targetZ: initialZ,
    isIdle: true,
    idleTimer: 2.0 + Math.random() * 3,
    heading: Math.random() * Math.PI * 2,
    speed: 0.85 + Math.random() * 0.35,
    jumpTimer: 0,
  });

  const pickNewTarget = () => {
    // Keep patrol inside the main secure village perimeter
    const angle = Math.random() * Math.PI * 2;
    const dist = 3.5 + Math.random() * 5.0;
    const nx = Math.max(-8.5, Math.min(8.5, patrolState.current.x + Math.cos(angle) * dist));
    const nz = Math.max(-8.5, Math.min(8.5, patrolState.current.z + Math.sin(angle) * dist));
    patrolState.current.targetX = nx;
    patrolState.current.targetZ = nz;
    patrolState.current.isIdle = false;

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
      root.position.y = Math.sin(s.jumpTimer * Math.PI * 4) * 0.45;
    } else {
      root.position.y = 0;
    }

    if (s.isIdle) {
      s.idleTimer -= dt;
      body.position.y = Math.sin(clock.elapsedTime * 2 + initialX) * 0.03;
      if (s.idleTimer <= 0) {
        pickNewTarget();
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 0.25) {
        s.isIdle = true;
        s.idleTimer = 3.0 + Math.random() * 4.0;
        body.position.y = 0;
      } else {
        const step = Math.min(dist, s.speed * dt);
        s.x += (dx / dist) * step;
        s.z += (dz / dist) * step;

        const isFlying = type === 'mages' || type === 'healers';
        body.position.y = isFlying
          ? Math.sin(clock.elapsedTime * 3) * 0.08
          : Math.abs(Math.sin(clock.elapsedTime * 9)) * 0.07;

        body.rotation.y = Math.atan2(dx, dz);
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
        <VillageUnitMesh type={type} teamColor={teamColor} isPracticing={false} />
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

  const th = village.find((b) => b.type === 'townhall') || { x: 0, z: 0 };
  const altar = village.find((b) => b.type === 'altar');

  const startX = altar ? altar.x + 1.2 : th.x + 1.8;
  const startZ = altar ? altar.z + 1.2 : th.z + 2.2;

  const state = useRef({
    x: startX,
    z: startZ,
    targetX: startX,
    targetZ: startZ,
    isIdle: true,
    idleTimer: 2.0,
    heading: 0,
    speed: 0.8,
    jumpTimer: 0,
  });

  const pickTarget = () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2.5 + Math.random() * 4.5;
    const nx = Math.max(-7.5, Math.min(7.5, th.x + Math.cos(angle) * dist));
    const nz = Math.max(-7.5, Math.min(7.5, th.z + Math.sin(angle) * dist));
    state.current.targetX = nx;
    state.current.targetZ = nz;
    state.current.isIdle = false;
    const dx = nx - state.current.x;
    const dz = nz - state.current.z;
    state.current.heading = Math.atan2(dx, dz);
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
      return;
    }

    if (s.isIdle) {
      s.idleTimer -= dt;
      body.position.y = Math.sin(clock.elapsedTime * 2) * 0.025;
      if (s.idleTimer <= 0) {
        pickTarget();
      }
    } else {
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.25) {
        s.isIdle = true;
        s.idleTimer = 4.0 + Math.random() * 4.0;
        body.position.y = 0;
      } else {
        const step = Math.min(dist, s.speed * dt);
        s.x += (dx / dist) * step;
        s.z += (dz / dist) * step;
        body.position.y = Math.abs(Math.sin(clock.elapsedTime * 7)) * 0.08;
        body.rotation.y = Math.atan2(dx, dz);
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
    <group ref={rootRef} position={[startX, 0, startZ]} onPointerDown={handlePointerDown}>
      <group ref={bodyRef}>
        <HeroKingModel level={heroLevel} scale={0.95} />
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
      {/* Sandy training ground floor pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[3.3, 24]} />
        <meshStandardMaterial color="#c29b68" roughness={0.9} />
      </mesh>

      {/* Decorative training ring border stakes with torch brackets */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const px = Math.cos(angle) * 3.1;
        const pz = Math.sin(angle) * 3.1;
        return (
          <group key={i} position={[px, 0, pz]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 0.5, 6]} />
              <meshStandardMaterial color="#593b22" />
            </mesh>
            {i % 2 === 0 && (
              <mesh position={[0, 0.52, 0]}>
                <sphereGeometry args={[0.06, 6, 6]} />
                <meshStandardMaterial color="#f1c40f" emissive="#e67e22" emissiveIntensity={0.8} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Military Command Tent with Team Color Canvas */}
      <group position={[-1.2, 0, -2.1]} rotation={[0, 0.35, 0]}>
        {/* Tent A-Frame Support Posts */}
        {[-0.6, 0.6].map((postX, i) => (
          <group key={i} position={[postX, 0, 0]}>
            <mesh position={[0, 0.6, -0.4]} rotation={[0.45, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 1.4, 5]} />
              <meshStandardMaterial color="#4a2e12" />
            </mesh>
            <mesh position={[0, 0.6, 0.4]} rotation={[-0.45, 0, 0]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 1.4, 5]} />
              <meshStandardMaterial color="#4a2e12" />
            </mesh>
          </group>
        ))}
        {/* Ridgepole */}
        <mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1.3, 5]} />
          <meshStandardMaterial color="#4a2e12" />
        </mesh>
        {/* Fabric Canvas Roof */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <coneGeometry args={[1.0, 1.1, 4]} />
          <meshStandardMaterial color={teamColor} roughness={0.7} />
        </mesh>
        {/* Golden Pennant Flag */}
        <mesh position={[0, 1.35, 0]}>
          <boxGeometry args={[0.32, 0.15, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Supply Wooden Crate */}
        <mesh position={[0.7, 0.18, 0.2]} castShadow>
          <boxGeometry args={[0.36, 0.36, 0.36]} />
          <meshStandardMaterial color="#6a4521" roughness={0.8} />
        </mesh>
        {/* Hay bale for horses */}
        <mesh position={[-0.8, 0.16, 0.4]} castShadow>
          <boxGeometry args={[0.5, 0.32, 0.32]} />
          <meshStandardMaterial color="#d4a373" roughness={1} />
        </mesh>
      </group>

      {/* Central Warming Campfire */}
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
        {/* Wood logs */}
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

      {/* Archery Target Board */}
      <group position={[1.8, 0, -1.2]} rotation={[0, -2.2, 0]}>
        <mesh position={[-0.2, 0.5, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        <mesh position={[0.2, 0.5, -0.1]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.1]} />
          <meshStandardMaterial color="#573a1d" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.08, 18]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0.8, 0.045]}>
          <circleGeometry args={[0.26, 16]} />
          <meshBasicMaterial color="#ff4757" />
        </mesh>
        <mesh position={[0, 0.8, 0.046]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
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
      <group position={[-1.7, 0, -0.9]} rotation={[0, 0.6, 0]}>
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
      const cx = barracks.x + 3.8;
      const cz = barracks.z + 1.2;
      return [Math.max(-8, Math.min(8, cx)), Math.max(-8, Math.min(8, cz))];
    }
    return [6.5, -0.5];
  }, [barracks?.x, barracks?.z]);

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

  // Generate patrolling guards from BOTH active troops and garrison!
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
          const r = 2.0 + Math.random() * 6.5;
          list.push({
            id: `patrol_${type}_${i}`,
            type,
            x: Math.max(-8, Math.min(8, Math.cos(angle) * r)),
            z: Math.max(-8, Math.min(8, Math.sin(angle) * r)),
          });
        }
      }
    });

    return list.slice(0, 16); // High performance cap
  }, [troops, garrison]);

  // Generate practicing troops positioned around the training camp
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
        x: cx - 1.0,
        z: cz + 0.9,
        rot: 2.2,
        practiceType: 'sword',
      });
      if (troops.infantry > 6) {
        list.push({
          id: 'train_infantry_2',
          type: 'infantry',
          x: cx - 1.3,
          z: cz + 0.3,
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
        x: cx + 0.8,
        z: cz - 0.7,
        rot: 0.9,
        practiceType: 'bow',
      });
      if (troops.archers > 6) {
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

    // Cavalry practicing trotting/lance
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

    // Mages channeling arcane glyphs
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

    // Healers praying for victory
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

    // Catapults tuning siege counterweights
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
