import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { BuildingType } from '../../config/BuildingsConfig';
import { ArcherModel, HeroKingModel } from '../common/StylizedCharacters';
import { ProceduralTextures } from '../../core/textures/ProceduralTextures';

// ---------------------------------------------------------------------------
// Helpers: Progressive Tier Calculation (1: Wood/Straw, 2: Wood/Tiles, 3: Stone/Castle, 4: Imperial/Gold)
// ---------------------------------------------------------------------------
export function getBuildingTier(level: number): 1 | 2 | 3 | 4 {
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 7) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Decorative Sub-components (Torches, Chimney Smoke, Windows, Banners)
// ---------------------------------------------------------------------------

/** Flickering Torch with Warm Animated Flame */
const Torch: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => {
  const flameRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (flameRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 16 + position[0] * 5) * 0.18;
      flameRef.current.scale.set(s, s * 1.15, s);
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Wood Stick */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.025, 0.02, 0.35, 5]} />
        <meshStandardMaterial color="#4a2810" roughness={0.9} />
      </mesh>
      {/* Iron Bracket */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.06, 6]} />
        <meshStandardMaterial color="#2d3436" metalness={0.8} />
      </mesh>
      {/* Animated Fire Flame */}
      <mesh ref={flameRef} position={[0, 0.08, 0]}>
        <coneGeometry args={[0.045, 0.12, 6]} />
        <meshStandardMaterial
          color="#ff793f"
          emissive="#ff5252"
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

/** Chimney with Animated Smoke Puff */
const Chimney: React.FC<{ position: [number, number, number]; height?: number }> = ({ position, height = 1.2 }) => {
  const smokeRef = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (smokeRef.current) {
      const t = clock.elapsedTime * 2;
      const s = 1 + Math.sin(t) * 0.2;
      smokeRef.current.scale.set(s, s, s);
      smokeRef.current.position.y = height + 0.15 + Math.sin(t * 0.7) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Stone/Brick Chimney Stack */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[0.42, height, 0.42]} />
        <meshStandardMaterial color="#718093" roughness={0.9} />
      </mesh>
      {/* Chimney Lip */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color="#2f3542" />
      </mesh>
      {/* Animated Smoke Puff */}
      <mesh ref={smokeRef} position={[0, height + 0.15, 0]}>
        <sphereGeometry args={[0.16, 6, 6]} />
        <meshStandardMaterial color="#dcdde1" transparent opacity={0.65} roughness={1} />
      </mesh>
    </group>
  );
};

/** Lit Warm Window with Timber Frame */
const LitWindow: React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; size?: [number, number] }> = ({
  position,
  rotation = [0, 0, 0],
  size = [0.3, 0.4],
}) => (
  <group position={position} rotation={rotation}>
    {/* Frame */}
    <mesh position={[0, 0, -0.01]}>
      <boxGeometry args={[size[0] + 0.06, size[1] + 0.06, 0.03]} />
      <meshStandardMaterial color="#3d2110" />
    </mesh>
    {/* Glowing Glass */}
    <mesh>
      <boxGeometry args={[size[0], size[1], 0.02]} />
      <meshStandardMaterial
        color="#ffa502"
        emissive="#ff7f50"
        emissiveIntensity={0.85}
        roughness={0.3}
      />
    </mesh>
  </group>
);

