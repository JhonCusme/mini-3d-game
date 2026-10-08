import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Group, type Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, Mesh as ThreeMesh } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { TroopId } from '../../core/GameState';
import { ProceduralTextures } from '../../core/textures/ProceduralTextures';

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
      {/* --- PELVIS & LEATHER KILT (Curved anatomical form) --- */}
      <mesh position={[0, 0.36, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.2, 12]} />
        <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.7} />
      </mesh>
      {/* Belt with Gold Buckle */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 14]} />
        <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.44, 0.125]}>
        <boxGeometry args={[0.1, 0.08, 0.02]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* --- TORSO & CHEST HARNESS --- */}
      <group position={[0, 0.58, 0]}>
        {/* Muscular tapered torso */}
        <mesh castShadow>
          <cylinderGeometry args={[0.19, 0.16, 0.28, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
        </mesh>
        {/* Leather Armor Harness with Team Color Accent */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.195, 0.165, 0.24, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.65} />
        </mesh>
        {/* Cross leather strap */}
        <mesh position={[0, 0.02, 0.13]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.06, 0.34, 0.02]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.7} />
        </mesh>
      </group>

      {/* --- HEAD & BARBARIAN HELMET --- */}
      <group position={[0, 0.82, 0]}>
        {/* Head */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 12, 10]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
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
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Helmet Rim & Rivets */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.03, 16]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.85} roughness={0.2} />
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
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
        </mesh>
        {/* Tapered Leather Boot with Curved Toe */}
        <group position={[0, -0.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.055, 0.065, 0.14, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.06, 0.04]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
          </mesh>
        </group>
      </group>
      <group ref={rightLegRef} position={[0.09, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.16, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.2, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.12, 0.16]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
        </mesh>
      </group>

      {/* --- LEFT ARM & SHIELD --- */}
      <group ref={leftArmRef} position={[-0.23, 0.64, 0]}>
        {/* Arm */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
        </mesh>
        {/* Spiked Bracer */}
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Round Wooden Shield */}
        <group position={[-0.07, -0.15, 0.08]} rotation={[0, 0.3, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.7} />
          </mesh>
          {/* Iron Rim */}
          <mesh>
            <torusGeometry args={[0.22, 0.02, 8, 16]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Team Color Center Boss */}
          <mesh position={[0, 0.025, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} color={teamColor} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* --- RIGHT ARM & BROADSWORD --- */}
      <group ref={rightArmRef} position={[0.23, 0.64, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Sturdy Broadsword */}
        <group ref={swordRef} position={[0, -0.22, 0.1]} rotation={[1.1, 0, 0]}>
          {/* Leather Grip */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.7} />
          </mesh>
          {/* Gold Pommel */}
          <mesh position={[0, -0.13, 0]}>
            <sphereGeometry args={[0.035, 6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Crossguard */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.16, 0.03, 0.04]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Steel Blade */}
          <mesh position={[0, 0.28, 0]} castShadow>
            <boxGeometry args={[0.06, 0.52, 0.015]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Blade Point */}
          <mesh position={[0, 0.57, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
            <boxGeometry args={[0.042, 0.042, 0.015]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.95} roughness={0.15} />
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
        <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.135, 0.135, 0.04, 8]} />
        <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.6} />
      </mesh>
      {/* Belt Pouch */}
      <mesh position={[0.11, 0.46, 0.05]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.06, 0.08, 0.05]} />
        <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.7} />
      </mesh>

      {/* --- TORSO & ARCHER TUNIC --- */}
      <group position={[0, 0.6, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.12, 0.26, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.6} />
        </mesh>
        {/* Leather Quiver Strap across chest */}
        <mesh position={[0, 0.02, 0.095]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.04, 0.32, 0.015]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.7} />
        </mesh>
        {/* Quiver on back */}
        <group position={[-0.06, 0.05, -0.13]} rotation={[-0.3, 0.2, 0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.045, 0.34, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.75} />
          </mesh>
          {/* Fletching / Arrows visible in quiver */}
          {[-0.02, 0, 0.02].map((x, i) => (
            <group key={i} position={[x, 0.2 + i * 0.02, (i - 1) * 0.02]}>
              <mesh>
                <cylinderGeometry args={[0.007, 0.007, 0.12, 4]} />
                <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
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
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
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
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* --- LEGS & ARCHER BOOTS --- */}
      <group ref={leftLegRef} position={[-0.07, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
        </mesh>
        <group position={[0, -0.18, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.052, 0.14, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.06, 0.04]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.75} />
          </mesh>
        </group>
      </group>
      <group ref={rightLegRef} position={[0.07, 0.28, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
        </mesh>
        <group position={[0, -0.18, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.052, 0.14, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.06, 0.04]} castShadow>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* --- LEFT ARM & RECURVE COMPOSITE BOW --- */}
      <group ref={leftArmRef} position={[-0.18, 0.65, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.2, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
        </mesh>
        {/* Archery Glove */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.7} />
        </mesh>
        {/* Recurve Bow */}
        <group position={[0, -0.22, 0.1]} rotation={[0, 0, 0.2]}>
          {/* Wooden Bow Grip */}
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.14, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.7} />
          </mesh>
          {/* Upper Limb (Curved) */}
          <mesh position={[0, 0.18, -0.04]} rotation={[0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.26, 0.018]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.7} />
          </mesh>
          {/* Lower Limb (Curved) */}
          <mesh position={[0, -0.18, -0.04]} rotation={[-0.4, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 0.26, 0.018]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.7} />
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
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.06, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.7} />
        </mesh>
        {/* Arrow (shown while shooting/practicing) */}
        {(isAttacking || isPracticing) && (
          <group position={[-0.05, -0.18, 0.15]} rotation={[0, 0.4, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.55, 4]} />
              <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
            </mesh>
            {/* Arrowhead */}
            <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.025, 0.06, 4]} />
              <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

// ===========================================================================
// 3. ARCANE MAGE (Mago Arcano con Toga, Capucha Estelar, Báculo y Escoba Mágica 3D)
// ===========================================================================

export const WitchBroomModel: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const { scene } = useGLTF('/models/Escoba.glb');
  const broomGroup = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // In raw Escoba.glb:
    // Y extends from ~0 (bristles) to ~2.97 (handle tip).
    // The natural seat where a rider sits is at Y = 1.35.
    // Offset cloned so that seat is exactly at (0, 0, 0):
    cloned.position.set(0, -1.35, 0);
    const pivot = new Group();
    pivot.add(cloned);
    // Rotate so handle points forward (+Z) and bristles point backward (-Z)
    // Dynamic flight pitch: gentle upward tilt (~12 degrees), matching the classic witch flight illustration
    pivot.rotation.x = Math.PI / 2 - 0.22;

    const wrapper = new Group();
    wrapper.add(pivot);
    // Total raw length is ~3.02m. Normalize to ~1.65m target length:
    const normScale = (1.65 / 3.02) * scale;
    wrapper.scale.setScalar(normScale);
    return wrapper;
  }, [scene, scale]);

  return <primitive object={broomGroup} />;
};

export const WitchCharacterModel: React.FC<{
  scale?: number;
  isAttacking?: boolean;
  animOffset?: number;
}> = ({ scale = 1, isAttacking = false, animOffset = 0 }) => {
  const { scene } = useGLTF('/models/Bruja.glb');

  const { wrapper, bones, baseRot } = useMemo(() => {
    // SkeletonUtils.clone properly duplicates SkinnedMesh bones and bindings
    const cloned = SkeletonUtils.clone(scene);
    const boneMap: Record<string, any> = {};

    cloned.traverse((child) => {
      // Collect deform bones and head/neck
      if (child.name.startsWith('DEF-') || child.name === 'head' || child.name === 'neck') {
        boneMap[child.name] = child;
      }
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        child.visible = true;
        const mesh = child as Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat: any) => {
            mat.side = 2; // DoubleSide
            mat.depthWrite = true;
            mat.alphaTest = 0.5;
            mat.needsUpdate = true;
          });
        }
      }
    });

    // Anchor hair and hat directly to DEF-spine006 (the deform bone of the skull and face)
    // so they stay 100% attached to her head and never sink in or expose a bald head!
    cloned.updateMatrixWorld(true);
    let hairMesh: any = null;
    let hatMesh: any = null;
    cloned.traverse((child) => {
      if (child.name === 'hair') hairMesh = child;
      if (child.name === 'hat') hatMesh = child;
    });

    if (boneMap['DEF-spine006']) {
      if (hairMesh) boneMap['DEF-spine006'].attach(hairMesh);
      if (hatMesh) boneMap['DEF-spine006'].attach(hatMesh);
    }    // Spine tilted forward into flight along the broom handle
    if (boneMap['DEF-spine002']) {
      boneMap['DEF-spine002'].rotation.x += 0.38;
    }
    if (boneMap['DEF-spine003']) {
      boneMap['DEF-spine003'].rotation.x += 0.28;
    }

    // Left Arm: reaches forward along left side of broom handle (uncrossed)
    if (boneMap['DEF-upper_armL']) {
      boneMap['DEF-upper_armL'].rotation.x -= 0.20;
      boneMap['DEF-upper_armL'].rotation.y -= 0.45;
      boneMap['DEF-upper_armL'].rotation.z -= 0.60;
    }
    if (boneMap['DEF-forearmL']) {
      boneMap['DEF-forearmL'].rotation.x += 0.35;
      boneMap['DEF-forearmL'].rotation.y += 0.20;
      boneMap['DEF-forearmL'].rotation.z -= 0.25;
    }
    if (boneMap['DEF-handL']) {
      boneMap['DEF-handL'].rotation.y += 0.25;
      boneMap['DEF-handL'].rotation.z -= 0.20;
    }

    // Right Arm: reaches forward along right side of broom handle (uncrossed)
    if (boneMap['DEF-upper_armR']) {
      boneMap['DEF-upper_armR'].rotation.x += 0.04;
      boneMap['DEF-upper_armR'].rotation.y += 0.45;
      boneMap['DEF-upper_armR'].rotation.z += 0.75;
    }
    if (boneMap['DEF-forearmR']) {
      boneMap['DEF-forearmR'].rotation.x += 0.30;
      boneMap['DEF-forearmR'].rotation.y -= 0.20;
      boneMap['DEF-forearmR'].rotation.z += 0.25;
    }
    if (boneMap['DEF-handR']) {
      boneMap['DEF-handR'].rotation.y -= 0.25;
      boneMap['DEF-handR'].rotation.z += 0.20;
    }

    // Fingers curled naturally around the broom handle
    const fingerBones = [
      'DEF-f_index01L', 'DEF-f_index02L', 'DEF-f_middle01L', 'DEF-f_middle02L', 'DEF-f_ring01L', 'DEF-f_ring02L', 'DEF-f_pinky01L', 'DEF-thumb01L',
      'DEF-f_index01R', 'DEF-f_index02R', 'DEF-f_middle01R', 'DEF-f_middle02R', 'DEF-f_ring01R', 'DEF-f_ring02R', 'DEF-f_pinky01R', 'DEF-thumb01R'
    ];
    fingerBones.forEach(fName => {
      if (boneMap[fName]) {
        boneMap[fName].rotation.x += 0.45;
      }
    });

    // Seated Broom-Riding Flight Pose: thighs straddling broom forward, knees bent ~90°, boots trailing
    if (boneMap['DEF-thighL']) {
      boneMap['DEF-thighL'].rotation.x -= 1.15;
      boneMap['DEF-thighL'].rotation.z -= 0.18;
    }
    if (boneMap['DEF-shinL']) {
      boneMap['DEF-shinL'].rotation.x += 1.35;
    }
    if (boneMap['DEF-thighR']) {
      boneMap['DEF-thighR'].rotation.x -= 1.15;
      boneMap['DEF-thighR'].rotation.z += 0.18;
    }
    if (boneMap['DEF-shinR']) {
      boneMap['DEF-shinR'].rotation.x += 1.35;
    }

    const wrap = new Group();
    wrap.add(cloned);
    // Height of Bruja.glb is 3.38m; normalize down to ~1.3 unit game character scale
    const normScale = (1.3 / 3.38) * scale;
    wrap.scale.setScalar(normScale);
    // Align her pelvis/hips so her seat and thighs sit comfortably ON TOP of the broom shaft
    wrap.position.set(0, -0.40 * (scale / 0.92), 0);
    // Save baseline rotations for smooth useFrame animation additions
    const baseRotations: Record<string, { x: number; y: number; z: number }> = {};
    Object.keys(boneMap).forEach(k => {
      const r = boneMap[k].rotation;
      baseRotations[k] = { x: r.x, y: r.y, z: r.z };
    });

    return { wrapper: wrap, bones: boneMap, baseRot: baseRotations };
  }, [scene, scale]);

  // Live dynamic flight animation in useFrame
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 2.8 + animOffset;

    // Spine breathing & flight compensation
    if (bones['DEF-spine002'] && baseRot['DEF-spine002']) {
      bones['DEF-spine002'].rotation.x = baseRot['DEF-spine002'].x + Math.sin(t * 1.5) * 0.025;
    }
    if (bones['DEF-spine003'] && baseRot['DEF-spine003']) {
      bones['DEF-spine003'].rotation.z = baseRot['DEF-spine003'].z + Math.sin(t * 1.2) * 0.02;
    }

    // Animate DEF-spine006 (skull & face deform bone) so head, hair, and hat move 100% in sync!
    if (bones['DEF-spine006'] && baseRot['DEF-spine006']) {
      bones['DEF-spine006'].rotation.y = baseRot['DEF-spine006'].y + Math.sin(t * 1.1) * 0.12;
      bones['DEF-spine006'].rotation.z = baseRot['DEF-spine006'].z + Math.cos(t * 1.3) * 0.04;
    }

    // Arms gripping broom handle or casting during attack
    if (bones['DEF-upper_armL'] && baseRot['DEF-upper_armL']) {
      bones['DEF-upper_armL'].rotation.x = baseRot['DEF-upper_armL'].x + Math.sin(t * 1.8) * 0.02;
    }
    if (bones['DEF-upper_armR'] && baseRot['DEF-upper_armR']) {
      if (isAttacking) {
        // Dramatic attack cast forward
        const cast = Math.sin(clock.elapsedTime * 6);
        bones['DEF-upper_armR'].rotation.x = baseRot['DEF-upper_armR'].x - 0.4 + cast * 0.35;
        bones['DEF-upper_armR'].rotation.z = baseRot['DEF-upper_armR'].z + 0.3 + cast * 0.2;
      } else {
        bones['DEF-upper_armR'].rotation.x = baseRot['DEF-upper_armR'].x + Math.sin(t * 1.8 + 0.5) * 0.02;
      }
    }

    // Legs subtle flight sway
    if (bones['DEF-shinL'] && baseRot['DEF-shinL']) {
      bones['DEF-shinL'].rotation.x = baseRot['DEF-shinL'].x + Math.sin(t * 1.5) * 0.015;
    }
    if (bones['DEF-shinR'] && baseRot['DEF-shinR']) {
      bones['DEF-shinR'].rotation.x = baseRot['DEF-shinR'].x + Math.cos(t * 1.5) * 0.015;
    }
  });

  return <primitive object={wrapper} />;
};

