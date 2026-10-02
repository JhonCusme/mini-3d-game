import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { TroopId } from '../../core/GameState';

export interface CharacterProps {
  teamColor?: string;
  isMoving?: boolean;
  isAttacking?: boolean;
  isPracticing?: boolean;
  practiceType?: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
  animOffset?: number;
  aimAngle?: number;
  scale?: number;
}

// ===========================================================================
// 1. BARBARIAN INFANTRY (Guerrero Bárbaro con Casco de Cuernos y Espada)
// ===========================================================================
export const BarbarianModel: React.FC<CharacterProps> = ({
  teamColor = '#3a7bd5',
  isMoving = false,
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const rootRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const swordRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 8 + animOffset;
    
    // Leg & arm walking swing
    if (isMoving) {
      const legSwing = Math.sin(t) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -legSwing * 0.7;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
    }

    // Slashing sword swing for attack or practice
    if (isAttacking || (isPracticing)) {
      const slashT = clock.elapsedTime * 12 + animOffset;
      const slash = Math.sin(slashT);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.6 + slash * 0.9;
        rightArmRef.current.rotation.z = -0.3 + Math.cos(slashT) * 0.3;
      }
    } else {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = isMoving ? Math.sin(t) * 0.4 : 0;
        rightArmRef.current.rotation.z = -0.15;
      }
    }
  });

  return (
    <group ref={rootRef} scale={scale}>
      {/* --- PELVIS & LEATHER KILT --- */}
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.22]} />
        <meshStandardMaterial color="#6a3b1a" roughness={0.8} />
      </mesh>
      {/* Belt with Gold Buckle */}
      <mesh position={[0, 0.44, 0.01]}>
        <boxGeometry args={[0.32, 0.06, 0.24]} />
        <meshStandardMaterial color="#3d2110" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.44, 0.125]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* --- TORSO & CHEST HARNESS --- */}
      <group position={[0, 0.58, 0]}>
        {/* Muscular torso */}
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.26, 0.24]} />
          <meshStandardMaterial color="#f0b67f" roughness={0.7} />
        </mesh>
        {/* Leather Armor Harness with Team Color Accent */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.38, 0.24, 0.25]} />
          <meshStandardMaterial color={teamColor} roughness={0.7} />
        </mesh>
        {/* Cross leather strap */}
        <mesh position={[0, 0.02, 0.13]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.06, 0.34, 0.02]} />
          <meshStandardMaterial color="#4a2810" roughness={0.8} />
        </mesh>
      </group>

      {/* --- HEAD & BARBARIAN HELMET --- */}
      <group position={[0, 0.82, 0]}>
        {/* Head */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial color="#f0b67f" roughness={0.6} />
        </mesh>
        
        {/* Eyes (stylized Clash dots) */}
        <mesh position={[-0.05, 0.02, 0.135]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[0.05, 0.02, 0.135]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        
        {/* Fierce angled eyebrows */}
        <mesh position={[-0.05, 0.06, 0.14]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[0.05, 0.018, 0.015]} />
          <meshStandardMaterial color="#e59819" />
        </mesh>
        <mesh position={[0.05, 0.06, 0.14]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[0.05, 0.018, 0.015]} />
          <meshStandardMaterial color="#e59819" />
        </mesh>

        {/* Big Yellow Warrior Mustache */}
        <mesh position={[0, -0.04, 0.14]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.04]} />
          <meshStandardMaterial color="#f5cd2f" roughness={0.5} />
        </mesh>
        <mesh position={[-0.09, -0.06, 0.13]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.028, 0.08, 6]} />
          <meshStandardMaterial color="#f5cd2f" roughness={0.5} />
        </mesh>
        <mesh position={[0.09, -0.06, 0.13]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.028, 0.08, 6]} />
          <meshStandardMaterial color="#f5cd2f" roughness={0.5} />
        </mesh>

        {/* Iron Viking Helmet */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
          <meshStandardMaterial color="#636e72" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Helmet Rim & Rivets */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.03, 16]} />
          <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Left Horn */}
        <group position={[-0.15, 0.08, 0]} rotation={[0, 0, 0.8]}>
          <mesh castShadow>
            <coneGeometry args={[0.035, 0.18, 8]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.5} />
          </mesh>
        </group>
        {/* Right Horn */}
        <group position={[0.15, 0.08, 0]} rotation={[0, 0, -0.8]}>
          <mesh castShadow>
            <coneGeometry args={[0.035, 0.18, 8]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* --- LEGS & BOOTS --- */}
      <group ref={leftLegRef} position={[-0.09, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 8]} />
          <meshStandardMaterial color="#f0b67f" />
        </mesh>
        {/* Leather Fur Boot */}
        <mesh position={[0, -0.2, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.12, 0.16]} />
          <meshStandardMaterial color="#4a2810" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.09, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 8]} />
          <meshStandardMaterial color="#f0b67f" />
        </mesh>
        <mesh position={[0, -0.2, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.12, 0.16]} />
          <meshStandardMaterial color="#4a2810" roughness={0.9} />
        </mesh>
      </group>

      {/* --- LEFT ARM & SHIELD --- */}
      <group ref={leftArmRef} position={[-0.23, 0.64, 0]}>
        {/* Arm */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial color="#f0b67f" />
        </mesh>
        {/* Spiked Bracer */}
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Round Wooden Shield */}
        <group position={[-0.07, -0.15, 0.08]} rotation={[0, 0.3, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
          </mesh>
          {/* Iron Rim */}
          <mesh>
            <torusGeometry args={[0.22, 0.02, 8, 16]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Team Color Center Boss */}
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color={teamColor} metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT ARM & BROADSWORD --- */}
      <group ref={rightArmRef} position={[0.23, 0.64, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial color="#f0b67f" />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Sturdy Broadsword */}
        <group ref={swordRef} position={[0, -0.22, 0.1]} rotation={[1.1, 0, 0]}>
          {/* Leather Grip */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
            <meshStandardMaterial color="#3d2110" />
          </mesh>
          {/* Gold Pommel */}
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Crossguard */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.16, 0.03, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Steel Blade */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.06, 0.52, 0.015]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Blade Point */}
          <mesh position={[0, 0.57, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.042, 0.042, 0.015]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ===========================================================================
// 2. ARCHER HEROINE (Arquera Elfa con Arco Recurvo, Carcaj y Cabello Magenta)
// ===========================================================================
export const ArcherModel: React.FC<CharacterProps> = ({
  teamColor = '#2ed573',
  isMoving = false,
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const rootRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const bowstringRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 8 + animOffset;

    if (isMoving) {
      const stride = Math.sin(t) * 0.5;
      if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }

    // Aiming and drawing bow
    if (isAttacking || isPracticing) {
      const aimCycle = (clock.elapsedTime * 6 + animOffset) % (Math.PI * 2);
      const pull = Math.sin(aimCycle);
      if (leftArmRef.current) {
        // Holding bow out horizontally
        leftArmRef.current.rotation.x = -1.4;
        leftArmRef.current.rotation.y = 0.4;
      }
      if (rightArmRef.current) {
        // Pulling bowstring near cheek
        rightArmRef.current.rotation.x = -1.3 + pull * 0.15;
        rightArmRef.current.rotation.y = -0.5 + pull * 0.2;
      }
      if (bowstringRef.current) {
        bowstringRef.current.scale.z = 1 + Math.max(0, pull) * 0.5;
      }
    } else {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.set(-0.3, 0, 0.15);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.set(isMoving ? -Math.sin(t) * 0.4 : 0, 0, -0.15);
      }
    }
  });

  return (
    <group ref={rootRef} scale={scale}>
      {/* --- LEATHER BELT & SKIRT --- */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.18, 0.2, 8]} />
        <meshStandardMaterial color={teamColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.04, 8]} />
        <meshStandardMaterial color="#4a2810" />
      </mesh>
      {/* Belt Pouch */}
      <mesh position={[0.11, 0.46, 0.05]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.05]} />
        <meshStandardMaterial color="#2d1a08" />
      </mesh>

      {/* --- TORSO & ARCHER TUNIC --- */}
      <group position={[0, 0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.22, 0.18]} />
          <meshStandardMaterial color={teamColor} roughness={0.6} />
        </mesh>
        {/* Leather Quiver Strap across chest */}
        <mesh position={[0, 0.02, 0.095]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.04, 0.32, 0.015]} />
          <meshStandardMaterial color="#3d2110" />
        </mesh>
        {/* Quiver on back */}
        <group position={[-0.06, 0.05, -0.13]} rotation={[-0.3, 0.2, 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.045, 0.34, 8]} />
            <meshStandardMaterial color="#4a2810" roughness={0.8} />
          </mesh>
          {/* Fletching / Arrows visible in quiver */}
          {[-0.02, 0, 0.02].map((x, i) => (
            <group key={i} position={[x, 0.2 + i * 0.02, (i - 1) * 0.02]}>
              <mesh>
                <cylinderGeometry args={[0.007, 0.007, 0.12, 4]} />
                <meshStandardMaterial color="#c8a06e" />
              </mesh>
              {/* Pink / White Fletching Feather */}
              <mesh position={[0, 0.05, 0]}>
                <boxGeometry args={[0.025, 0.04, 0.01]} />
                <meshStandardMaterial color="#ff4757" />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* --- HEAD & ARCHER HAIR / HOOD --- */}
      <group position={[0, 0.82, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color="#fcd5b4" roughness={0.5} />
        </mesh>
        {/* Expressive dark eyes */}
        <mesh position={[-0.045, 0.02, 0.115]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#1e272e" />
        </mesh>
        <mesh position={[0.045, 0.02, 0.115]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#1e272e" />
        </mesh>
        {/* Iconic Magenta/Pink Hair (Clash Archer) */}
        <group position={[0, 0.03, -0.02]}>
          <mesh castShadow>
            <sphereGeometry args={[0.145, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
            <meshStandardMaterial color="#e84393" roughness={0.4} />
          </mesh>
          {/* Hair fringe on forehead */}
          <mesh position={[0, 0.08, 0.11]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.18, 0.05, 0.05]} />
            <meshStandardMaterial color="#e84393" />
          </mesh>
          {/* Long twin hair tresses falling beside shoulders */}
          <mesh position={[-0.12, -0.1, 0.03]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.035, 0.18, 4, 8]} />
            <meshStandardMaterial color="#e84393" />
          </mesh>
          <mesh position={[0.12, -0.1, 0.03]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.035, 0.18, 4, 8]} />
            <meshStandardMaterial color="#e84393" />
          </mesh>
        </group>
        {/* Golden Archer Tiara / Headband */}
        <mesh position={[0, 0.06, 0.06]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.13, 0.012, 6, 16]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* --- LEGS & ARCHER BOOTS --- */}
      <group ref={leftLegRef} position={[-0.07, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial color="#fcd5b4" />
        </mesh>
        <mesh position={[0, -0.18, 0.02]} castShadow>
          <boxGeometry args={[0.09, 0.14, 0.14]} />
          <meshStandardMaterial color="#4a2810" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.07, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial color="#fcd5b4" />
        </mesh>
        <mesh position={[0, -0.18, 0.02]} castShadow>
          <boxGeometry args={[0.09, 0.14, 0.14]} />
          <meshStandardMaterial color="#4a2810" roughness={0.8} />
        </mesh>
      </group>

      {/* --- LEFT ARM & RECURVE COMPOSITE BOW --- */}
      <group ref={leftArmRef} position={[-0.18, 0.65, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.2, 6]} />
          <meshStandardMaterial color="#fcd5b4" />
        </mesh>
        {/* Archery Glove */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
          <meshStandardMaterial color="#2d1a08" />
        </mesh>
        {/* Recurve Bow */}
        <group position={[0, -0.22, 0.1]} rotation={[0, 0, 0.2]}>
          {/* Wooden Bow Grip */}
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.14, 6]} />
            <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
          </mesh>
          {/* Upper Limb (Curved) */}
          <mesh position={[0, 0.18, -0.04]} rotation={[0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.26, 0.018]} />
            <meshStandardMaterial color="#6a3b1a" roughness={0.7} />
          </mesh>
          {/* Lower Limb (Curved) */}
          <mesh position={[0, -0.18, -0.04]} rotation={[-0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.26, 0.018]} />
            <meshStandardMaterial color="#6a3b1a" roughness={0.7} />
          </mesh>
          {/* Bowstring */}
          <mesh ref={bowstringRef} position={[0, 0, -0.12]}>
            <cylinderGeometry args={[0.005, 0.005, 0.62, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT ARM & NOCKED ARROW --- */}
      <group ref={rightArmRef} position={[0.18, 0.65, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.2, 6]} />
          <meshStandardMaterial color="#fcd5b4" />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
          <meshStandardMaterial color="#2d1a08" />
        </mesh>
        {/* Arrow (shown while shooting/practicing) */}
        {(isAttacking || isPracticing) && (
          <group position={[-0.05, -0.18, 0.15]} rotation={[0, 0.4, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.55, 4]} />
              <meshStandardMaterial color="#c8a06e" />
            </mesh>
            {/* Arrowhead */}
            <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.025, 0.06, 4]} />
              <meshStandardMaterial color="#dcdde1" metalness={0.9} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

// ===========================================================================
// 3. ARCANE MAGE (Mago Arcano con Toga, Capucha Estelar, Báculo y Orbe Mágico)
// ===========================================================================
export const MageModel: React.FC<CharacterProps> = ({
  teamColor = '#7b4dff',
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const staffRef = useRef<Group>(null);
  const orbRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 3 + animOffset;

    // Floating levitation bobbing
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 0.4;
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      auraRef.current.scale.set(pulse, pulse, 1);
    }

    // Orb mystical pulsation
    if (orbRef.current) {
      orbRef.current.rotation.y = t * 1.5;
      orbRef.current.rotation.x = t * 0.8;
      const s = 1 + Math.sin(t * 3) * 0.2;
      orbRef.current.scale.set(s, s, s);
    }

    // Staff casting gesture
    if (isAttacking || isPracticing) {
      const cast = Math.sin(clock.elapsedTime * 6 + animOffset);
      if (staffRef.current) {
        staffRef.current.rotation.x = -0.5 + cast * 0.4;
        staffRef.current.position.z = 0.2 + cast * 0.1;
      }
    }
  });

  return (
    <group scale={scale}>
      {/* --- ARCANE GLYPH ON GROUND --- */}
      <mesh ref={auraRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.48, 16]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.5} />
      </mesh>

      {/* --- FLOWING WIZARD ROBES --- */}
      <group position={[0, 0.45, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.34, 0.72, 10]} />
          <meshStandardMaterial color={teamColor} roughness={0.6} />
        </mesh>
        {/* Golden Hem Trim */}
        <mesh position={[0, -0.34, 0]}>
          <cylinderGeometry args={[0.345, 0.35, 0.05, 10]} />
          <meshStandardMaterial color="#ffd700" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Golden Waist Sash with Runic Gem */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 10]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.04, 0.2]}>
          <octahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* --- HEAD, WHITE BEARD & WIZARD HAT --- */}
      <group position={[0, 0.88, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color="#fcd5b4" roughness={0.6} />
        </mesh>

        {/* Glowing Arcane Cyan Eyes */}
        <mesh position={[-0.045, 0.02, 0.12]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.12]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>

        {/* Long Sculpted White Beard */}
        <group position={[0, -0.06, 0.1]}>
          <mesh castShadow>
            <coneGeometry args={[0.1, 0.26, 6]} />
            <meshStandardMaterial color="#f5f6fa" roughness={0.6} />
          </mesh>
        </group>

        {/* Pointy Wizard Hat with Folded Tip */}
        <group position={[0, 0.09, 0]}>
          {/* Hat Brim */}
          <mesh position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.03, 12]} />
            <meshStandardMaterial color="#2c1a4d" roughness={0.7} />
          </mesh>
          {/* Hat Cone */}
          <mesh position={[0, 0.18, -0.02]} rotation={[-0.15, 0, 0]} castShadow>
            <coneGeometry args={[0.18, 0.36, 8]} />
            <meshStandardMaterial color="#2c1a4d" roughness={0.7} />
          </mesh>
          {/* Curved Hat Tip */}
          <mesh position={[0, 0.36, -0.08]} rotation={[-0.6, 0, 0]}>
            <coneGeometry args={[0.09, 0.2, 6]} />
            <meshStandardMaterial color="#2c1a4d" roughness={0.7} />
          </mesh>
          {/* Golden Star Clasp */}
          <mesh position={[0, 0.06, 0.16]}>
            <octahedronGeometry args={[0.035, 0]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT HAND & GNARLED ARCANE STAFF --- */}
      <group ref={staffRef} position={[0.26, 0.6, 0.1]}>
        {/* Carved Wooden Staff */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 1.0, 6]} />
          <meshStandardMaterial color="#5a3d1c" roughness={0.9} />
        </mesh>
        {/* Golden Staff Head / Socket */}
        <mesh position={[0, 0.52, 0]}>
          <torusGeometry args={[0.06, 0.02, 6, 12]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} />
        </mesh>
        {/* Levitating Pulsing Crystal Orb */}
        <mesh ref={orbRef} position={[0, 0.54, 0]}>
          <dodecahedronGeometry args={[0.075, 0]} />
          <meshStandardMaterial
            color="#00f2fe"
            emissive="#4facfe"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* --- LEFT HAND CASTING SWIRL --- */}
      <group position={[-0.24, 0.55, 0.12]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#fcd5b4" />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 4. KNIGHT CAVALRY (Caballero con Armadura Completa, Yelmo y Corcel de Guerra)
// ===========================================================================
export const CavalryModel: React.FC<CharacterProps> = ({
  teamColor = '#3a7bd5',
  isMoving = false,
  isAttacking = false,
  animOffset = 0,
  scale = 1,
}) => {
  const horseRef = useRef<Group>(null);
  const lanceRef = useRef<Group>(null);
  const frontLegs = useRef<Group>(null);
  const backLegs = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 10 + animOffset;

    // Galloping legs animation
    if (isMoving) {
      const gallop = Math.sin(t) * 0.6;
      if (frontLegs.current) frontLegs.current.rotation.x = gallop;
      if (backLegs.current) backLegs.current.rotation.x = -gallop;
      if (horseRef.current) horseRef.current.position.y = Math.abs(Math.sin(t)) * 0.08;
    } else {
      if (frontLegs.current) frontLegs.current.rotation.x = 0;
      if (backLegs.current) backLegs.current.rotation.x = 0;
      if (horseRef.current) horseRef.current.position.y = 0;
    }

    // Lance attack thrust
    if (isAttacking) {
      const thrust = Math.sin(clock.elapsedTime * 12 + animOffset);
      if (lanceRef.current) {
        lanceRef.current.position.z = 0.3 + thrust * 0.2;
        lanceRef.current.rotation.x = 1.35 + thrust * 0.1;
      }
    } else {
      if (lanceRef.current) {
        lanceRef.current.position.z = 0.25;
        lanceRef.current.rotation.x = isMoving ? 1.25 : 0.8;
      }
    }
  });

  return (
    <group scale={scale}>
      <group ref={horseRef}>
        {/* --- WAR HORSE BODY --- */}
        <mesh position={[0, 0.44, 0]} castShadow>
          <boxGeometry args={[0.36, 0.34, 0.82]} />
          <meshStandardMaterial color="#7a441e" roughness={0.7} />
        </mesh>
        {/* Horse Saddle Blanket with Team Color & Gold Fringe */}
        <mesh position={[0, 0.46, -0.02]}>
          <boxGeometry args={[0.38, 0.32, 0.42]} />
          <meshStandardMaterial color={teamColor} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.33, -0.02]}>
          <boxGeometry args={[0.39, 0.04, 0.44]} />
          <meshStandardMaterial color="#ffd700" metalness={0.7} />
        </mesh>

        {/* Horse Neck & Head */}
        <group position={[0, 0.62, 0.38]} rotation={[-0.4, 0, 0]}>
          {/* Neck */}
          <mesh castShadow>
            <boxGeometry args={[0.2, 0.38, 0.24]} />
            <meshStandardMaterial color="#7a441e" roughness={0.7} />
          </mesh>
          {/* Mane */}
          <mesh position={[0, 0.1, -0.13]}>
            <boxGeometry args={[0.06, 0.4, 0.08]} />
            <meshStandardMaterial color="#3e1f0a" roughness={0.8} />
          </mesh>
          {/* Head & Snout */}
          <group position={[0, 0.26, 0.12]} rotation={[0.6, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.2, 0.32]} />
              <meshStandardMaterial color="#7a441e" roughness={0.7} />
            </mesh>
            {/* White Face Blaze / Marking */}
            <mesh position={[0, 0.105, 0.02]}>
              <boxGeometry args={[0.06, 0.01, 0.24]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Dark Nostrils */}
            <mesh position={[-0.04, 0.02, 0.165]}>
              <sphereGeometry args={[0.018, 4, 4]} />
              <meshStandardMaterial color="#2d1709" />
            </mesh>
            <mesh position={[0.04, 0.02, 0.165]}>
              <sphereGeometry args={[0.018, 4, 4]} />
              <meshStandardMaterial color="#2d1709" />
            </mesh>
            {/* Pointed Alert Ears */}
            <mesh position={[-0.07, 0.15, -0.1]} rotation={[-0.3, 0, -0.2]}>
              <coneGeometry args={[0.03, 0.1, 4]} />
              <meshStandardMaterial color="#7a441e" />
            </mesh>
            <mesh position={[0.07, 0.15, -0.1]} rotation={[-0.3, 0, 0.2]}>
              <coneGeometry args={[0.03, 0.1, 4]} />
              <meshStandardMaterial color="#7a441e" />
            </mesh>
          </group>
        </group>

        {/* Horse Bushy Tail */}
        <group position={[0, 0.52, -0.42]} rotation={[0.5, 0, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.08, 0.35, 6]} />
            <meshStandardMaterial color="#3e1f0a" roughness={0.8} />
          </mesh>
        </group>

        {/* Front Legs */}
        <group ref={frontLegs} position={[0, 0.3, 0.28]}>
          {[-0.12, 0.12].map((x, i) => (
            <mesh key={i} position={[x, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.04, 0.36, 6]} />
              <meshStandardMaterial color="#5a2f12" />
            </mesh>
          ))}
        </group>

        {/* Back Legs */}
        <group ref={backLegs} position={[0, 0.3, -0.28]}>
          {[-0.12, 0.12].map((x, i) => (
            <mesh key={i} position={[x, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.04, 0.36, 6]} />
              <meshStandardMaterial color="#5a2f12" />
            </mesh>
          ))}
        </group>
      </group>

      {/* --- ARMORED KNIGHT RIDER --- */}
      <group position={[0, 0.72, -0.05]}>
        {/* Steel Cuirass (Pecho de armadura) */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.22]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Golden Lion/Royal Crest on Chest */}
        <mesh position={[0, 0.18, 0.115]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Knight Greathelm Helmet */}
        <group position={[0, 0.44, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.24, 8]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Eye Slit Visor */}
          <mesh position={[0, 0.02, 0.13]}>
            <boxGeometry args={[0.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Helmet Crest Plume (Feather in team color) */}
          <mesh position={[0, 0.2, -0.04]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.06, 0.22, 6]} />
            <meshStandardMaterial color={teamColor} />
          </mesh>
        </group>

        {/* Knight Shield on Left Arm */}
        <group position={[-0.24, 0.15, 0.08]} rotation={[0, 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.38, 0.28]} />
            <meshStandardMaterial color={teamColor} metalness={0.4} roughness={0.4} />
          </mesh>
          {/* Shield Steel Border */}
          <mesh position={[-0.01, 0, 0]}>
            <boxGeometry args={[0.03, 0.4, 0.3]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Tournament Jousting Lance on Right Hand */}
        <group ref={lanceRef} position={[0.24, 0.15, 0.2]}>
          {/* Hand Guard Vamplate */}
          <mesh position={[0, 0, -0.2]}>
            <coneGeometry args={[0.1, 0.14, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
          {/* Long Tapered Steel Lance */}
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.035, 1.5, 8]} />
            <meshStandardMaterial color="#bdc3c7" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Lance Team Pennant Flag */}
          <mesh position={[0, -0.08, 0.8]}>
            <boxGeometry args={[0.01, 0.16, 0.3]} />
            <meshStandardMaterial color={teamColor} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ===========================================================================