// ===========================================================================
// 1. TOWNHALL (AYUNTAMIENTO) - 4 Tiers of Epic Progression
// ===========================================================================
const TownhallModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Choza Tribal de Troncos, Paja y Postes
  if (tier === 1) {
    return (
      <group>
        {/* Stone Pebble Foundation */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.2, 3.2]} />
          <meshStandardMaterial map={ProceduralTextures.getCobblestoneTexture()} roughness={0.9} />
        </mesh>
        {/* Rough Log Cabin Walls */}
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.4, 2.7]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
        </mesh>
        {/* Log Corner Posts */}
        {[[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.85, z]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 1.6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.9} />
          </mesh>
        ))}
        {/* Heavy Golden Straw Thatched Roof */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <coneGeometry args={[2.3, 1.5, 4]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d4a373')} roughness={0.9} />
        </mesh>
        {/* Straw Peak Binding */}
        <mesh position={[0, 2.85, 0]}>
          <cylinderGeometry args={[0.2, 0.35, 0.3, 6]} />
          <meshStandardMaterial color="#965a20" />
        </mesh>
        {/* Rough Plank Door */}
        <mesh position={[0, 0.65, 1.36]}>
          <boxGeometry args={[0.85, 1.1, 0.06]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.8} />
        </mesh>
        {/* Tribal Torches flanking door */}
        <Torch position={[-0.7, 0.8, 1.42]} scale={1.2} />
        <Torch position={[0.7, 0.8, 1.42]} scale={1.2} />
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Casa Señorial de Madera Aserrada con Tejas de Barro y Chimenea
  if (tier === 2) {
    return (
      <group>
        {/* Stone Masonry Base */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.5, 3.4]} />
          <meshStandardMaterial map={ProceduralTextures.getCobblestoneTexture()} roughness={0.9} />
        </mesh>
        {/* Finished Timber House Walls */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 1.5, 2.9]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.7} />
        </mesh>
        {/* Timber Post Accents */}
        {[[-1.38, -1.38], [1.38, -1.38], [-1.38, 1.38], [1.38, 1.38]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.2, z]} castShadow>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
          </mesh>
        ))}
        {/* Overhanging Red Terracotta Roof */}
        <mesh position={[0, 2.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.5, 1.5, 4]} />
          <meshStandardMaterial color="#c0392b" roughness={0.6} />
        </mesh>
        {/* Attic Tower & Clock / Bell Cupola */}
        <mesh position={[0, 3.25, 0]} castShadow>
          <boxGeometry args={[1.0, 0.8, 1.0]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.9, 0.8, 4]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
        {/* Brass Bell */}
        <mesh position={[0, 3.3, 0.52]}>
          <cylinderGeometry args={[0.14, 0.2, 0.22, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Chimney with Smoke */}
        <Chimney position={[0.9, 2.0, -0.6]} height={1.4} />
        {/* Oak Door with Iron Rivets */}
        <mesh position={[0, 0.8, 1.46]}>
          <boxGeometry args={[0.9, 1.2, 0.08]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.8} />
        </mesh>
        {/* Lit Windows */}
        <LitWindow position={[-0.85, 1.3, 1.47]} size={[0.35, 0.45]} />
        <LitWindow position={[0.85, 1.3, 1.47]} size={[0.35, 0.45]} />
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Castillo Fortificado de Piedra con 4 Torreones y Almenas
  if (tier === 3) {
    return (
      <group>
        {/* Heavy Stone Foundation */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.6, 0.7, 3.6]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} roughness={0.9} />
        </mesh>
        {/* Central Castle Keep */}
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.9, 2.7]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.8} />
        </mesh>
        {/* 4 Corner Defensive Towers with Battlements */}
        {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            {/* Tower Body */}
            <mesh position={[0, 1.7, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.55, 2.8, 10]} />
              <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.8} />
            </mesh>
            {/* Tower Battlement Balcony */}
            <mesh position={[0, 3.15, 0]} castShadow>
              <cylinderGeometry args={[0.62, 0.52, 0.25, 10]} />
              <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} roughness={0.85} />
            </mesh>
            {/* Blue Slate Conical Roof */}
            <mesh position={[0, 3.85, 0]} castShadow>
              <coneGeometry args={[0.68, 1.25, 10]} />
              <meshStandardMaterial color="#0984e3" roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Central Upper Citadel */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <boxGeometry args={[1.7, 1.3, 1.7]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.7} />
        </mesh>
        {/* Central Royal Blue Pyramid Roof */}
        <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.5, 1.5, 4]} />
          <meshStandardMaterial color="#0984e3" roughness={0.4} />
        </mesh>
        {/* Grand Banner Mast */}
        <mesh position={[0, 4.9, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.8} />
        </mesh>
        {/* Royal Kingdom Flag */}
        <mesh position={[0.3, 5.05, 0]}>
          <boxGeometry args={[0.55, 0.35, 0.02]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#e84118')} />
        </mesh>
        {/* Fortified Castle Gate */}
        <mesh position={[0, 0.95, 1.48]} castShadow>
          <boxGeometry args={[1.1, 1.4, 0.1]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.75} roughness={0.35} />
        </mesh>
        {/* Stone Arch around Gate */}
        <mesh position={[0, 1.7, 1.5]}>
          <boxGeometry args={[1.3, 0.2, 0.15]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} />
        </mesh>
        {/* Royal Crest Shield */}
        <mesh position={[0, 2.05, 1.52]}>
          <boxGeometry args={[0.35, 0.45, 0.05]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Fortaleza Imperial Mítica de Granito Oscuro y Oro Real
  return (
    <group>
      {/* Monumental Obsidian Pedestal */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.9, 3.8]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Gold Inlaid Base Trim */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3.85, 0.1, 3.85]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Central Obsidian Keep */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 2.2, 2.9]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.5} />
      </mesh>
      {/* 4 Corner Colossal Towers with Gold Battlements */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.56, 0.62, 3.6, 12]} />
            <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.6} />
          </mesh>
          {/* Gold Battlement Crown */}
          <mesh position={[0, 4.05, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.58, 0.35, 12]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Deep Crimson Imperial Spire */}
          <mesh position={[0, 4.9, 0]} castShadow>
            <coneGeometry args={[0.65, 1.5, 12]} />
            <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Golden Finial on Spires */}
          <mesh position={[0, 5.75, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Upper Royal Penthouse */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[1.9, 1.4, 1.9]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} />
      </mesh>
      {/* Grand Golden Dome */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <sphereGeometry args={[1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Imperial Crown Spire */}
      <mesh position={[0, 5.6, 0]}>
        <coneGeometry args={[0.18, 0.9, 8]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} />
      </mesh>
      {/* Colossal Reinforced Gold Gate */}
      <mesh position={[0, 1.15, 1.55]} castShadow>
        <boxGeometry args={[1.25, 1.6, 0.12]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Grand Lion Guardians beside Gate */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.8, 1.65]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.65, 0.35]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// 3D ANIMATED MINER WORKER (TRABAJADORES DE LA MINA)
// ---------------------------------------------------------------------------
export const MinerWorker: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  stamina?: number; // 0 - 100
  role?: 'digger' | 'hauler';
}> = ({ position, rotation = [0, 0, 0], scale = 0.52, stamina = 100, role = 'digger' }) => {
  const armRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const sweatRef = useRef<Group>(null);
  const isFatigued = stamina < 30;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (isFatigued) {
      // Sitting down / wiping sweat from brow / breathing heavily
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(t * 2) * 0.12 + 0.25;
        headRef.current.rotation.z = Math.sin(t * 1.5) * 0.08;
      }
      if (armRef.current) {
        armRef.current.rotation.x = 0.35 + Math.sin(t * 2) * 0.1;
        armRef.current.rotation.z = 0.3;
      }
      if (sweatRef.current) {
        sweatRef.current.position.y = 0.8 + Math.sin(t * 3) * 0.04;
      }
    } else {
      // Energetic active mining
      if (armRef.current) {
        if (role === 'digger') {
          // Dynamic pickaxe swing
          const swing = Math.sin(t * 4);
          armRef.current.rotation.x = -0.7 + swing * 1.4;
          armRef.current.rotation.z = -0.15;
        } else {
          // Hauler checking gold / lifting cart
          armRef.current.rotation.x = -0.2 + Math.sin(t * 2) * 0.25;
        }
      }
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(t * 4) * 0.12;
      }
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* If fatigued: wooden stool to sit on and sweat drop indicator */}
      {isFatigued && (
        <>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.32, 6]} />
            <meshStandardMaterial color="#5a422d" roughness={0.9} />
          </mesh>
          <group ref={sweatRef} position={[0.22, 0.8, 0]}>
            <mesh>
              <sphereGeometry args={[0.06, 6, 6]} />
              <meshStandardMaterial color="#00d2d3" emissive="#54a0ff" emissiveIntensity={0.8} transparent opacity={0.85} />
            </mesh>
          </group>
        </>
      )}

      {/* Miner Character Body */}
      <group position={[0, isFatigued ? 0.24 : 0.38, 0]}>
        {/* Legs / Boots */}
        <mesh position={[-0.1, -0.2, isFatigued ? 0.12 : 0]} castShadow>
          <boxGeometry args={[0.12, 0.26, 0.14]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.2, isFatigued ? 0.12 : 0]} castShadow>
          <boxGeometry args={[0.12, 0.26, 0.14]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
        </mesh>

        {/* Torso & Miner Apron */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.3, 0.32, 0.22]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#34495e')} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.07, 0.115]}>
          <boxGeometry args={[0.22, 0.26, 0.02]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.85} />
        </mesh>

        {/* Left Arm */}
        <group position={[-0.2, 0.12, 0]}>
          <mesh position={[0, -0.12, 0]} rotation={[0.2, 0, 0.2]} castShadow>
            <boxGeometry args={[0.09, 0.26, 0.09]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d35400')} />
          </mesh>
          <mesh position={[0.02, -0.25, 0.04]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} />
          </mesh>
        </group>

        {/* Right Arm (Picks or tools) */}
        <group ref={armRef} position={[0.2, 0.14, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <boxGeometry args={[0.09, 0.26, 0.09]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d35400')} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} />
          </mesh>

          {/* Pickaxe Tool */}
          <group position={[0, -0.25, 0.1]} rotation={[isFatigued ? 0.3 : 0.6, 0, 0]}>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.55, 5]} />
              <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <coneGeometry args={[0.06, 0.42, 5]} />
              <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.85} roughness={0.25} />
            </mesh>
          </group>
        </group>

        {/* Head & Miner Helmet with Lamp */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.22, 0.2]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.26, 0.1, 0.24]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} color="#e67e22" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.07, 0.08]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.26, 0.03, 0.12]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} />
          </mesh>
          {/* Headlamp */}
          <mesh position={[0, 0.14, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.03, 0.06, 6]} />
            <meshStandardMaterial color="#f1c40f" emissive="#f39c12" emissiveIntensity={isFatigued ? 0.2 : 0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ===========================================================================
// 2. GOLD MINE (MINA DE ORO) - 4 Tiers with Living Animated Miners
// ===========================================================================
const GoldmineModel: React.FC<{ level: number; stamina?: number }> = ({ level, stamina = 100 }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Pozo de excavación artesanal con vigas, pepitas y Minero
  if (tier === 1) {
    return (
      <group>
        {/* Dirt Mound */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <coneGeometry args={[1.2, 0.7, 7]} />
          <meshStandardMaterial color="#7f5326" roughness={1.0} />
        </mesh>
        {/* Mine Pit Opening */}
        <mesh position={[0, 0.35, 0.5]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.5, 8]} />
          <meshStandardMaterial color="#1a1107" roughness={1} />
        </mesh>
        {/* Timber A-Frame Hoist */}
        {[-0.4, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0.75, 0.5]} rotation={[0, 0, (i ? -1 : 1) * 0.2]} castShadow>
            <boxGeometry args={[0.08, 1.0, 0.08]} />
            <meshStandardMaterial color="#5a3d1c" />
          </mesh>
        ))}
        {/* Crossbeam */}
        <mesh position={[0, 1.2, 0.5]}>
          <boxGeometry args={[0.9, 0.08, 0.08]} />
          <meshStandardMaterial color="#5a3d1c" />
        </mesh>
        {/* Small gold nuggets on ground */}
        {[[-0.5, 0.8], [0.6, 0.7], [-0.2, 0.9]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.1, z]} castShadow>
            <dodecahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {/* Animated Miner Worker */}
        <MinerWorker position={[0.42, 0, 0.65]} rotation={[0, -0.6, 0]} stamina={stamina} role="digger" />
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Mina con Galería de Vigas, Vagoneta de Oro y Cuadrilla de Mineros
  if (tier === 2) {
    return (
      <group>
        {/* Rock/Dirt Hill */}
        <mesh position={[0, 0.7, -0.2]} castShadow receiveShadow>
          <coneGeometry args={[1.35, 1.5, 6]} />
          <meshStandardMaterial color="#5a4d41" roughness={0.9} />
        </mesh>
        {/* Timber Mine Entrance Frame */}
        <group position={[0, 0.65, 0.55]}>
          {/* Top Beam */}
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.1, 0.16, 0.3]} />
            <meshStandardMaterial color="#4a2810" />
          </mesh>
          {/* Side Posts */}
          {[-0.45, 0.45].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 1.2, 0.3]} />
              <meshStandardMaterial color="#4a2810" />
            </mesh>
          ))}
          {/* Dark Mine Shaft */}
          <mesh position={[0, 0, -0.1]}>
            <boxGeometry args={[0.75, 1.0, 0.2]} />
            <meshStandardMaterial color="#0a0705" />
          </mesh>
        </group>
        {/* Wooden Minecart overflowing with Gold */}
        <group position={[0.55, 0.28, 0.7]} rotation={[0, -0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.35, 0.35]} />
            <meshStandardMaterial color="#6a3b1a" />
          </mesh>
          {/* Shiny Gold Ore in Cart */}
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.2, 6, 6]} />
            <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.3} />
          </mesh>
        </group>
        <Torch position={[-0.55, 0.9, 0.7]} scale={0.9} />
        {/* Miners at work */}
        <MinerWorker position={[-0.45, 0, 0.7]} rotation={[0, 0.5, 0]} stamina={stamina} role="digger" />
        <MinerWorker position={[0.2, 0, 0.82]} rotation={[0, -0.8, 0]} stamina={stamina} role="hauler" />
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Complejo de Extracción y Fundición con Grúa, Lingotes y Mineros
  if (tier === 3) {
    return (
      <group>
        {/* Stone Fortified Mine Entrance */}
        <mesh position={[0, 0.8, -0.2]} castShadow receiveShadow>
          <coneGeometry args={[1.4, 1.7, 8]} />
          <meshStandardMaterial color="#485460" roughness={0.8} />
        </mesh>
        <group position={[0, 0.7, 0.5]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[1.3, 1.4, 0.4]} />
            <meshStandardMaterial color="#718093" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.1, 0.15]}>
            <boxGeometry args={[0.85, 1.1, 0.2]} />
            <meshStandardMaterial color="#1e272e" />
          </mesh>
        </group>
        {/* Smelting Chimney with Smoke */}
        <Chimney position={[-0.8, 1.0, -0.4]} height={1.3} />
        {/* Iron Minecart with Pure Gold Bars */}
        <group position={[0.65, 0.32, 0.65]}>
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.36, 0.4]} />
            <meshStandardMaterial color="#2f3542" metalness={0.7} />
          </mesh>
          {/* Stacked Gold Bars */}
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.42, 0.18, 0.3]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#f39c12" emissiveIntensity={0.4} />
          </mesh>
        </group>
        {/* Miners at work */}
        <MinerWorker position={[-0.48, 0, 0.72]} rotation={[0, 0.45, 0]} stamina={stamina} role="digger" />
        <MinerWorker position={[0.25, 0, 0.8]} rotation={[0, -0.7, 0]} stamina={stamina} role="hauler" />
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Gran Bóveda de Oro Imperial con Mineros de Élite
  return (
    <group>
      {/* Obsidian & Marble Mine Mountain */}
      <mesh position={[0, 0.9, -0.2]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 1.9, 10]} />
        <meshStandardMaterial color="#2d3436" roughness={0.7} />
      </mesh>
      {/* Golden Vault Portal */}
      <group position={[0, 0.85, 0.55]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 1.6, 0.45]} />
          <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.1, 0.15]}>
          <boxGeometry args={[0.95, 1.2, 0.2]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>
      {/* Huge Piles of Gold Bars & Treasure Chests */}
      {[[-0.7, 0.75], [0.75, 0.75], [0, 1.05]].map(([x, z], i) => (
        <group key={i} position={[x, 0.22, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.25, 0.35]} />
            <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} emissive="#f1c40f" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      {/* Imperial Miners */}
      <MinerWorker position={[-0.45, 0, 0.8]} rotation={[0, 0.5, 0]} stamina={stamina} role="digger" />
      <MinerWorker position={[0.45, 0, 0.8]} rotation={[0, -0.5, 0]} stamina={stamina} role="hauler" />
    </group>
  );
};

// ===========================================================================
// 2B. FARM & WINDMILL (GRANJA Y MOLINO) - 4 Tiers of Agriculture & Food Production
// ===========================================================================

export const FarmerWorker: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  role?: 'hoe' | 'basket';
}> = ({ position, rotation = [0, 0, 0], scale = 0.52, role = 'hoe' }) => {
  const armRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (role === 'hoe') {
      const swing = Math.sin(t * 3.5);
      if (armRef.current) {
        armRef.current.rotation.x = -0.5 + swing * 0.9;
      }
      if (headRef.current) {
        headRef.current.rotation.x = 0.2 + Math.sin(t * 3.5) * 0.12;
      }
    } else {
      if (armRef.current) {
        armRef.current.rotation.x = -0.4 + Math.sin(t * 2) * 0.1;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.2;
      }
    }
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 0.38, 0]}>
        {/* Legs / Boots */}
        <mesh position={[-0.1, -0.2, 0]} castShadow>
          <boxGeometry args={[0.11, 0.26, 0.13]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.2, 0]} castShadow>
          <boxGeometry args={[0.11, 0.26, 0.13]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('dark')} roughness={0.8} />
        </mesh>

        {/* Torso: Peasant Tunic & Belt */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.28, 0.32, 0.2]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#4d6b38')} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.29, 0.05, 0.21]} />
          <meshStandardMaterial map={ProceduralTextures.getLeatherTexture('brown')} roughness={0.85} />
        </mesh>

        {/* Left Arm */}
        <group position={[-0.19, 0.12, 0]}>
          <mesh position={[0, -0.12, 0]} rotation={[0.2, 0, 0.1]} castShadow>
            <boxGeometry args={[0.08, 0.26, 0.08]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#556b2f')} />
          </mesh>
          <mesh position={[0, -0.25, 0.02]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.65} />
          </mesh>
        </group>

        {/* Right Arm with Hoe or Basket */}
        <group ref={armRef} position={[0.19, 0.14, 0]}>
          <mesh position={[0, -0.12, 0]} castShadow>
            <boxGeometry args={[0.08, 0.26, 0.08]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#556b2f')} />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <sphereGeometry args={[0.055, 6, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.65} />
          </mesh>

          {role === 'hoe' ? (
            <group position={[0, -0.24, 0.1]} rotation={[0.4, 0, 0]}>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.018, 0.018, 0.65, 5]} />
                <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.36, 0.06]} rotation={[0.5, 0, 0]} castShadow>
                <boxGeometry args={[0.16, 0.06, 0.03]} />
                <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} roughness={0.4} metalness={0.8} />
              </mesh>
            </group>
          ) : (
            <group position={[0, -0.2, 0.15]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.16, 0.12, 0.22, 8]} />
                <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.9} />
              </mesh>
              <mesh position={[0, 0.09, 0]}>
                <sphereGeometry args={[0.14, 6, 6]} />
                <meshStandardMaterial color="#f1c40f" roughness={0.7} />
              </mesh>
            </group>
          )}
        </group>

        {/* Head & Peasant Straw Hat */}
        <group ref={headRef} position={[0, 0.32, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.22, 0.2]} />
            <meshStandardMaterial map={ProceduralTextures.getSkinTexture('warm')} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.1, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d4a373')} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#d4a373')} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