useGLTF.preload('/models/Bruja.glb');
useGLTF.preload('/models/Escoba.glb');

export const MageModel: React.FC<CharacterProps> = ({
  teamColor = '#7b4dff',
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  const flightMountRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 2.8 + animOffset;

    // Ground arcane glyph levitation pulse
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 0.4;
      const pulse = 1 + Math.sin(t * 2) * 0.15;
      auraRef.current.scale.set(pulse, pulse, 1);
    }

    // Entire broom flight mount physics: bobbing, banking tilt, and forward surge
    if (flightMountRef.current) {
      // Float at Y = 0.62 so boots hang at Y ~ 0.10, clear of the ground
      flightMountRef.current.position.y = 0.62 + Math.sin(t) * 0.05;
      flightMountRef.current.rotation.z = Math.sin(t * 0.9) * 0.05;
      flightMountRef.current.rotation.x = 0.06 + Math.cos(t * 0.8) * 0.03;
    }
  });

  return (
    <group scale={scale}>
      {/* --- ARCANE GLYPH ON GROUND --- */}
      <mesh ref={auraRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.5, 24]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.45} />
      </mesh>

      {/* --- UNIFIED FLYING MOUNT: 3D WITCH SITTING COMFORTABLY ON HER 3D BROOM --- */}
      <group ref={flightMountRef} position={[0, 0.62, 0]}>
        {/* Realistic 3D Witch's Broom Mount: positioned right through her hands and under her seat */}
        <group position={[0, 0.05, 0]}>
          <React.Suspense fallback={null}>
            <WitchBroomModel scale={0.92} />
          </React.Suspense>
        </group>

        {/* Realistic 3D Witch Character: hips positioned at (0, 0, 0) riding the broom */}
        <React.Suspense
          fallback={
            <group position={[0, 0.2, 0]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.18, 0.34, 0.72, 10]} />
                <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.65} />
              </mesh>
            </group>
          }
        >
          <WitchCharacterModel
            scale={0.92}
            isAttacking={isAttacking || isPracticing}
            animOffset={animOffset}
          />
        </React.Suspense>

        {/* Mystical Arcane Sparkles trailing behind the broom */}
        <mesh position={[0, -0.08, -0.75]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#b48cff" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 0.12, 0.5]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
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
        {/* --- WAR HORSE BODY (Organic sculpted muscular horse) --- */}
        <group position={[0, 0.44, 0]}>
          {/* Muscular Barrel Body */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.21, 0.23, 0.68, 14]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
          </mesh>
          {/* Broad Muscular Chest */}
          <mesh position={[0, 0.01, 0.33]} castShadow>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
          </mesh>
          {/* Rounded Powerful Rump */}
          <mesh position={[0, 0.02, -0.33]} castShadow>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
          </mesh>
          {/* Draped Saddle Blanket with Team Color & Gold Fringe */}
          <mesh position={[0, 0.05, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.225, 0.24, 0.44, 14, 1, false, 0, Math.PI]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.14, -0.02]}>
            <cylinderGeometry args={[0.235, 0.235, 0.04, 14]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} />
          </mesh>
        </group>

        {/* Horse Neck & Head */}
        <group position={[0, 0.62, 0.38]} rotation={[-0.4, 0, 0]}>
          {/* Tapered Curved Neck */}
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.17, 0.44, 12]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
          </mesh>
          {/* Flowing Mane */}
          <mesh position={[0, 0.08, -0.1]}>
            <cylinderGeometry args={[0.04, 0.06, 0.42, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
          </mesh>
          {/* Sculpted Head & Snout */}
          <group position={[0, 0.26, 0.12]} rotation={[0.6, 0, 0]}>
            {/* Skull */}
            <mesh castShadow>
              <sphereGeometry args={[0.12, 10, 8]} />
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
            </mesh>
            {/* Tapered Snout */}
            <mesh position={[0, -0.04, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.1, 0.22, 10]} />
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} roughness={0.7} />
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
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} />
            </mesh>
            <mesh position={[0.07, 0.15, -0.1]} rotation={[-0.3, 0, 0.2]}>
              <coneGeometry args={[0.03, 0.1, 4]} />
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('tan')} />
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
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} />
            </mesh>
          ))}
        </group>

        {/* Back Legs */}
        <group ref={backLegs} position={[0, 0.3, -0.28]}>
          {[-0.12, 0.12].map((x, i) => (
            <mesh key={i} position={[x, -0.18, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.04, 0.36, 6]} />
              <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} />
            </mesh>
          ))}
        </group>
      </group>

      {/* --- ARMORED KNIGHT RIDER --- */}
      <group position={[0, 0.72, -0.05]}>
        {/* Steel Cuirass (Pecho de armadura) */}
        <mesh position={[0, 0.16, 0]} castShadow>
          <boxGeometry args={[0.3, 0.3, 0.22]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Golden Lion/Royal Crest on Chest */}
        <mesh position={[0, 0.18, 0.115]}>
          <boxGeometry args={[0.1, 0.1, 0.02]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Knight Greathelm Helmet */}
        <group position={[0, 0.44, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.24, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Eye Slit Visor */}
          <mesh position={[0, 0.02, 0.13]}>
            <boxGeometry args={[0.18, 0.03, 0.02]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Helmet Crest Plume (Feather in team color) */}
          <mesh position={[0, 0.2, -0.04]} rotation={[-0.4, 0, 0]}>
            <coneGeometry args={[0.06, 0.22, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} />
          </mesh>
        </group>

        {/* Knight Shield on Left Arm */}
        <group position={[-0.24, 0.15, 0.08]} rotation={[0, 0.5, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.04, 0.38, 0.28]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} roughness={0.4} />
          </mesh>
          {/* Shield Steel Border */}
          <mesh position={[-0.01, 0, 0]}>
            <boxGeometry args={[0.03, 0.4, 0.3]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Tournament Jousting Lance on Right Hand */}
        <group ref={lanceRef} position={[0.24, 0.15, 0.2]}>
          {/* Hand Guard Vamplate */}
          <mesh position={[0, 0, -0.2]}>
            <coneGeometry args={[0.1, 0.14, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} />
          </mesh>
          {/* Long Tapered Steel Lance */}
          <mesh position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.035, 1.5, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Lance Team Pennant Flag */}
          <mesh position={[0, -0.08, 0.8]}>
            <boxGeometry args={[0.01, 0.16, 0.3]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} />
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
        <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.8} />
      </mesh>
      {/* Team Color Banner Plate */}
      <mesh position={[0, 0.24, 0.48]}>
        <boxGeometry args={[0.32, 0.1, 0.02]} />
        <meshStandardMaterial map={ProceduralTextures.getFabricTexture(teamColor)} />
      </mesh>
      {/* Iron Reinforcement Corner Brackets */}
      {[-0.34, 0.34].map((x, i) =>
        [-0.45, 0.45].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.24, z]}>
            <boxGeometry args={[0.06, 0.2, 0.08]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.85} roughness={0.25} />
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
              <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.8} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.2, 0.015, 6, 14]} />
              <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.8} />
            </mesh>
            {/* Central Hubcap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
              <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} />
            </mesh>
          </group>
        ))
      )}

      {/* --- A-FRAME TIMBER SUPPORTS --- */}
      {[-0.26, 0.26].map((x, i) => (
        <group key={i} position={[x, 0.5, 0]}>
          <mesh rotation={[0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
          </mesh>
          <mesh rotation={[-0.3, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
          </mesh>
        </group>
      ))}
      {/* Heavy Crossbeam Axle */}
      <mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.62, 8]} />
        <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.85} />
      </mesh>

      {/* --- THROWING ARM & ROCK BUCKET --- */}
      <group ref={armRef} position={[0, 0.65, 0]}>
        {/* Main Timber Beam */}
        <mesh position={[0, 0.35, 0.3]} rotation={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.09, 0.09, 0.95]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.75} />
        </mesh>
        {/* Heavy Iron Counterweight at bottom */}
        <mesh position={[0, -0.15, -0.2]}>
          <boxGeometry args={[0.3, 0.22, 0.2]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.8} />
        </mesh>
        {/* Rock Basket / Spoon */}
        <mesh position={[0, 0.72, 0.65]}>
          <cylinderGeometry args={[0.18, 0.1, 0.14, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} />
        </mesh>
        {/* Loaded Jagged Granite Boulder */}
        <mesh position={[0, 0.8, 0.65]} castShadow>
          <dodecahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.85} />
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
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#f5f6fa')} roughness={0.4} />
        </mesh>
        {/* Emerald Gem Brooch */}
        <mesh position={[0, 0.18, 0.15]}>
          <octahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial color="#2ed573" emissive="#2ed573" emissiveIntensity={0.8} />
        </mesh>
        {/* Golden Embroidery */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.325, 0.33, 0.04, 10]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} />
        </mesh>
      </group>

      {/* --- HEAD, GOLDEN BRAIDS & FLOATING HALO --- */}
      <group position={[0, 0.86, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('fair')} roughness={0.5} />
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
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} emissive="#ffd700" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* --- MULTI-LAYERED FEATHERED WINGS --- */}
      <group ref={leftWingRef} position={[-0.14, 0.65, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.44, 0.03]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#ffffff')} roughness={0.3} transparent opacity={0.94} />
        </mesh>
      </group>
      <group ref={rightWingRef} position={[0.14, 0.65, -0.12]}>
        <mesh castShadow>
          <boxGeometry args={[0.34, 0.44, 0.03]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#ffffff')} roughness={0.3} transparent opacity={0.94} />
        </mesh>
      </group>

      {/* --- HEALING CADUCEUS STAFF --- */}
      <group ref={staffRef} position={[0.22, 0.58, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.85, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} />
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
// 7. SKELETON WARRIOR (Guerrero Esqueleto No-Muerto con Espada y Animación Dinámica)
// ===========================================================================
export const SkeletonCharacterModel: React.FC<{
  scale?: number;
  isMoving?: boolean;
  isAttacking?: boolean;
  isPracticing?: boolean;
  animOffset?: number;
}> = ({ scale = 1, isMoving = false, isAttacking = false, isPracticing = false, animOffset = 0 }) => {
  const { scene } = useGLTF('/models/Esqueleto.glb');

  const { wrapper, baseRot, getBone } = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const boneMap: Record<string, any> = {};

    cloned.traverse((child) => {
      if (child.name) {
        boneMap[child.name] = child;
        // Also map dot-stripped and dot-formatted aliases so any naming variation resolves
        const noDot = child.name.replace(/\./g, '');
        boneMap[noDot] = child;
        const simple = child.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        boneMap[simple] = child;
      }
      if ((child as ThreeMesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        child.visible = true;
        const mesh = child as ThreeMesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat: any) => {
            mat.side = 2; // DoubleSide
            mat.needsUpdate = true;
          });
        }
      }
    });

    const resolver = (name: string): any => {
      if (boneMap[name]) return boneMap[name];
      const noDot = name.replace(/\./g, '');
      if (boneMap[noDot]) return boneMap[noDot];
      const simple = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (boneMap[simple]) return boneMap[simple];
      return undefined;
    };

    // Attach a stylized bone/iron gladius sword to the right hand
    const swordHand = resolver('DEF-handR') || resolver('ORG-handR') || resolver('DEF-hand.R');
    if (swordHand) {
      const sword = new Group();
      const blade = new ThreeMesh(
        new BoxGeometry(0.045, 0.38, 0.012),
        new MeshStandardMaterial({ color: '#8892b0', metalness: 0.85, roughness: 0.25 })
      );
      blade.position.y = 0.21;
      blade.castShadow = true;
      sword.add(blade);

      const crossguard = new ThreeMesh(
        new BoxGeometry(0.12, 0.025, 0.03),
        new MeshStandardMaterial({ color: '#3b3b44', metalness: 0.9, roughness: 0.3 })
      );
      crossguard.position.y = 0.04;
      sword.add(crossguard);

      const hilt = new ThreeMesh(
        new CylinderGeometry(0.014, 0.014, 0.11, 6),
        new MeshStandardMaterial({ color: '#2c1e18', roughness: 0.9 })
      );
      hilt.position.y = -0.03;
      sword.add(hilt);

      sword.rotation.x = Math.PI / 2;
      sword.rotation.z = -Math.PI / 4;
      sword.position.set(0.02, 0.02, 0.02);
      swordHand.add(sword);
    }

    // Centering & Scaling:
    // With complete mirrored Esqueleto.glb:
    // X is symmetrically centered [-0.924, 0.924], Center Z is 0.182, Bottom Y is 0.027, Height is 1.833
    // Offset cloned mesh so feet bottom center sits right on (0, 0, 0):
    cloned.position.set(0, -0.027, -0.182);

    const pivot = new Group();
    pivot.add(cloned);

    const wrap = new Group();
    wrap.add(pivot);

    // Normalize height to ~1.08 units in game
    const normScale = (1.08 / 1.833) * scale;
    wrap.scale.setScalar(normScale);

    // Cache baseline rotations and positions
    const baseRotations: Record<string, { x: number; y: number; z: number; posY: number }> = {};
    cloned.traverse((child) => {
      if (child.name) {
        baseRotations[child.name] = {
          x: child.rotation.x,
          y: child.rotation.y,
          z: child.rotation.z,
          posY: child.position.y,
        };
      }
    });

    return { wrapper: wrap, bones: boneMap, baseRot: baseRotations, getBone: resolver };
  }, [scene, scale]);

  useFrame(({ clock }) => {
    const rotX = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.x = r.x + delta;
    };
    const rotY = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.y = r.y + delta;
    };
    const rotZ = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.z = r.z + delta;
    };

    const defHips = getBone('DEF-hips') || getBone('hips');
    const orgHips = getBone('ORG-hips');

    if (isAttacking || isPracticing) {
      // Rapid fierce bone slash & stab attack
      const slashT = clock.elapsedTime * 13 + animOffset;
      const slash = Math.sin(slashT);
      rotX('ORG-upper_armR', -0.65 + slash * 0.75);
      rotX('DEF-upper_arm02R', -0.65 + slash * 0.75);
      rotZ('ORG-upper_armR', Math.cos(slashT) * 0.3);
      rotZ('DEF-upper_arm02R', Math.cos(slashT) * 0.3);

      rotX('ORG-forearmR', 0.45 + slash * 0.4);
      rotX('DEF-forearm01R', 0.45 + slash * 0.4);

      rotY('DEF-spine', Math.sin(slashT) * 0.25);
      rotX('DEF-spine', 0.15);
      rotY('DEF-head', Math.sin(slashT) * 0.2);

      // Attack stance legs (wide solid combat stance)
      rotX('ORG-thighL', 0.35);
      rotX('DEF-thigh02L', 0.15);
      rotX('ORG-shinL', 0.3);
      rotX('DEF-shin02L', 0.15);

      rotX('ORG-thighR', -0.4);
      rotX('DEF-thigh02R', -0.15);
      rotX('ORG-shinR', 0.2);
      rotX('DEF-shin02R', 0.1);
    } else if (isMoving) {
      // Rapid, frantic undead sprint with visible high knee kicking!
      const sprintT = clock.elapsedTime * 11 + animOffset;
      const legSwing = Math.sin(sprintT) * 0.95;

      // Left Leg: energetic forward & back stride with knee flexion
      rotX('ORG-thighL', legSwing);
      rotX('DEF-thigh02L', legSwing * 0.35);
      rotX('ORG-shinL', Math.max(0, -legSwing * 1.25));
      rotX('DEF-shin02L', Math.max(0, -legSwing * 0.45));
      rotX('DEF-footL', Math.sin(sprintT) * 0.4);

      // Right Leg: alternating stride with knee flexion
      rotX('ORG-thighR', -legSwing);
      rotX('DEF-thigh02R', -legSwing * 0.35);
      rotX('ORG-shinR', Math.max(0, legSwing * 1.25));
      rotX('DEF-shin02R', Math.max(0, legSwing * 0.45));
      rotX('DEF-footR', -Math.sin(sprintT) * 0.4);

      // Torso leaning forward into an agile sprint
      rotX('DEF-spine', 0.26 + Math.sin(sprintT * 2) * 0.05);
      rotZ('DEF-spine', Math.sin(sprintT) * 0.08);

      const sprintBounce = Math.abs(Math.sin(sprintT)) * 0.06;
      if (defHips) {
        defHips.position.y = (baseRot[defHips.name]?.posY ?? 0) + sprintBounce;
      }
      if (orgHips) {
        orgHips.position.y = (baseRot[orgHips.name]?.posY ?? 0) + sprintBounce;
      }

      // Arms pumping hard in rhythm
      rotX('ORG-upper_armL', -legSwing * 1.15);
      rotX('DEF-upper_arm02L', -legSwing * 1.15);
      rotX('ORG-upper_armR', legSwing * 1.15);
      rotX('DEF-upper_arm02R', legSwing * 1.15);

      // Calavera / Head bobbing energetically while running
      rotY('DEF-head', Math.sin(sprintT * 0.5) * 0.25);
      rotX('DEF-head', Math.sin(sprintT) * 0.15);
    } else {
      // 🎶 SPOOKY SKELETON DANCE / RHYTHMIC GROOVE (Baile animado con zapateo de piernas!)
      const danceT = clock.elapsedTime * 4.4 + animOffset;

      // 1. Calavera / Head dance: energetic tilting, grooving side to side and nodding!
      rotZ('DEF-head', Math.sin(danceT) * 0.38); // Side-to-side groove tilt
      rotY('DEF-head', Math.cos(danceT * 0.5) * 0.48); // Rhythmic turn
      rotX('DEF-head', Math.abs(Math.sin(danceT * 2)) * 0.22); // Head bop / nod

      // 2. Pelvis / Hips: joyful vertical bounce & hip shake to the beat
      const hipBounce = Math.abs(Math.sin(danceT * 2)) * 0.08;
      const hipSway = Math.sin(danceT) * 0.18;
      if (defHips) {
        defHips.position.y = (baseRot[defHips.name]?.posY ?? 0) + hipBounce;
        defHips.rotation.z = (baseRot[defHips.name]?.z ?? 0) + hipSway;
      }
      if (orgHips) {
        orgHips.position.y = (baseRot[orgHips.name]?.posY ?? 0) + hipBounce;
        orgHips.rotation.z = (baseRot[orgHips.name]?.z ?? 0) + hipSway;
      }

      // 3. Spine / Ribcage: funky body wave
      rotZ('DEF-spine', Math.sin(danceT) * 0.2);
      rotX('DEF-spine', Math.sin(danceT * 2) * 0.12);

      // 4. LEGS TAP-DANCE / STEPPING IN PLACE (Movimiento visible y continuo de piernas!)
      const stepL = Math.sin(danceT);
      const stepR = -Math.sin(danceT);

      // Left leg tap / high knee stomp
      rotX('ORG-thighL', stepL * 0.65);
      rotX('DEF-thigh02L', stepL * 0.25);
      rotX('ORG-shinL', Math.max(0, -stepL * 0.95));
      rotX('DEF-shin02L', Math.max(0, -stepL * 0.35));
      rotX('DEF-footL', -stepL * 0.3);

      // Right leg tap / high knee stomp
      rotX('ORG-thighR', stepR * 0.65);
      rotX('DEF-thigh02R', stepR * 0.25);
      rotX('ORG-shinR', Math.max(0, -stepR * 0.95));
      rotX('DEF-shin02R', Math.max(0, -stepR * 0.35));
      rotX('DEF-footR', -stepR * 0.3);

      // 5. Left Arm: raised dancing and waving to the rhythm
      rotZ('ORG-upper_armL', -0.55 + Math.sin(danceT) * 0.35);
      rotZ('DEF-upper_arm02L', -0.55 + Math.sin(danceT) * 0.35);
      rotX('ORG-upper_armL', Math.cos(danceT) * 0.45);
      rotX('DEF-upper_arm02L', Math.cos(danceT) * 0.45);
      rotX('ORG-forearmL', 0.65 + Math.sin(danceT) * 0.35);
      rotX('DEF-forearm01L', 0.65 + Math.sin(danceT) * 0.35);

      // 6. Right Arm (Sword): brandishing sword to the beat in a triumphant groove
      rotZ('ORG-upper_armR', 0.55 - Math.sin(danceT) * 0.35);
      rotZ('DEF-upper_arm02R', 0.55 - Math.sin(danceT) * 0.35);
      rotX('ORG-upper_armR', -0.55 + Math.sin(danceT) * 0.5);
      rotX('DEF-upper_arm02R', -0.55 + Math.sin(danceT) * 0.5);
      rotX('ORG-forearmR', 0.48 + Math.cos(danceT) * 0.4);
      rotX('DEF-forearm01R', 0.48 + Math.cos(danceT) * 0.4);
    }
  });

  return <primitive object={wrapper} />;
};