// 5. SIEGE CATAPULT (Catapulta de Asedio Reforzada con Rocas de Granito)
// ===========================================================================
export const CatapultModel: React.FC<CharacterProps> = ({
  teamColor = '#8b5a2b',
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const armRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (isAttacking || isPracticing) {
      const cycle = (clock.elapsedTime * 4 + animOffset) % (Math.PI * 2);
      // Wind up slowly then snap forward
      const armRot = cycle < Math.PI ? -0.4 + cycle * 0.2 : 0.2 - (cycle - Math.PI) * 0.6;
      if (armRef.current) armRef.current.rotation.x = armRot;
    } else {
      if (armRef.current) armRef.current.rotation.x = 0.25;
    }
  });

  return (
    <group scale={scale}>
      {/* --- HEAVY TIMBER CHASSIS --- */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.18, 0.95]} />
        <meshStandardMaterial color="#5a3d1c" roughness={0.9} />
      </mesh>
      {/* Team Color Banner Plate */}
      <mesh position={[0, 0.24, 0.48]}>
        <boxGeometry args={[0.32, 0.1, 0.02]} />
        <meshStandardMaterial color={teamColor} />
      </mesh>
      {/* Iron Reinforcement Corner Brackets */}
      {[-0.34, 0.34].map((x, i) =>
        [-0.45, 0.45].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.24, z]}>
            <boxGeometry args={[0.06, 0.2, 0.08]} />
            <meshStandardMaterial color="#2f3542" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* --- SPOKED TIMBER WHEELS (4) --- */}
      {[-0.4, 0.4].map((x, i) =>
        [-0.34, 0.34].map((z, j) => (
          <group key={`${i}-${j}`} position={[x, 0.2, z]}>
            {/* Iron Banded Rim */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.2, 0.2, 0.08, 14]} />
              <meshStandardMaterial color="#3e2712" roughness={0.8} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.2, 0.015, 6, 14]} />
              <meshStandardMaterial color="#2f3542" metalness={0.8} />
            </mesh>
            {/* Central Hubcap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} />
            </mesh>
          </group>
        ))
      )}

      {/* --- A-FRAME TIMBER SUPPORTS --- */}
      {[-0.26, 0.26].map((x, i) => (
        <group key={i} position={[x, 0.5, 0]}>
          <mesh rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color="#4a3014" />
          </mesh>
          <mesh rotation={[-0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial color="#4a3014" />
          </mesh>
        </group>
      ))}
      {/* Heavy Crossbeam Axle */}
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.62, 8]} />
        <meshStandardMaterial color="#2f3542" metalness={0.8} />
      </mesh>

      {/* --- THROWING ARM & ROCK BUCKET --- */}
      <group ref={armRef} position={[0, 0.65, 0]}>
        {/* Main Timber Beam */}
        <mesh position={[0, 0.35, 0.3]} rotation={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.95]} />
          <meshStandardMaterial color="#5a3d1c" roughness={0.8} />
        </mesh>
        {/* Heavy Iron Counterweight at bottom */}
        <mesh position={[0, -0.15, -0.2]}>
          <boxGeometry args={[0.3, 0.22, 0.2]} />
          <meshStandardMaterial color="#2f3542" metalness={0.7} />
        </mesh>
        {/* Rock Basket / Spoon */}
        <mesh position={[0, 0.72, 0.65]}>
          <cylinderGeometry args={[0.18, 0.1, 0.14, 8]} />
          <meshStandardMaterial color="#3e2712" />
        </mesh>
        {/* Loaded Jagged Granite Boulder */}
        <mesh position={[0, 0.8, 0.65]} castShadow>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#747d8c" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 6. ANGELIC HEALER (Ángel / Curandera Sagrada con Alas, Halo y Báculo de Vida)