const WindmillSails: React.FC<{ position: [number, number, number]; scale?: number; sailColor?: string }> = ({
  position,
  scale = 1,
  sailColor = '#f5f6fa',
}) => {
  const sailsRef = useRef<Group>(null);
  useFrame((_, dt) => {
    if (sailsRef.current) {
      sailsRef.current.rotation.z += dt * 1.5;
    }
  });

  return (
    <group position={position} scale={scale}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.18, 8]} />
        <meshStandardMaterial color="#3e2712" />
      </mesh>
      <group ref={sailsRef} position={[0, 0, 0.1]}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
          <group key={i} rotation={[0, 0, angle]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[0.04, 1.1, 0.03]} />
              <meshStandardMaterial color="#5a3d1c" />
            </mesh>
            <mesh position={[0.09, 0.65, 0.015]} castShadow>
              <planeGeometry args={[0.16, 0.8]} />
              <meshStandardMaterial color={sailColor} roughness={0.9} side={2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

const FarmModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Huerto Rústico y Choza de Grano
  if (tier === 1) {
    return (
      <group>
        {/* Soil plot */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[2.2, 0.15, 2.0]} />
          <meshStandardMaterial color="#4a2f18" roughness={1.0} />
        </mesh>
        {/* Small grain shed */}
        <group position={[-0.55, 0.45, -0.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.7, 0.8]} />
            <meshStandardMaterial color="#7a5229" />
          </mesh>
          {/* Thatch roof */}
          <mesh position={[0, 0.45, 0]} rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.75, 0.5, 4]} />
            <meshStandardMaterial color="#d4a373" roughness={0.9} />
          </mesh>
        </group>
        {/* Wheat crop rows */}
        {[-0.3, 0.1, 0.5].map((z, row) =>
          [0.2, 0.5, 0.8].map((x, col) => (
            <mesh key={`${row}-${col}`} position={[x, 0.3, z]} castShadow>
              <coneGeometry args={[0.1, 0.35, 5]} />
              <meshStandardMaterial color="#f1c40f" roughness={0.8} />
            </mesh>
          ))
        )}
        {/* Wooden fence posts */}
        {[-0.9, 0, 0.9].map((x, i) => (
          <mesh key={i} position={[x, 0.25, 0.9]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 5]} />
            <meshStandardMaterial color="#5a3d1c" />
          </mesh>
        ))}
        {/* Active Farmer hoeing the wheat */}
        <FarmerWorker position={[0.45, 0, 0.1]} rotation={[0, -0.6, 0]} role="hoe" />
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Molino de Madera Holandés con Aspas y Trigales Dorados
  if (tier === 2) {
    return (
      <group>
        {/* Farm plot soil pad */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[2.3, 0.15, 2.2]} />
          <meshStandardMaterial color="#5a3c1c" roughness={0.9} />
        </mesh>
        {/* Wooden Windmill Tower */}
        <group position={[-0.45, 0.9, -0.35]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.6, 1.6, 8]} />
            <meshStandardMaterial color="#8a5a2e" roughness={0.8} />
          </mesh>
          {/* Conical cap */}
          <mesh position={[0, 0.95, 0]} castShadow>
            <coneGeometry args={[0.5, 0.5, 8]} />
            <meshStandardMaterial color="#5c3818" />
          </mesh>
          {/* Rotating Windmill Sails */}
          <WindmillSails position={[0, 0.7, 0.55]} scale={1.0} />
        </group>
        {/* Flour sacks */}
        {[[0.3, 0.5], [0.6, 0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.2, z]} castShadow>
            <capsuleGeometry args={[0.1, 0.18, 4, 8]} />
            <meshStandardMaterial color="#ecf0f1" roughness={0.8} />
          </mesh>
        ))}
        {/* Golden wheat patch */}
        {[-0.2, 0.1, 0.4].map((z, row) =>
          [0.4, 0.7].map((x, col) => (
            <mesh key={`${row}-${col}`} position={[x, 0.35, z]} castShadow>
              <coneGeometry args={[0.12, 0.45, 6]} />
              <meshStandardMaterial color="#f1c40f" emissive="#d4ac0d" emissiveIntensity={0.2} />
            </mesh>
          ))
        )}
        {/* Farmers working */}
        <FarmerWorker position={[0.5, 0, -0.2]} rotation={[0, -0.5, 0]} role="hoe" />
        <FarmerWorker position={[0.1, 0, 0.6]} rotation={[0, 0.8, 0]} role="basket" />
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Molino de Piedra Medieval, Silo de Granos y Panadería
  if (tier === 3) {
    return (
      <group>
        {/* Cobblestone & soil foundation */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.15, 2.3]} />
          <meshStandardMaterial color="#474747" roughness={0.8} />
        </mesh>
        {/* Stone Windmill Tower */}
        <group position={[-0.45, 1.1, -0.3]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.48, 0.68, 2.0, 10]} />
            <meshStandardMaterial color="#7f8c8d" roughness={0.7} />
          </mesh>
          {/* Shingled Dome Roof */}
          <mesh position={[0, 1.15, 0]} castShadow>
            <coneGeometry args={[0.58, 0.6, 10]} />
            <meshStandardMaterial color="#881337" roughness={0.5} />
          </mesh>
          {/* Rotating Windmill Sails */}
          <WindmillSails position={[0, 0.85, 0.6]} scale={1.15} sailColor="#f8fafc" />
        </group>
        {/* Stone Grain Silo */}
        <group position={[0.55, 0.8, -0.45]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.35, 0.35, 1.4, 8]} />
            <meshStandardMaterial color="#95a5a6" />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <coneGeometry args={[0.4, 0.4, 8]} />
            <meshStandardMaterial color="#2d3436" />
          </mesh>
        </group>
        {/* Chimney bakery */}
        <Chimney position={[-0.85, 0.8, 0.5]} height={1.1} />
        {/* Flour Cart */}
        <group position={[0.4, 0.25, 0.55]} rotation={[0, -0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.3, 0.35]} />
            <meshStandardMaterial color="#6a3b1a" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.18, 6, 6]} />
            <meshStandardMaterial color="#ecf0f1" />
          </mesh>
        </group>
        {/* Active Farmers */}
        <FarmerWorker position={[-0.3, 0, 0.7]} rotation={[0, 0.4, 0]} role="hoe" />
        <FarmerWorker position={[0.65, 0, 0.1]} rotation={[0, -0.9, 0]} role="basket" />
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Finca Imperial de Cosecha Dorada con Gran Silo de Mármol
  return (
    <group>
      {/* Marble foundation */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[2.5, 0.18, 2.4]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.6} />
      </mesh>
      {/* Imperial Windmill */}
      <group position={[-0.5, 1.25, -0.3]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.52, 0.72, 2.3, 12]} />
          <meshStandardMaterial color="#f1f2f6" roughness={0.4} />
        </mesh>
        {/* Golden Roof */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <coneGeometry args={[0.62, 0.7, 12]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Rotating Golden Sails */}
        <WindmillSails position={[0, 0.95, 0.65]} scale={1.25} sailColor="#fef08a" />
      </group>
      {/* Grand Silo with Golden Dome */}
      <group position={[0.6, 0.95, -0.45]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 1.7, 10]} />
          <meshStandardMaterial color="#dfe4ea" />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.45, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
      {/* Golden wheat crops with glowing harvest aura */}
      {[[-0.2, 0.6], [0.2, 0.7], [0.6, 0.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0.35, z]}>
          <mesh castShadow>
            <coneGeometry args={[0.15, 0.5, 6]} />
            <meshStandardMaterial color="#f1c40f" metalness={0.7} emissive="#f39c12" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
      {/* Imperial Farmers */}
      <FarmerWorker position={[-0.3, 0, 0.75]} rotation={[0, 0.3, 0]} role="hoe" />
      <FarmerWorker position={[0.55, 0, 0.2]} rotation={[0, -0.8, 0]} role="basket" />
    </group>
  );
};