export const SkeletonModel: React.FC<CharacterProps> = ({
  teamColor = '#a29bfe',
  isMoving = false,
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  // Swarm scale for little skeletons (Clash Royale Skeleton Army style)
  const swarmScale = scale * 0.72;

  return (
    <group>
      {/* Necromantic Shadow Aura on Ground */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.50, 28]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.40, 28]} />
        <meshBasicMaterial color="#2d132c" transparent opacity={0.4} />
      </mesh>

      {/* Leader Small Skeleton (Front Center) */}
      <group position={[0, 0, 0.12]}>
        <SkeletonCharacterModel
          scale={swarmScale * 1.05}
          isMoving={isMoving}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset}
        />
      </group>

      {/* Flank Left Small Skeleton */}
      <group position={[-0.24, 0, -0.14]}>
        <SkeletonCharacterModel
          scale={swarmScale * 0.95}
          isMoving={isMoving}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset + 0.9}
        />
      </group>

      {/* Flank Right Small Skeleton */}
      <group position={[0.24, 0, -0.14]}>
        <SkeletonCharacterModel
          scale={swarmScale * 0.95}
          isMoving={isMoving}
          isAttacking={isPracticing || isAttacking}
          isPracticing={isPracticing}
          animOffset={animOffset + 1.8}
        />
      </group>
    </group>
  );
};