// ===========================================================================
export const HealerModel: React.FC<CharacterProps> = ({
  teamColor = '#2ed573',
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const leftWingRef = useRef<Group>(null);
  const rightWingRef = useRef<Group>(null);
  const staffRef = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 5 + animOffset;

    // Graceful flapping wings
    const flap = Math.sin(t) * 0.45;
    if (leftWingRef.current) leftWingRef.current.rotation.y = -0.4 + flap;
    if (rightWingRef.current) rightWingRef.current.rotation.y = 0.4 - flap;

    // Halo gentle hover
    if (haloRef.current) {
      haloRef.current.position.y = 0.34 + Math.sin(t * 0.8) * 0.03;
      haloRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    }

    // Healing prayer staff wave
    if (isAttacking || isPracticing) {
      const healWave = Math.sin(clock.elapsedTime * 6 + animOffset);
      if (staffRef.current) {
        staffRef.current.rotation.x = -0.6 + healWave * 0.3;
      }
    }
  });

  return (
    <group scale={scale}>
      {/* Floating Holy Aura on ground */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.42, 16]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.4} />
      </mesh>

      {/* --- PRISTINE SILKEN GOWN --- */}
      <group position={[0, 0.44, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.32, 0.68, 10]} />
          <meshStandardMaterial color="#f5f6fa" roughness={0.4} />
        </mesh>
        {/* Emerald Gem Brooch */}
        <mesh position={[0, 0.18, 0.15]}>
          <octahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial color="#2ed573" emissive="#2ed573" emissiveIntensity={0.8} />
        </mesh>
        {/* Golden Embroidery */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.325, 0.33, 0.04, 10]} />
          <meshStandardMaterial color="#ffd700" metalness={0.7} />
        </mesh>
      </group>

      {/* --- HEAD, GOLDEN BRAIDS & FLOATING HALO --- */}
      <group position={[0, 0.86, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial color="#fcd5b4" roughness={0.5} />
        </mesh>
        {/* Gentle Eyes */}
        <mesh position={[-0.045, 0.02, 0.12]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        <mesh position={[0.045, 0.02, 0.12]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        {/* Golden Blonde Hair */}
        <mesh position={[0, 0.04, -0.02]} castShadow>
          <sphereGeometry args={[0.145, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          <meshStandardMaterial color="#f6e58d" roughness={0.5} />
        </mesh>
        {/* Floating Golden Halo */}
        <mesh ref={haloRef} position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 8, 16]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.7} />
        </mesh>
      </group>

      {/* --- MULTI-LAYERED FEATHERED WINGS --- */}
      <group ref={leftWingRef} position={[-0.14, 0.65, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.44, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} transparent opacity={0.92} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.14, 0.65, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.44, 0.03]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} transparent opacity={0.92} />
        </mesh>
      </group>

      {/* --- HEALING CADUCEUS STAFF --- */}
      <group ref={staffRef} position={[0.22, 0.58, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.85, 6]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} />
        </mesh>
        {/* Emerald Caduceus Cross */}
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.16, 0.04, 0.03]} />
          <meshStandardMaterial color="#2ed573" emissive="#2ed573" emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.04, 0.16, 0.03]} />
          <meshStandardMaterial color="#2ed573" emissive="#2ed573" emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// MAIN UNIFIED TROOP COMPONENT