// ===========================================================================
// 3. BARRACKS (CUARTEL MILITAR) - 4 Tiers of Troop Training Camps
// ===========================================================================
const BarracksModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Tienda de Campaña de Reclutas con Diana y Fogata
  if (tier === 1) {
    return (
      <group>
        {/* Dirt Footprint */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[2.5, 0.1, 2.0]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={1} />
        </mesh>
        {/* Canvas Military Tent */}
        <mesh position={[-0.3, 0.75, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.1, 1.4, 4]} />
          <meshStandardMaterial map={ProceduralTextures.getFabricTexture('#c0392b')} roughness={0.8} />
        </mesh>
        {/* Target Dummy for Practice */}
        <group position={[0.7, 0.5, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} />
          </mesh>
          {/* Target Red Bullseye */}
          <mesh position={[0, 0.25, 0.07]}>
            <circleGeometry args={[0.1, 12]} />
            <meshBasicMaterial color="#e74c3c" />
          </mesh>
        </group>
        {/* Weapon Rack */}
        <group position={[0.7, 0.35, -0.5]}>
          <mesh>
            <boxGeometry args={[0.1, 0.6, 0.5]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Barracón de Madera con Techo de Tejas y Armero
  if (tier === 2) {
    return (
      <group>
        {/* Stone Base */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.4, 2.0]} />
          <meshStandardMaterial map={ProceduralTextures.getCobblestoneTexture()} roughness={0.9} />
        </mesh>
        {/* Timber Barracks Building */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.3, 1.1, 1.7]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.8} />
        </mesh>
        {/* Overhanging Gabled Roof */}
        <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.7, 0.9, 4]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} roughness={0.7} />
        </mesh>
        {/* Reinforced Iron Door */}
        <mesh position={[0, 0.7, 0.86]}>
          <boxGeometry args={[0.7, 1.0, 0.06]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} />
        </mesh>
        {/* Training Swords Mounted Outside */}
        <mesh position={[0.8, 0.9, 0.88]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.05, 0.6, 0.03]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.85} />
        </mesh>
        <Torch position={[-0.8, 0.9, 0.9]} scale={0.9} />
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Cuartel de Piedra Fortificado con Almenas y Blasón
  if (tier === 3) {
    return (
      <group>
        {/* Castle Stone Walls */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 1.8, 2.1]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.8} />
        </mesh>
        {/* Roof Battlements (Almenas) */}
        <mesh position={[0, 1.9, 0]} castShadow>
          <boxGeometry args={[2.75, 0.3, 2.25]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} />
        </mesh>
        {/* Slanted Slate Tower Roof */}
        <mesh position={[0, 2.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.8, 1.0, 4]} />
          <meshStandardMaterial color="#b23b3b" roughness={0.5} />
        </mesh>
        {/* Crossed Swords Coat of Arms */}
        <group position={[0, 1.4, 1.08]}>
          <mesh rotation={[0, 0, 0.7]}>
            <boxGeometry args={[0.06, 0.7, 0.04]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} />
          </mesh>
          <mesh rotation={[0, 0, -0.7]}>
            <boxGeometry args={[0.06, 0.7, 0.04]} />
            <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Gran Academia de Guerra Imperial con Torres y Oro
  return (
    <group>
      {/* Dark Granite War Academy */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 2.0, 2.2]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.6} />
      </mesh>
      {/* Gold Corner Pillars */}
      {[[-1.25, -1.0], [1.25, -1.0], [-1.25, 1.0], [1.25, 1.0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.0, z]} castShadow>
          <boxGeometry args={[0.25, 2.1, 0.25]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
      {/* Imperial Crimson Crown Roof */}
      <mesh position={[0, 2.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.9, 1.3, 4]} />
        <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Golden Eagle Crest */}
      <mesh position={[0, 3.4, 0]}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} />
      </mesh>
    </group>
  );
};

// ===========================================================================
// 4. BLACKSMITH (HERRERÍA DE ARMAS) - 4 Tiers of Forging Might
// ===========================================================================
const BlacksmithModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Forja Rústica con Tocón, Yunque y Carbón Caliente
  if (tier === 1) {
    return (
      <group>
        {/* Dirt Ground */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.1, 2.0]} />
          <meshStandardMaterial color="#3d2110" />
        </mesh>
        {/* Wooden Shed Roof on 4 posts */}
        {[[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.75, z]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.5, 6]} />
            <meshStandardMaterial color="#5a3d1c" />
          </mesh>
        ))}
        <mesh position={[0, 1.55, 0]} castShadow>
          <boxGeometry args={[2.1, 0.15, 1.7]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Tree Stump with Stone Anvil */}
        <group position={[0, 0.4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.35, 0.6, 8]} />
            <meshStandardMaterial color="#4a2810" />
          </mesh>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.45, 0.22, 0.25]} />
            <meshStandardMaterial color="#718093" metalness={0.8} />
          </mesh>
        </group>
        {/* Glowing Charcoal Fire Pit */}
        <mesh position={[-0.6, 0.2, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.3, 8]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
        <mesh position={[-0.6, 0.36, 0]}>
          <sphereGeometry args={[0.2, 6, 6]} />
          <meshStandardMaterial color="#ff5722" emissive="#ff3d00" emissiveIntensity={1.5} />
        </mesh>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Taller de Herrería con Chimenea de Ladrillo y Yunque de Hierro
  if (tier === 2) {
    return (
      <group>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 1.2, 1.8]} />
          <meshStandardMaterial color="#57606f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.6, 0.8, 4]} />
          <meshStandardMaterial color="#474754" />
        </mesh>
        <Chimney position={[0.75, 1.1, -0.5]} height={1.5} />
        {/* Iron Anvil on Porch */}
        <group position={[-0.5, 0.35, 0.95]}>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.3, 0.25]} />
            <meshStandardMaterial color="#2f3542" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* Glowing Furnace Window */}
        <mesh position={[0.1, 0.6, 0.91]}>
          <boxGeometry args={[0.6, 0.6, 0.05]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff4757" emissiveIntensity={1.2} />
        </mesh>
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Gran Forja de Piedra de Sillar con Chimenea Doble y Fuelles
  if (tier === 3) {
    return (
      <group>
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 1.6, 2.0]} />
          <meshStandardMaterial color="#747d8c" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.7, 0.9, 4]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
        <Chimney position={[0.8, 1.4, -0.6]} height={1.6} />
        <Chimney position={[-0.8, 1.4, -0.6]} height={1.6} />
        {/* Large Master Anvil */}
        <group position={[0, 0.45, 1.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.6, 0.4, 0.3]} />
            <meshStandardMaterial color="#1e272e" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Forja Rúnica de Titanes con Magma Resplandeciente y Yunque de Oro
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.8, 2.1]} />
        <meshStandardMaterial color="#1e272e" roughness={0.7} />
      </mesh>
      {/* Glowing Magma Core */}
      <mesh position={[0, 0.6, 1.06]}>
        <boxGeometry args={[1.0, 0.8, 0.08]} />
        <meshStandardMaterial color="#ffa502" emissive="#ff4757" emissiveIntensity={2.0} />
      </mesh>
      {/* Gold Trimmed Roof */}
      <mesh position={[0, 2.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.8, 1.1, 4]} />
        <meshStandardMaterial color="#d63031" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Legendary Golden Anvil */}
      <group position={[0, 0.45, 1.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.65, 0.42, 0.32]} />
          <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 5. CANNON (CAÑÓN DEFENSIVO) - 4 Tiers of Heavy Ballistics