useGLTF.preload('/models/Esqueleto.glb');

// ===========================================================================
// 8. MEDIEVAL KNIGHT (Caballero Pesado con Armadura de Placas Completa y Mandoble)
// ===========================================================================
export const KnightCharacterModel: React.FC<{
  scale?: number;
  isMoving?: boolean;
  isAttacking?: boolean;
  isPracticing?: boolean;
  animOffset?: number;
}> = ({ scale = 1, isMoving = false, isAttacking = false, isPracticing = false, animOffset = 0 }) => {
  const { scene } = useGLTF('/models/Caballero.glb');

  const { wrapper, baseRot, getBone } = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene);
    const boneMap: Record<string, any> = {};

    // 1. Remove duplicate knight rig (Knight_rig.001 / Knight_rig001) so only one knight exists!
    const rig001 = cloned.getObjectByName('Knight_rig001') || cloned.getObjectByName('Knight_rig.001');
    if (rig001) {
      cloned.remove(rig001);
    }

    // 2. Remove floating hair particle cloud and ground plane
    const toRemove: any[] = [];
    cloned.traverse((child) => {
      if (child.name.includes('particle') || child.name === 'Plane' || child.name.includes('Plane')) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((c) => {
      if (c.parent) c.parent.remove(c);
    });

    // 3. Register bones of Knight_rig and set up double-sided rendering for armor plates
    cloned.traverse((child) => {
      if (child.name) {
        boneMap[child.name] = child;
        const noDot = child.name.replace(/\./g, '');
        boneMap[noDot] = child;
        const simple = child.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        boneMap[simple] = child;
      }
      if ((child as ThreeMesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.frustumCulled = false;
        child.visible = true;
        const mesh = child as ThreeMesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((mat: any) => {
            mat.side = 2; // DoubleSide
            mat.needsUpdate = true;
          });
        }
      }
    });

    const resolver = (name: string): any => {
      if (boneMap[name]) return boneMap[name];
      const noDot = name.replace(/\./g, '');
      if (boneMap[noDot]) return boneMap[noDot];
      const simple = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      if (boneMap[simple]) return boneMap[simple];
      return undefined;
    };

    // 4. Attach Longsword firmly into Knight_rig's right hand (Rhand)
    const rig = cloned.getObjectByName('Knight_rig');
    const sword = cloned.getObjectByName('Longsword');
    const rHand = rig ? (rig.getObjectByName('Rhand') || rig.getObjectByName('R.hand')) : (resolver('Rhand') || resolver('R.hand'));

    if (sword && rHand) {
      rHand.add(sword);
      // Place the hilt naturally inside the fist, angled ready in guard
      sword.position.set(0.04, 0.22, 0.02);
      sword.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
      sword.scale.set(0.08, 0.08, 0.08);
    }

    // 5. Centering & Scaling:
    // Knight_rig clean bounds: center X: 6.057, feet bottom Y: -2.803, center Z: 0.396, height: 5.333
    // Offset cloned mesh so feet bottom center sits right on (0, 0, 0):
    cloned.position.set(-6.057, 2.803, -0.396);

    const pivot = new Group();
    pivot.add(cloned);

    const wrap = new Group();
    wrap.add(pivot);

    // Normalize to standard unit height ~1.28
    const normScale = (1.28 / 5.333) * scale;
    wrap.scale.setScalar(normScale);

    // Cache baseline rotations and positions
    const baseRotations: Record<string, { x: number; y: number; z: number; posY: number }> = {};
    cloned.traverse((child) => {
      if (child.name) {
        baseRotations[child.name] = {
          x: child.rotation.x,
          y: child.rotation.y,
          z: child.rotation.z,
          posY: child.position.y,
        };
      }
    });

    return { wrapper: wrap, baseRot: baseRotations, getBone: resolver };
  }, [scene, scale]);

  useFrame(({ clock }) => {
    const rotX = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.x = r.x + delta;
    };
    const rotY = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.y = r.y + delta;
    };
    const rotZ = (name: string, delta: number) => {
      const b = getBone(name);
      if (!b) return;
      const r = baseRot[b.name] || { x: 0, y: 0, z: 0, posY: 0 };
      b.rotation.z = r.z + delta;
    };

    if (isAttacking || isPracticing) {
      // Heavy wide sword slash & cleave
      const attackT = clock.elapsedTime * 9 + animOffset;
      const slash = Math.sin(attackT);

      // Torso twists into the swing
      rotY('spine1', slash * 0.45);
      rotX('spine1', 0.12);

      // Right arm overhead / horizontal greatsword strike
      rotX('Rupperarm', -0.6 + slash * 0.9);
      rotZ('Rupperarm', Math.cos(attackT) * 0.4);
      rotX('Rlowerarm', 0.5 + slash * 0.5);

      // Left arm balance
      rotX('Lupperarm', 0.2 - slash * 0.4);

      // Braced combat stance with legs
      rotX('Lthigh', 0.35);
      rotX('Lshin', 0.25);
      rotX('Rthigh', -0.35);
      rotX('Rshin', 0.2);

      // Head tracks forward target
      rotY('head', -slash * 0.25);
    } else if (isMoving) {
      // Resolute armored stride / running with drawn blade
      const runT = clock.elapsedTime * 10 + animOffset;
      const legStride = Math.sin(runT) * 0.85;

      // Legs alternating strides with knee flexion
      rotX('Lthigh', legStride);
      rotX('Lshin', Math.max(0, -legStride * 1.1));

      rotX('Rthigh', -legStride);
      rotX('Rshin', Math.max(0, legStride * 1.1));

      // Armored torso leaning into charge
      rotX('spine1', 0.18 + Math.sin(runT * 2) * 0.04);
      rotZ('spine1', Math.sin(runT) * 0.06);

      // Arms swinging firmly in pace
      rotX('Lupperarm', -legStride * 0.9);
      rotX('Rupperarm', legStride * 0.7);

      // Head steady forward
      rotY('head', Math.sin(runT * 0.5) * 0.1);
    } else {
      // Noble Guard Stance: Vigilant breathing, shifting weight and looking around
      const idleT = clock.elapsedTime * 2.5 + animOffset;

      // Breathing in heavy plate armor
      rotX('spine1', Math.sin(idleT) * 0.04);

      // Head observing the perimeter
      rotY('head', Math.sin(idleT * 0.6) * 0.25);

      // Sword poised at rest in hand
      rotX('Rupperarm', -0.25 + Math.sin(idleT) * 0.05);
      rotX('Rlowerarm', 0.45);

      // Left arm at side / on hip
      rotZ('Lupperarm', -0.2 + Math.sin(idleT) * 0.04);

      // Subtle weight shift
      rotZ('spine1', Math.sin(idleT * 0.5) * 0.03);
    }
  });

  return <primitive object={wrapper} />;
};