// ===========================================================================
export const StylizedTroop: React.FC<{
  type: TroopId;
  teamColor?: string;
  isMoving?: boolean;
  isAttacking?: boolean;
  isPracticing?: boolean;
  practiceType?: 'sword' | 'bow' | 'horse' | 'magic' | 'siege' | 'heal';
  animOffset?: number;
  aimAngle?: number;
  scale?: number;
}> = ({ type, teamColor, isMoving, isAttacking, isPracticing, practiceType, animOffset, aimAngle, scale }) => {
  switch (type) {
    case 'infantry':
      return (
        <BarbarianModel
          teamColor={teamColor}
          isMoving={isMoving}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          practiceType={practiceType}
          aimAngle={aimAngle}
          animOffset={animOffset}
          scale={scale}
        />
      );
    case 'archers':
      return (
        <ArcherModel
          teamColor={teamColor}
          isMoving={isMoving}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          practiceType={practiceType}
          aimAngle={aimAngle}
          animOffset={animOffset}
          scale={scale}
        />
      );
    case 'mages':
      return (
        <MageModel
          teamColor={teamColor}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset}
          scale={scale}
        />
      );
    case 'cavalry':
      return (
        <CavalryModel
          teamColor={teamColor}
          isMoving={isMoving}
          isAttacking={isAttacking}
          animOffset={animOffset}
          scale={scale}
        />
      );
    case 'catapults':
      return (
        <CatapultModel
          teamColor={teamColor}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset}
          scale={scale}
        />
      );
    case 'healers':
      return (
        <HealerModel
          teamColor={teamColor}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset}
          scale={scale}
        />
      );
    default:
      return null;
  }
};