// ===========================================================================
const CannonModel: React.FC<{ level: number; aimAngle?: number }> = ({ level, aimAngle }) => {
  const tier = getBuildingTier(level);
  const lvlTint = Math.min(level, 10) / 10;

  // TIER 1 (Nv 1-2): Cañón de Bronce Rústico sobre Ruedas de Madera
  if (tier === 1) {
    return (
      <group>
        {/* Dirt / Log Stand */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.75, 0.85, 0.24, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.9} />
        </mesh>
        {/* Rotating Carriage */}
        <group position={[0, 0.45, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          {/* Wooden Carriage */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[0.45, 0.25, 0.55]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.8} />
          </mesh>
          {/* Bronze Barrel */}
          <mesh position={[0, 0.06, 0.25]} rotation={[Math.PI / 2 - 0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.17, 0.8, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Cañón de Hierro Fundido sobre Base Giratoria de Piedra
  if (tier === 2) {
    return (
      <group>
        {/* River Stone Circular Foundation */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.4, 10]} />
          <meshStandardMaterial map={ProceduralTextures.getCobblestoneTexture()} roughness={0.9} />
        </mesh>
        {/* Rotating Cannon */}
        <group position={[0, 0.6, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.38, 10, 8]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0.45]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.95, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Cañón Pesado de Doble Anillo sobre Plataforma Acorazada
  if (tier === 3) {
    return (
      <group>
        {/* Fortified Octagonal Stone Mount */}
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 1.0, 0.5, 8]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.8} />
        </mesh>
        {/* Iron Turning Ring */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.08, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.9} />
        </mesh>
        {/* Heavy Double Ringed Gun */}
        <group position={[0, 0.72, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.06, 0.52]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
            <cylinderGeometry args={[0.18 + lvlTint * 0.03, 0.24, 1.15, 10]} />
            <meshStandardMaterial map={ProceduralTextures.getMetalTexture('iron')} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Steel Reinforcement Rings */}
          {[0.3, 0.65].map((z, i) => (
            <mesh key={i} position={[0, 0.06, z]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
              <torusGeometry args={[0.22, 0.03, 6, 12]} />
              <meshStandardMaterial map={ProceduralTextures.getMetalTexture('steel')} metalness={0.95} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Coloso Imperial de Granito Negro con Boca de Dragón y Oro
  return (
    <group>
      {/* Obsidian Platform with Gold Rim */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.6, 12]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.08, 12]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Colossal Cannon */}
      <group position={[0, 0.85, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.46, 14, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.08, 0.6]} rotation={[Math.PI / 2 - 0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 1.3, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getMetalTexture('dark')} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Dragon Mouth Flared Muzzle */}
        <mesh position={[0, 0.15, 1.25]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.2, 0.22, 10]} />
          <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.95} roughness={0.15} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 6. ARCHER TOWER (TORRE DE ARQUERAS) - 4 Tiers with Guarding Archer
// ===========================================================================
const ArcherTowerModel: React.FC<{ level: number; aimAngle?: number }> = ({ level, aimAngle }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Puesto de Vigía de 4 Troncos Atados con Escalera
  if (tier === 1) {
    return (
      <group>
        {/* 4 Rough Log Pillars */}
        {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.1, z]} rotation={[x * 0.1, 0, z * 0.1]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 2.2, 6]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.9} />
          </mesh>
        ))}
        {/* Cross Beams */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.1, 0.08, 1.1]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} />
        </mesh>
        {/* Plank Platform */}
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.15, 1.35]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} roughness={0.8} />
        </mesh>
        {/* Stake Railing */}
        <mesh position={[0, 2.45, 0]}>
          <boxGeometry args={[1.3, 0.35, 1.3]} />
          <meshStandardMaterial color="#5a3d1c" wireframe />
        </mesh>
        {/* Guarding Archer atop platform */}
        <group position={[0, 2.3, 0]} rotation={[0, aimAngle ?? 0, 0]}>
          <ArcherModel teamColor="#2ed573" isAttacking={aimAngle !== undefined} scale={0.7} />
        </group>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Torre de Vigía Feudal de Madera con Tejas
  if (tier === 2) {
    return (
      <group>
        {/* Stone Footing */}
        {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.25, z]} castShadow>
            <boxGeometry args={[0.3, 0.5, 0.3]} />
            <meshStandardMaterial map={ProceduralTextures.getCobblestoneTexture()} />
          </mesh>
        ))}
        {/* Heavy Timber Framing */}
        {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.45, z]} castShadow>
            <boxGeometry args={[0.16, 2.4, 0.16]} />
            <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} />
          </mesh>
        ))}
        {/* Upper Balcony Platform */}
        <mesh position={[0, 2.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.2, 1.5]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('plank')} />
        </mesh>
        {/* Timber Parapet Railing */}
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[1.45, 0.45, 1.45]} />
          <meshStandardMaterial map={ProceduralTextures.getWoodTexture('dark')} />
        </mesh>
        {/* Archer Heroine */}
        <group position={[0, 2.75, 0]} rotation={[0, aimAngle ?? 0, 0]}>
          <ArcherModel teamColor="#2ed573" isAttacking={aimAngle !== undefined} scale={0.72} />
        </group>
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Torre Redonda de Piedra con Almenas de Castillo
  if (tier === 3) {
    return (
      <group>
        {/* Solid Stone Bastion Column */}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.65, 0.78, 2.8, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} roughness={0.8} />
        </mesh>
        {/* Flared Balcony with Stone Battlements */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.65, 0.25, 12]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} />
        </mesh>
        {/* Merlons (Almenas) */}
        <mesh position={[0, 3.15, 0]}>
          <cylinderGeometry args={[0.84, 0.84, 0.4, 12, 1, true]} />
          <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('castle')} />
        </mesh>
        {/* Guarding Archer */}
        <group position={[0, 2.95, 0]} rotation={[0, aimAngle ?? 0, 0]}>
          <ArcherModel teamColor="#2ed573" isAttacking={aimAngle !== undefined} scale={0.75} />
        </group>
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Torreón Imperial de Granito Oscuro y Remates de Oro
  return (
    <group>
      {/* Imperial Dark Column */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.85, 3.2, 14]} />
        <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('obsidian')} roughness={0.7} />
      </mesh>
      {/* Gold Trimmed Balcony */}
      <mesh position={[0, 3.25, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.72, 0.3, 14]} />
        <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Elite Archer Heroine */}
      <group position={[0, 3.4, 0]} rotation={[0, aimAngle ?? 0, 0]}>
        <ArcherModel teamColor="#e84118" isAttacking={aimAngle !== undefined} scale={0.78} />
      </group>
    </group>
  );
};