export const KnightModel: React.FC<CharacterProps> = ({
  teamColor = '#74b9ff',
  isMoving = false,
  isAttacking = false,
  isPracticing = false,
  animOffset = 0,
  scale = 1,
}) => {
  return (
    <group>
      {/* Heavy knight shadow base */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 28]} />
        <meshBasicMaterial color={teamColor} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 28]} />
        <meshBasicMaterial color="#1a202c" transparent opacity={0.45} />
      </mesh>

      <KnightCharacterModel
        scale={scale}
        isMoving={isMoving}
        isAttacking={isAttacking}
        isPracticing={isPracticing}
        animOffset={animOffset}
      />
    </group>
  );
};

useGLTF.preload('/models/Caballero.glb');

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
    case 'knight':
      return (
        <KnightModel
          teamColor={teamColor}
          isMoving={isMoving}
          isAttacking={isAttacking}
          isPracticing={isPracticing}
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
    case 'skeletons':
      return (
        <SkeletonModel
          teamColor={teamColor}
          isMoving={isMoving}
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
export const HeroKingModel: React.FC<{ level?: number; scale?: number; isMoving?: boolean }> = ({ level = 1, scale = 1, isMoving = false }) => {
  const capeRef = useRef<Group>(null);
  const swordRef = useRef<Group>(null);
  const auraRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

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
    // Walking leg animation
    if (isMoving) {
      const legSwing = Math.sin(clock.elapsedTime * 7) * 0.45;
      if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
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
        <group key={i} ref={i === 0 ? leftLegRef : rightLegRef} position={[x, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.055, 0.35, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.85} roughness={0.25} />
          </mesh>
          <group position={[0, -0.15, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.075, 0.14, 12]} />
              <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, -0.06, 0.04]} castShadow>
              <sphereGeometry args={[0.07, 10, 8]} />
              <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      ))}

      {/* --- TORSO & ROYAL CUIRASS --- */}
      <group position={[0, 0.62, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.21, 0.17, 0.35, 14]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Golden Lion Crest on Chest */}
        <mesh position={[0, 0.04, 0.135]}>
          <boxGeometry args={[0.16, 0.16, 0.02]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
        </mesh>
        {/* Heavy Golden Shoulder Pauldrons */}
        {[-0.24, 0.24].map((x, i) => (
          <group key={i} position={[x, 0.16, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
            </mesh>
          </group>
        ))}

        {/* --- ROYAL CAPE (Capa de terciopelo real) --- */}
        <group ref={capeRef} position={[0, 0.16, -0.13]}>
          <mesh position={[0, -0.32, 0]} castShadow>
            <boxGeometry args={[0.36, 0.65, 0.02]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#881337')} roughness={0.7} />
          </mesh>
          {/* White Fur Trim on Cape Top */}
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.38, 0.08, 0.04]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#f8fafc')} roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* --- HEAD, BEARD & ROYAL CROWN --- */}
      <group position={[0, 0.95, 0]}>
        {/* Face */}
        <mesh castShadow>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.55} />
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
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
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
                <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
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
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} />
        </mesh>
        {/* Leather Grip */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} />
        </mesh>
        {/* Crown Pommel */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} />
        </mesh>
        {/* Gleaming Steel Blade Planted Downward */}
        <mesh position={[0, -0.22, 0]} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.02]} />
          <meshStandardMaterial
            map={ProceduralTextures.getMetalTexture('steel')}
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