// ===========================================================================
// 7. HERO KING / GRAN REY (Héroe Legendario del Altar con Corona y Capa Real)
// ===========================================================================
export const HeroKingModel: React.FC<{ level?: number; scale?: number }> = ({ level = 1, scale = 1 }) => {
  const capeRef = useRef<Group>(null);
  const swordRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 3;
    // Cape billowing in the wind
    if (capeRef.current) {
      capeRef.current.rotation.x = -0.25 + Math.sin(t * 1.5) * 0.08;
    }
    // Subtle breathing/sword posture
    if (swordRef.current) {
      swordRef.current.rotation.z = Math.sin(t * 0.8) * 0.03;
    }
    // Royal glowing aura
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 0.2;
      const s = 1 + Math.sin(t * 2) * 0.08;
      auraRef.current.scale.set(s, s, 1);
    }
  });

  const shinyTint = Math.min(1, level / 10);

  return (
    <group scale={scale}>
      {/* Royal Pedestal Aura */}
      <mesh ref={auraRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.6, 16]} />
        <meshBasicMaterial color="#ffd700" transparent opacity={0.35 + shinyTint * 0.25} />
      </mesh>

      {/* --- LEGS & ARMORED GREAVES --- */}
      {[-0.1, 0.1].map((x, i) => (
        <group key={i} position={[x, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.055, 0.35, 8]} />
            <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.15, 0.03]} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.18]} />
            <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* --- TORSO & ROYAL CUIRASS --- */}
      <group position={[0, 0.62, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.35, 0.26]} />
          <meshStandardMaterial color="#dcdde1" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Golden Lion Crest on Chest */}
        <mesh position={[0, 0.04, 0.135]}>
          <boxGeometry args={[0.16, 0.16, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Heavy Golden Shoulder Pauldrons */}
        {[-0.24, 0.24].map((x, i) => (
          <group key={i} position={[x, 0.16, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* --- ROYAL CAPE (Capa de terciopelo real) --- */}
        <group ref={capeRef} position={[0, 0.16, -0.13]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.36, 0.65, 0.02]} />
            <meshStandardMaterial color="#881337" roughness={0.7} />
          </mesh>
          {/* White Fur Trim on Cape Top */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.38, 0.08, 0.04]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* --- HEAD, BEARD & ROYAL CROWN --- */}
      <group position={[0, 0.95, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial color="#fcd5b4" roughness={0.6} />
        </mesh>
        {/* Determined Eyes */}
        <mesh position={[-0.045, 0.02, 0.13]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0.045, 0.02, 0.13]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* King's Noble Brown Beard */}
        <group position={[0, -0.06, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.12, 0.1]} />
            <meshStandardMaterial color="#4a2810" roughness={0.7} />
          </mesh>
        </group>

        {/* Golden Royal Crown */}
        <group position={[0, 0.14, 0]}>
          {/* Crown Base Band */}
          <mesh>
            <cylinderGeometry args={[0.155, 0.155, 0.05, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Ruby Jewels on Crown */}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, i) => (
            <mesh
              key={i}
              position={[Math.sin(angle) * 0.16, 0, Math.cos(angle) * 0.16]}
            >
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={0.6} />
            </mesh>
          ))}
          {/* Crown Spikes */}
          {[0, 1, 2, 3, 4].map(i => {
            const a = (i * Math.PI * 2) / 5;
            return (
              <mesh key={i} position={[Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14]}>
                <coneGeometry args={[0.035, 0.09, 4]} />
                <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
              </mesh>
            );
          })}
        </group>
      </group>

      {/* --- EXCALIBUR ROYAL GREATSWORD --- */}
      <group ref={swordRef} position={[0, 0.48, 0.28]}>
        {/* Crossguard */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.26, 0.04, 0.04]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
        {/* Leather Grip */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
          <meshStandardMaterial color="#881337" />
        </mesh>
        {/* Crown Pommel */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
        {/* Gleaming Steel Blade Planted Downward */}
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.02]} />
          <meshStandardMaterial
            color="#f1f5f9"
            metalness={0.95}
            roughness={0.15}
            emissive="#38bdf8"
            emissiveIntensity={0.2 + shinyTint * 0.3}
          />
        </mesh>
      </group>
    </group>
  );
};