// ===========================================================================
// 7. ALTAR DE LOS DIOSES - 4 Tiers with Grand Hero King
// ===========================================================================
const AltarModel: React.FC<{ level: number }> = ({ level }) => {
  const crystal = useRef<Group>(null);
  const tier = getBuildingTier(level);

  useFrame((_, dt) => {
    if (crystal.current) crystal.current.rotation.y += dt * 0.9;
  });

  return (
    <group>
      {/* Base Platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.05, 1.15, 0.3, 12]} />
        <meshStandardMaterial color={tier >= 3 ? '#2f3542' : '#7f8c8d'} roughness={0.8} />
      </mesh>
      {/* Stone / Gold Inlaid Pillars */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={i} position={[x, 0.8, -0.45]} castShadow>
          <cylinderGeometry args={[0.1, 0.13, 1.4, 8]} />
          <meshStandardMaterial color={tier === 4 ? '#ffd700' : '#bdc3c7'} metalness={tier === 4 ? 0.9 : 0.2} />
        </mesh>
      ))}
      {/* Floating Hero Crystal */}
      <group ref={crystal} position={[0, 1.6, -0.4]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color={tier === 4 ? '#ffd700' : '#b48cff'}
            emissive={tier === 4 ? '#f39c12' : '#7a4dff'}
            emissiveIntensity={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>
      <pointLight position={[0, 1.6, -0.4]} color={tier === 4 ? '#ffd700' : '#9b6bff'} intensity={2} distance={4} />

      {/* The Grand Hero King */}
      <group position={[0, 0.3, 0.1]}>
        <HeroKingModel level={level} scale={0.85} />
      </group>
    </group>
  );
};

// ===========================================================================
// ===========================================================================
// 8. ARMORY (ARMERÍA) - Distinctive with Hanging Weapons, Armor Mannequin & Crest
// ===========================================================================
const ArmoryModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  return (
    <group>
      {/* Foundation & Base Building */}
      {tier === 1 && (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 1.2, 1.8]} />
            <meshStandardMaterial color="#6a3b1a" roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.6, 0.8, 4]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
        </group>
      )}
      {tier === 2 && (
        <group>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[2.4, 0.4, 2.0]} />
            <meshStandardMaterial color="#636e72" />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 1.1, 1.8]} />
            <meshStandardMaterial color="#2f4f75" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.65, 0.9, 4]} />
            <meshStandardMaterial color="#1e3799" />
          </mesh>
        </group>
      )}
      {tier >= 3 && (
        <group>
          <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.4, 1.6, 2.0]} />
            <meshStandardMaterial color={tier === 4 ? '#1e272e' : '#718093'} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <boxGeometry args={[2.55, 0.25, 2.15]} />
            <meshStandardMaterial color={tier === 4 ? '#ffd700' : '#4a4b4d'} metalness={tier === 4 ? 0.9 : 0.2} />
          </mesh>
          <mesh position={[0, 2.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.75, 1.0, 4]} />
            <meshStandardMaterial color={tier === 4 ? '#0c2461' : '#1e3799'} />
          </mesh>
        </group>
      )}

      {/* --- PROMINENT DISTINCTIVE HALLMARKS --- */}

      {/* 1. GIANT HERALDIC SHIELD ON FRONT FACADE */}
      <group position={[0, 1.55, 0.98]}>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.7, 0.06]} />
          <meshStandardMaterial color="#3867d6" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <boxGeometry args={[0.6, 0.75, 0.05]} />
          <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Golden Cross Emblem */}
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.12, 0.5, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.05, 0.035]}>
          <boxGeometry args={[0.4, 0.12, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. EXTERIOR WEAPON RACK WITH HANGING SWORDS, AXES & HALBERD */}
      <group position={[-1.18, 0.65, 0.1]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Wooden Rack */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 0.8, 0.08]} />
          <meshStandardMaterial color="#4a2810" roughness={0.8} />
        </mesh>
        {/* Hanging Sword */}
        <group position={[-0.25, 0.05, 0.06]} rotation={[0, 0, 0.1]}>
          <mesh>
            <boxGeometry args={[0.04, 0.55, 0.02]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.14, 0.03, 0.03]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
        </group>
        {/* Hanging Battleaxe */}
        <group position={[0, 0.05, 0.06]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.6, 6]} />
            <meshStandardMaterial color="#5a3d1c" />
          </mesh>
          <mesh position={[0.08, 0.18, 0]}>
            <boxGeometry args={[0.15, 0.18, 0.02]} />
            <meshStandardMaterial color="#718093" metalness={0.85} />
          </mesh>
        </group>
        {/* Hanging Spear / Halberd */}
        <group position={[0.25, 0.05, 0.06]} rotation={[0, 0, -0.1]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.65, 6]} />
            <meshStandardMaterial color="#5a3d1c" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <coneGeometry args={[0.04, 0.15, 4]} />
            <meshStandardMaterial color="#dcdde1" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* 3. SUIT OF ARMOR MANNEQUIN BESIDE ENTRANCE */}
      <group position={[0.85, 0.45, 0.95]}>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[0.38, 0.12, 0.38]} />
          <meshStandardMaterial color="#4a2810" />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.32, 0.2]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.26, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.25, 0.11]}>
          <boxGeometry args={[0.14, 0.03, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 9. ARENA (COLISEO DE ENTRENAMIENTO) - Distinctive Dueling Ring with High Flags
// ===========================================================================
const ArenaModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  return (
    <group>
      {/* Outer Circular Arena Barrier */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.45, 0.7, 16, 1, true]} />
        <meshStandardMaterial
          color={tier === 4 ? '#2d3436' : tier >= 3 ? '#718093' : '#8b5a2b'}
          roughness={0.8}
          side={2}
        />
      </mesh>
      {/* Golden Sand Combat Pit */}
      <mesh position={[0, 0.04, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.33, 16]} />
        <meshStandardMaterial color="#f5cd79" roughness={0.9} />
      </mesh>

      {/* --- PROMINENT DISTINCTIVE HALLMARKS --- */}

      {/* 1. TALL TOURNAMENT WAR BANNERS (RED & BLUE) */}
      <group position={[-1.2, 0, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 6]} />
          <meshStandardMaterial color="#3d2110" />
        </mesh>
        {/* Flapping Crimson War Banner */}
        <mesh position={[0, 2.2, 0.35]}>
          <boxGeometry args={[0.02, 0.8, 0.6]} />
          <meshStandardMaterial color="#e84118" />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
      </group>

      <group position={[1.2, 0, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 2.8, 6]} />
          <meshStandardMaterial color="#3d2110" />
        </mesh>
        {/* Flapping Royal Blue War Banner */}
        <mesh position={[0, 2.2, 0.35]}>
          <boxGeometry args={[0.02, 0.8, 0.6]} />
          <meshStandardMaterial color="#0984e3" />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. CENTRAL SPARRING WOODEN DUMMY */}
      <group position={[0, 0.45, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial color="#5a3d1c" />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0.6, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.08]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <sphereGeometry args={[0.14, 8, 8]} />
          <meshStandardMaterial color="#e5b158" />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <coneGeometry args={[0.15, 0.12, 6]} />
          <meshStandardMaterial color="#718093" metalness={0.7} />
        </mesh>
      </group>

      {/* 3. CROSSED TRAINING SWORDS AT ENTRANCE */}
      <group position={[0, 0.6, 1.4]} rotation={[0, 0, 0]}>
        <mesh rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.04, 0.65, 0.02]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, -0.7]}>
          <boxGeometry args={[0.04, 0.65, 0.02]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

// ===========================================================================
// 10. WALL BLOCK (MURO INDIVIDUAL 1x1) - 4 Tiers of Defensive Fortifications
// ===========================================================================
export const WallModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Palisade of sharpened tribal timber posts bound with rope
  if (tier === 1) {
    return (
      <group>
        {/* Dirt foot pad */}
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[0.9, 0.08, 0.9]} />
          <meshStandardMaterial color="#533c2a" roughness={0.95} />
        </mesh>
        {/* 4 Pointed Timber Logs */}
        {[
          [-0.22, -0.22], [0.22, -0.22],
          [-0.22, 0.22], [0.22, 0.22],
        ].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.13, 0.15, 0.82, 6]} />
              <meshStandardMaterial color="#6a3b1a" roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.92, 0]} castShadow>
              <coneGeometry args={[0.13, 0.22, 6]} />
              <meshStandardMaterial color="#4a2810" roughness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Horizontal Crossbeam & binding */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.82, 0.1, 0.82]} />
          <meshStandardMaterial color="#3d2110" />
        </mesh>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Sturdy Carved Stone Block with Iron Brackets
  if (tier === 2) {
    return (
      <group>
        {/* Stone Foundation */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.94, 0.16, 0.94]} />
          <meshStandardMaterial color="#4b4d4f" roughness={0.8} />
        </mesh>
        {/* Main Solid Stone Block */}
        <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.86, 0.72, 0.86]} />
          <meshStandardMaterial color="#7f8c8d" roughness={0.75} />
        </mesh>
        {/* Stone Top Coping */}
        <mesh position={[0, 0.92, 0]} castShadow>
          <boxGeometry args={[0.92, 0.1, 0.92]} />
          <meshStandardMaterial color="#57606f" roughness={0.7} />
        </mesh>
        {/* Iron Corner Brackets */}
        {[[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]}>
            <boxGeometry args={[0.06, 0.5, 0.06]} />
            <meshStandardMaterial color="#2f3542" metalness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Castle Fortress Battlement with Crenellations
  if (tier === 3) {
    return (
      <group>
        {/* Fortress Stone Base */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.96, 0.2, 0.96]} />
          <meshStandardMaterial color="#2f3542" roughness={0.8} />
        </mesh>
        {/* Towering Rampart Body */}
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.84, 0.88]} />
          <meshStandardMaterial color="#57606f" roughness={0.7} />
        </mesh>
        {/* Crenellations (Almenas) on top corners */}
        {[
          [-0.32, -0.32], [0.32, -0.32],
          [-0.32, 0.32], [0.32, 0.32],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.14, z]} castShadow>
            <boxGeometry args={[0.26, 0.22, 0.26]} />
            <meshStandardMaterial color="#353b48" roughness={0.65} />
          </mesh>
        ))}
        {/* Central Embrasures Walkway */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[0.84, 0.06, 0.84]} />
          <meshStandardMaterial color="#2f3542" />
        </mesh>
      </group>
    );
  }

  // TIER 4 (Nv 8+): Imperial Obsidian Monolith with Polished Gold Crest
  return (
    <group>
      {/* Imperial Dark Basalt Pedestal */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.24, 0.98]} />
        <meshStandardMaterial color="#1e272e" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Glossy Obsidian Wall Body */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.88, 0.96, 0.88]} />
        <meshStandardMaterial color="#0f1418" roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Gold Trim Corner Pillars */}
      {[[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.72, z]} castShadow>
          <boxGeometry args={[0.08, 0.98, 0.08]} />
          <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
      {/* Radiant Gold Battlement Crown */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.92, 0.12, 0.92]} />
        <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.2} />
      </mesh>
      {/* 4 Golden Spikes on Top Corners */}
      {[[-0.34, -0.34], [0.34, -0.34], [-0.34, 0.34], [0.34, 0.34]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.38, z]}>
          <coneGeometry args={[0.07, 0.18, 6]} />
          <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.15} />
        </mesh>
      ))}
    </group>
  );
};

// ===========================================================================
// 12. GOLD STORAGE (ALMACÉN DE ORO / CÁMARA ACORAZADA) - 4 TIERS
// ===========================================================================
const GoldStorageModel: React.FC<{ level: number }> = ({ level }) => {
  // TIER 1 (Nv 1-2): Heavy Timber Chest Repository with Piles of Coins and Bullion
  if (level <= 2) {
    return (
      <group>
        {/* Foundation Timber Deck */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.16, 1.75]} />
          <meshStandardMaterial color="#4a2e12" roughness={0.8} />
        </mesh>
        {/* Corner Iron Brackets */}
        {[[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.1, z]}>
            <boxGeometry args={[0.18, 0.2, 0.18]} />
            <meshStandardMaterial color="#2d3436" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}

        {/* Sturdy Wood Strongroom Walls */}
        <mesh position={[0, 0.55, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.8, 1.0]} />
          <meshStandardMaterial color="#795548" roughness={0.7} />
        </mesh>
        {/* Heavy Iron Roof Bars / Cap */}
        <mesh position={[0, 1.0, -0.2]} castShadow>
          <boxGeometry args={[1.5, 0.14, 1.1]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Large Central Treasure Chest (Open Lid) */}
        <group position={[0, 0.35, 0.28]}>
          {/* Chest Body */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.75, 0.45, 0.5]} />
            <meshStandardMaterial color="#5c3813" roughness={0.6} />
          </mesh>
          {/* Iron Strapping */}
          {[-0.26, 0, 0.26].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <boxGeometry args={[0.06, 0.47, 0.52]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
          {/* Open Lid tilted back */}
          <mesh position={[0, 0.35, -0.22]} rotation={[-Math.PI / 3.5, 0, 0]}>
            <boxGeometry args={[0.78, 0.12, 0.52]} />
            <meshStandardMaterial color="#5c3813" roughness={0.6} />
          </mesh>
          {/* Sparkling Gold Heap inside chest */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.66, 0.16, 0.42]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.15} emissive="#b8860b" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* Stacked Gold Bullion Bars on floor */}
        <group position={[-0.55, 0.2, 0.45]}>
          {[
            [0, 0, 0], [0.18, 0, 0], [-0.18, 0, 0],
            [0.09, 0.08, 0], [-0.09, 0.08, 0],
            [0, 0.16, 0]
          ].map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} castShadow>
              <boxGeometry args={[0.15, 0.07, 0.32]} />
              <meshStandardMaterial color="#ffc107" metalness={0.95} roughness={0.18} emissive="#b8860b" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>

        {/* Scattered Gold Coins Pile */}
        <mesh position={[0.5, 0.18, 0.45]}>
          <cylinderGeometry args={[0.3, 0.38, 0.14, 16]} />
          <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.2} emissive="#d97706" emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Fortified Ashlar Stone Vault with Heavy Vault Door
  if (level <= 4) {
    return (
      <group>
        {/* Ashlar Stone Foundation */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.28, 1.85]} />
          <meshStandardMaterial color="#4b5563" roughness={0.8} />
        </mesh>
        {/* Thick Stone Vault Body */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.95, 1.55]} />
          <meshStandardMaterial color="#6b7280" roughness={0.7} />
        </mesh>
        {/* Curved Vault Roof */}
        <mesh position={[0, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 1.58, 20]} />
          <meshStandardMaterial color="#374151" roughness={0.6} />
        </mesh>

        {/* Round Bank Vault Door on Front */}
        <group position={[0, 0.72, 0.79]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.48, 0.48, 0.14, 24]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Golden Locking Wheel */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
            <torusGeometry args={[0.22, 0.04, 12, 24]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Security Grates with Gold Glimmer inside sides */}
        {[-0.8, 0.8].map((x, i) => (
          <group key={i} position={[x, 0.75, 0]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.6, 0.5, 0.08]} />
              <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.6} />
            </mesh>
            {/* Iron Bars */}
            {[-0.2, 0, 0.2].map((z, j) => (
              <mesh key={j} position={[0, 0, z]}>
                <cylinderGeometry args={[0.03, 0.03, 0.55, 8]} />
                <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Corner Golden Finials */}
        {[[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.3, z]}>
            <sphereGeometry args={[0.12, 12, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Citadel Treasury with Octagonal Vault & Overflowing Gold Bars
  if (level <= 7) {
    return (
      <group>
        {/* Massive Granite Foundation */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.32, 1.9]} />
          <meshStandardMaterial color="#374151" roughness={0.6} />
        </mesh>
        {/* Octagonal Heavy Bastion Body */}
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 1.05, 1.1, 8]} />
          <meshStandardMaterial color="#4b5563" roughness={0.5} />
        </mesh>
        {/* Gilded Corbel Cornice */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <cylinderGeometry args={[1.05, 0.95, 0.16, 8]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Crown Dome with Gold Filigree */}
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} emissive="#b8860b" emissiveIntensity={0.3} />
        </mesh>

        {/* Heavy Double Vault Doors */}
        <group position={[0, 0.75, 0.98]}>
          <mesh position={[-0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.38, 0.72, 0.1]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.38, 0.72, 0.1]} />
            <meshStandardMaterial color="#1f2937" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Gold Bars visible through open security hatch */}
          <mesh position={[0, 0.1, -0.05]}>
            <boxGeometry args={[0.3, 0.25, 0.05]} />
            <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} emissive="#d97706" emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* 4 Corner Watch Torches with Golden Fire */}
        {[[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]].map(([x, z], i) => (
          <group key={i} position={[x, 0.4, z]}>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.07, 0.09, 0.8, 8]} />
              <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.85, 0]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <meshStandardMaterial color="#ff9f43" emissive="#ff5e57" emissiveIntensity={1.2} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  // TIER 4 (Nv 8+): Imperial Grand Treasury of Obsidian, Solid Gold Columns & Glowing Arcane Vault
  return (
    <group>
      {/* Imperial Dark Basalt Step Platform */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.98, 0.24, 1.98]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Polished Obsidian Vault Body */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.15, 1.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* 4 Massive Pure Gold Pillars */}
      {[[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.15, 1.35, 16]} />
            <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.12} emissive="#b8860b" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[0.34, 0.14, 0.34]} />
            <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Golden Roof Architrave */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.85, 0.18, 1.85]} />
        <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} emissive="#b8860b" emissiveIntensity={0.35} />
      </mesh>
      {/* Imperial Tiered Golden Pyramid Roof */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <boxGeometry args={[1.45, 0.2, 1.45]} />
        <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.7, 0.45, 4]} />
        <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.1} emissive="#d97706" emissiveIntensity={0.5} />
      </mesh>

      {/* Radiant Floating Arcane Core Orb in the Portal */}
      <mesh position={[0, 0.85, 0.76]}>
        <sphereGeometry args={[0.26, 20, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffea00" emissiveIntensity={1.5} />
      </mesh>
      {/* Rotating Concentric Golden Ring around orb */}
      <mesh position={[0, 0.85, 0.76]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.38, 0.035, 12, 24]} />
        <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.1} />
      </mesh>
    </group>
  );
};

// ===========================================================================
// 13. FOOD STORAGE (GRANERO REAL / SILO DE ALIMENTOS) - 4 TIERS
// ===========================================================================
const FoodStorageModel: React.FC<{ level: number }> = ({ level }) => {
  // TIER 1 (Nv 1-2): Elevated Wooden Crib on Stilts with Thatch Roof, Grain Sacks & Barrels
  if (level <= 2) {
    return (
      <group>
        {/* Dirt and Stone Base */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[1.75, 0.1, 1.75]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>

        {/* 4 Wooden Stilts elevating the granary */}
        {[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.4, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.7, 8]} />
            <meshStandardMaterial color="#795548" roughness={0.8} />
          </mesh>
        ))}

        {/* Elevated Timber Platform */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.12, 1.5]} />
          <meshStandardMaterial color="#8d6e63" roughness={0.7} />
        </mesh>

        {/* Vented Slat Granary Crib */}
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.25, 0.88, 1.25]} />
          <meshStandardMaterial color="#bcaaa4" roughness={0.65} />
        </mesh>
        {/* Thatch Straw Roof */}
        <mesh position={[0, 1.85, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.05, 0.65, 4]} />
          <meshStandardMaterial color="#d4a359" roughness={0.85} />
        </mesh>

        {/* Sacks of Wheat Grain on Ground and Platform */}
        {[
          [-0.45, 0.22, 0.55], [-0.25, 0.22, 0.6], [0.45, 0.22, 0.5],
          [-0.35, 0.92, 0.4], [0.35, 0.92, 0.4]
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0, (i * 0.7), 0]} castShadow>
            <sphereGeometry args={[0.18, 10, 8]} />
            <meshStandardMaterial color="#d7ccc8" roughness={0.9} />
          </mesh>
        ))}

        {/* Grain Barrel with golden wheat spilling out */}
        <group position={[0.55, 0.25, -0.45]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.18, 0.42, 12]} />
            <meshStandardMaterial color="#5d4037" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.05, 12]} />
            <meshStandardMaterial color="#e5a65d" roughness={0.7} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Timber Barn Granary with Hopper Chute, Bread Baskets and Grain Hoist
  if (level <= 4) {
    return (
      <group>
        {/* Stone Footing */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.24, 1.8]} />
          <meshStandardMaterial color="#57606f" roughness={0.8} />
        </mesh>
        {/* Main Granary Barn Body */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.05, 1.4]} />
          <meshStandardMaterial color="#a0522d" roughness={0.7} />
        </mesh>
        {/* Pitched Terracotta Roof */}
        <mesh position={[0, 1.48, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.2, 0.6, 4]} />
          <meshStandardMaterial color="#b33927" roughness={0.65} />
        </mesh>

        {/* Grain Chute / Hopper on Front */}
        <mesh position={[0, 0.55, 0.78]} rotation={[Math.PI / 5, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.5, 0.18]} />
          <meshStandardMaterial color="#6d4c41" roughness={0.6} />
        </mesh>
        {/* Golden wheat spilling in chute */}
        <mesh position={[0, 0.42, 0.85]}>
          <boxGeometry args={[0.36, 0.15, 0.25]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} emissive="#b45309" emissiveIntensity={0.3} />
        </mesh>

        {/* Stack of Grain Sacks */}
        {[-0.6, -0.4, -0.5].map((x, i) => (
          <mesh key={i} position={[x, 0.25 + (i === 2 ? 0.2 : 0), 0.7]} rotation={[0, i * 0.5, 0]} castShadow>
            <sphereGeometry args={[0.18, 10, 8]} />
            <meshStandardMaterial color="#e0d6c3" roughness={0.85} />
          </mesh>
        ))}

        {/* Basket of Baked Bread Loaves */}
        <group position={[0.55, 0.26, 0.7]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.15, 0.2, 10]} />
            <meshStandardMaterial color="#8d6e63" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.12, 0]} scale={[1, 0.6, 0.8]}>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#d49244" roughness={0.7} />
          </mesh>
        </group>
      </group>
    );
  }

  // TIER 3 (Nv 5-7): High-Capacity Fortified Stone Silo with Conical Roof & Grain Warehouse
  if (level <= 7) {
    return (
      <group>
        {/* Foundation Base */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.28, 1.9]} />
          <meshStandardMaterial color="#374151" roughness={0.7} />
        </mesh>
        {/* Large Cylindrical Stone Silo */}
        <mesh position={[-0.32, 0.98, -0.1]} castShadow receiveShadow>
          <cylinderGeometry args={[0.58, 0.62, 1.5, 20]} />
          <meshStandardMaterial color="#64748b" roughness={0.65} />
        </mesh>
        {/* Silo Conical Slate Roof */}
        <mesh position={[-0.32, 1.98, -0.1]} castShadow>
          <coneGeometry args={[0.72, 0.65, 20]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Weather Vane */}
        <mesh position={[-0.32, 2.38, -0.1]}>
          <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Attached Processing Warehouse */}
        <mesh position={[0.42, 0.75, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.95, 1.15]} />
          <meshStandardMaterial color="#854d0e" roughness={0.7} />
        </mesh>
        <mesh position={[0.42, 1.35, 0.15]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.72, 0.45, 4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.6} />
        </mesh>

        {/* Sacks and Crates of Flour */}
        {[
          [0.35, 0.28, 0.78], [0.65, 0.28, 0.72], [0.5, 0.45, 0.75]
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <sphereGeometry args={[0.16, 10, 8]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  // TIER 4 (Nv 8+): Imperial Grand Granary & Provision Vault - Twin Polished Silos & Gold Spires
  return (
    <group>
      {/* Imperial Basalt Foundation */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.98, 0.28, 1.98]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Twin Polished Marble Silos */}
      {[-0.45, 0.45].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.44, 0.48, 1.6, 20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
          {/* Gold Filigree Rings around silos */}
          {[0.6, 1.2, 1.7].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <torusGeometry args={[0.46, 0.03, 10, 24]} />
              <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
          {/* Conical Royal Spire Roof */}
          <mesh position={[0, 2.1, 0]} castShadow>
            <coneGeometry args={[0.56, 0.65, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} emissive="#b45309" emissiveIntensity={0.3} />
          </mesh>
          {/* Golden Wheat Crest Finial */}
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.98} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Enclosed Skybridge Connecting the Silos */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.65]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* Imperial Provision Crates & Golden Sacks */}
      {[
        [-0.3, 0.28, 0.75], [0.3, 0.28, 0.75], [0, 0.28, 0.8]
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshStandardMaterial color="#fef08a" roughness={0.7} emissive="#ca8a04" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

const BUILDING_MODEL_SCALES: Record<BuildingType, number> = {
  townhall: 0.74,
  goldmine: 0.70,
  farm: 0.72,
  goldstorage: 0.72,
  foodstorage: 0.72,
  barracks: 0.70,
  blacksmith: 0.70,
  armory: 0.70,
  arena: 0.70,
  altar: 0.78,
  cannon: 0.80,
  archertower: 0.75,
  wall: 1.0,
};

// MAIN BUILDING MODEL DISPATCHER
// ===========================================================================
export const BuildingModel: React.FC<{
  type: BuildingType;
  level: number;
  aimAngle?: number;
  stamina?: number;
}> = ({ type, level, aimAngle, stamina }) => {
  const scale = BUILDING_MODEL_SCALES[type] || 0.75;

  const renderContent = () => {
    switch (type) {
      case 'townhall':
        return <TownhallModel level={level} />;
      case 'goldmine':
        return <GoldmineModel level={level} stamina={stamina} />;
      case 'farm':
        return <FarmModel level={level} />;
      case 'goldstorage':
        return <GoldStorageModel level={level} />;
      case 'foodstorage':
        return <FoodStorageModel level={level} />;
      case 'barracks':
        return <BarracksModel level={level} />;
      case 'blacksmith':
        return <BlacksmithModel level={level} />;
      case 'cannon':
        return <CannonModel level={level} aimAngle={aimAngle} />;
      case 'archertower':
        return <ArcherTowerModel level={level} aimAngle={aimAngle} />;
      case 'altar':
        return <AltarModel level={level} />;
      case 'armory':
        return <ArmoryModel level={level} />;
      case 'arena':
        return <ArenaModel level={level} />;
      case 'wall':
        return <WallModel level={level} />;
      default:
        return null;
    }
  };

  return (
    <group scale={scale}>
      {renderContent()}
    </group>
  );
};

/** Wooden scaffolding shown while a building is being built or upgraded. */
export const Scaffolding: React.FC<{ size: number }> = ({ size }) => (
  <group>
    {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
      <mesh key={i} position={[x * size * 0.42, 1, z * size * 0.42]}>
        <boxGeometry args={[0.08, 2, 0.08]} />
        <meshStandardMaterial color="#c8a06e" />
      </mesh>
    ))}
    {[0.6, 1.4].map((y, i) => (
      <mesh key={i} position={[0, y, size * 0.42]}>
        <boxGeometry args={[size * 0.84, 0.06, 0.06]} />
        <meshStandardMaterial color="#c8a06e" />
      </mesh>
    ))}
  </group>
);
