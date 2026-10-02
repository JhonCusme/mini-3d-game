import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { BuildingType } from '../../config/BuildingsConfig';
import { ArcherModel, HeroKingModel } from '../common/StylizedCharacters';

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
          <meshStandardMaterial color="#7f8c8d" roughness={0.9} />
        </mesh>
        {/* Rough Log Cabin Walls */}
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.4, 2.7]} />
          <meshStandardMaterial color="#6a3b1a" roughness={0.8} />
        </mesh>
        {/* Log Corner Posts */}
        {[[-1.25, -1.25], [1.25, -1.25], [-1.25, 1.25], [1.25, 1.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.85, z]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 1.6, 6]} />
            <meshStandardMaterial color="#4a2810" roughness={0.9} />
          </mesh>
        ))}
        {/* Heavy Golden Straw Thatched Roof */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <coneGeometry args={[2.3, 1.5, 4]} />
          <meshStandardMaterial color="#e5b158" roughness={0.9} />
        </mesh>
        {/* Straw Peak Binding */}
        <mesh position={[0, 2.85, 0]}>
          <cylinderGeometry args={[0.2, 0.35, 0.3, 6]} />
          <meshStandardMaterial color="#965a20" />
        </mesh>
        {/* Rough Plank Door */}
        <mesh position={[0, 0.65, 1.36]}>
          <boxGeometry args={[0.85, 1.1, 0.06]} />
          <meshStandardMaterial color="#3d2110" />
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
          <meshStandardMaterial color="#636e72" roughness={0.9} />
        </mesh>
        {/* Finished Timber House Walls */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 1.5, 2.9]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
        </mesh>
        {/* Timber Post Accents */}
        {[[-1.38, -1.38], [1.38, -1.38], [-1.38, 1.38], [1.38, 1.38]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.2, z]} castShadow>
            <boxGeometry args={[0.2, 1.5, 0.2]} />
            <meshStandardMaterial color="#4a2810" />
          </mesh>
        ))}
        {/* Overhanging Red Terracotta Roof */}
        <mesh position={[0, 2.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2.5, 1.5, 4]} />
          <meshStandardMaterial color="#d63031" roughness={0.6} />
        </mesh>
        {/* Attic Tower & Clock / Bell Cupola */}
        <mesh position={[0, 3.25, 0]} castShadow>
          <boxGeometry args={[1.0, 0.8, 1.0]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.9, 0.8, 4]} />
          <meshStandardMaterial color="#d63031" />
        </mesh>
        {/* Brass Bell */}
        <mesh position={[0, 3.3, 0.52]}>
          <cylinderGeometry args={[0.14, 0.2, 0.22, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} />
        </mesh>
        {/* Chimney with Smoke */}
        <Chimney position={[0.9, 2.0, -0.6]} height={1.4} />
        {/* Oak Door with Iron Rivets */}
        <mesh position={[0, 0.8, 1.46]}>
          <boxGeometry args={[0.9, 1.2, 0.08]} />
          <meshStandardMaterial color="#2d1a08" />
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
          <meshStandardMaterial color="#4a4b4d" roughness={0.9} />
        </mesh>
        {/* Central Castle Keep */}
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 1.9, 2.7]} />
          <meshStandardMaterial color="#7f8c8d" roughness={0.8} />
        </mesh>
        {/* 4 Corner Defensive Towers with Battlements */}
        {[[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            {/* Tower Body */}
            <mesh position={[0, 1.7, 0]} castShadow>
              <cylinderGeometry args={[0.5, 0.55, 2.8, 10]} />
              <meshStandardMaterial color="#718093" roughness={0.8} />
            </mesh>
            {/* Tower Battlement Balcony */}
            <mesh position={[0, 3.15, 0]} castShadow>
              <cylinderGeometry args={[0.62, 0.52, 0.25, 10]} />
              <meshStandardMaterial color="#4a4b4d" />
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
          <meshStandardMaterial color="#7f8c8d" roughness={0.7} />
        </mesh>
        {/* Central Royal Blue Pyramid Roof */}
        <mesh position={[0, 3.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.5, 1.5, 4]} />
          <meshStandardMaterial color="#0984e3" roughness={0.4} />
        </mesh>
        {/* Grand Banner Mast */}
        <mesh position={[0, 4.9, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
          <meshStandardMaterial color="#2d3436" metalness={0.8} />
        </mesh>
        {/* Royal Kingdom Flag */}
        <mesh position={[0.3, 5.05, 0]}>
          <boxGeometry args={[0.55, 0.35, 0.02]} />
          <meshStandardMaterial color="#e84118" />
        </mesh>
        {/* Fortified Castle Gate */}
        <mesh position={[0, 0.95, 1.48]} castShadow>
          <boxGeometry args={[1.1, 1.4, 0.1]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Stone Arch around Gate */}
        <mesh position={[0, 1.7, 1.5]}>
          <boxGeometry args={[1.3, 0.2, 0.15]} />
          <meshStandardMaterial color="#4a4b4d" />
        </mesh>
        {/* Royal Crest Shield */}
        <mesh position={[0, 2.05, 1.52]}>
          <boxGeometry args={[0.35, 0.45, 0.05]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
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
        <meshStandardMaterial color="#2d3436" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Gold Inlaid Base Trim */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[3.85, 0.1, 3.85]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Central Obsidian Keep */}
      <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.9, 2.2, 2.9]} />
        <meshStandardMaterial color="#1e272e" roughness={0.6} />
      </mesh>
      {/* 4 Corner Colossal Towers with Gold Battlements */}
      {[[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.2, 0]} castShadow>
            <cylinderGeometry args={[0.56, 0.62, 3.6, 12]} />
            <meshStandardMaterial color="#1e272e" roughness={0.7} />
          </mesh>
          {/* Gold Battlement Crown */}
          <mesh position={[0, 4.05, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.58, 0.35, 12]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Deep Crimson Imperial Spire */}
          <mesh position={[0, 4.9, 0]} castShadow>
            <coneGeometry args={[0.65, 1.5, 12]} />
            <meshStandardMaterial color="#c0392b" roughness={0.3} metalness={0.2} />
          </mesh>
          {/* Golden Finial on Spires */}
          <mesh position={[0, 5.75, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ffd700" metalness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Upper Royal Penthouse */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[1.9, 1.4, 1.9]} />
        <meshStandardMaterial color="#1e272e" />
      </mesh>
      {/* Grand Golden Dome */}
      <mesh position={[0, 4.6, 0]} castShadow>
        <sphereGeometry args={[1.3, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Imperial Crown Spire */}
      <mesh position={[0, 5.6, 0]}>
        <coneGeometry args={[0.18, 0.9, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.95} />
      </mesh>
      {/* Colossal Reinforced Gold Gate */}
      <mesh position={[0, 1.15, 1.55]} castShadow>
        <boxGeometry args={[1.25, 1.6, 0.12]} />
        <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Grand Lion Guardians beside Gate */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.8, 1.65]}>
          <mesh castShadow>
            <boxGeometry args={[0.35, 0.65, 0.35]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// ===========================================================================
// 2. GOLD MINE (MINA DE ORO) - 4 Tiers of Industrial & Gold Riches
// ===========================================================================
const GoldmineModel: React.FC<{ level: number }> = ({ level }) => {
  const tier = getBuildingTier(level);

  // TIER 1 (Nv 1-2): Pozo de excavación artesanal con vigas y pepitas de oro
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
      </group>
    );
  }

  // TIER 2 (Nv 3-4): Mina con Galería de Vigas y Vagoneta de Madera con Oro
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
      </group>
    );
  }

  // TIER 3 (Nv 5-7): Complejo de Extracción y Fundición con Grúa y Lingotes
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
      </group>
    );
  }

  // TIER 4 (Nv 8-10): Gran Bóveda de Oro Imperial con Engranajes y Oro Macizo
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
          <meshStandardMaterial color="#5a3d1c" roughness={1} />
        </mesh>
        {/* Canvas Military Tent */}
        <mesh position={[-0.3, 0.75, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.1, 1.4, 4]} />
          <meshStandardMaterial color="#c0392b" roughness={0.8} />
        </mesh>
        {/* Target Dummy for Practice */}
        <group position={[0.7, 0.5, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
            <meshStandardMaterial color="#4a2810" />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
            <meshStandardMaterial color="#f5cd79" />
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
            <meshStandardMaterial color="#5a3d1c" />
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
          <meshStandardMaterial color="#636e72" roughness={0.9} />
        </mesh>
        {/* Timber Barracks Building */}
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.3, 1.1, 1.7]} />
          <meshStandardMaterial color="#b23b3b" roughness={0.8} />
        </mesh>
        {/* Overhanging Gabled Roof */}
        <mesh position={[0, 1.75, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[1.7, 0.9, 4]} />
          <meshStandardMaterial color="#6b3f2a" roughness={0.7} />
        </mesh>
        {/* Reinforced Iron Door */}
        <mesh position={[0, 0.7, 0.86]}>
          <boxGeometry args={[0.7, 1.0, 0.06]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
        {/* Training Swords Mounted Outside */}
        <mesh position={[0.8, 0.9, 0.88]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.05, 0.6, 0.03]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.8} />
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
          <meshStandardMaterial color="#718093" roughness={0.8} />
        </mesh>
        {/* Roof Battlements (Almenas) */}
        <mesh position={[0, 1.9, 0]} castShadow>
          <boxGeometry args={[2.75, 0.3, 2.25]} />
          <meshStandardMaterial color="#4a4b4d" />
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
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
          </mesh>
          <mesh rotation={[0, 0, -0.7]}>
            <boxGeometry args={[0.06, 0.7, 0.04]} />
            <meshStandardMaterial color="#ffd700" metalness={0.8} />
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
        <meshStandardMaterial color="#1e272e" roughness={0.6} />
      </mesh>
      {/* Gold Corner Pillars */}
      {[[-1.25, -1.0], [1.25, -1.0], [-1.25, 1.0], [1.25, 1.0]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.0, z]} castShadow>
          <boxGeometry args={[0.25, 2.1, 0.25]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
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
        <meshStandardMaterial color="#ffd700" metalness={0.95} />
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
          <meshStandardMaterial color="#5a3d1c" roughness={0.9} />
        </mesh>
        {/* Rotating Carriage */}
        <group position={[0, 0.45, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          {/* Wooden Carriage */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[0.45, 0.25, 0.55]} />
            <meshStandardMaterial color="#6a3b1a" />
          </mesh>
          {/* Bronze Barrel */}
          <mesh position={[0, 0.06, 0.25]} rotation={[Math.PI / 2 - 0.15, 0, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.17, 0.8, 8]} />
            <meshStandardMaterial color="#cd6133" metalness={0.7} roughness={0.4} />
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
          <meshStandardMaterial color="#718093" roughness={0.9} />
        </mesh>
        {/* Rotating Cannon */}
        <group position={[0, 0.6, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.38, 10, 8]} />
            <meshStandardMaterial color="#2f3542" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0.45]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.95, 10]} />
            <meshStandardMaterial color="#2f3542" metalness={0.8} roughness={0.3} />
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
          <meshStandardMaterial color="#4a4b4d" roughness={0.8} />
        </mesh>
        {/* Iron Turning Ring */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.08, 12]} />
          <meshStandardMaterial color="#1e272e" metalness={0.9} />
        </mesh>
        {/* Heavy Double Ringed Gun */}
        <group position={[0, 0.72, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial color="#2c3e50" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.06, 0.52]} rotation={[Math.PI / 2 - 0.12, 0, 0]} castShadow>
            <cylinderGeometry args={[0.18 + lvlTint * 0.03, 0.24, 1.15, 10]} />
            <meshStandardMaterial color="#1e272e" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Steel Reinforcement Rings */}
          {[0.3, 0.65].map((z, i) => (
            <mesh key={i} position={[0, 0.06, z]} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
              <torusGeometry args={[0.22, 0.03, 6, 12]} />
              <meshStandardMaterial color="#95a5a6" metalness={0.95} />
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
        <meshStandardMaterial color="#1e272e" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.92, 0.92, 0.08, 12]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Colossal Cannon */}
      <group position={[0, 0.85, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.46, 14, 12]} />
          <meshStandardMaterial color="#ffd700" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.08, 0.6]} rotation={[Math.PI / 2 - 0.1, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 1.3, 12]} />
          <meshStandardMaterial color="#1e272e" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Dragon Mouth Flared Muzzle */}
        <mesh position={[0, 0.15, 1.25]} rotation={[Math.PI / 2 - 0.1, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.2, 0.22, 10]} />
          <meshStandardMaterial color="#ffd700" metalness={0.95} roughness={0.15} />
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
            <meshStandardMaterial color="#5a3d1c" roughness={0.9} />
          </mesh>
        ))}
        {/* Cross Beams */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.1, 0.08, 1.1]} />
          <meshStandardMaterial color="#4a2810" />
        </mesh>
        {/* Plank Platform */}
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.15, 1.35]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
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
            <meshStandardMaterial color="#718093" />
          </mesh>
        ))}
        {/* Heavy Timber Framing */}
        {[[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([x, z], i) => (
          <mesh key={i} position={[x, 1.45, z]} castShadow>
            <boxGeometry args={[0.16, 2.4, 0.16]} />
            <meshStandardMaterial color="#4a2810" />
          </mesh>
        ))}
        {/* Upper Balcony Platform */}
        <mesh position={[0, 2.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.2, 1.5]} />
          <meshStandardMaterial color="#8b5a2b" />
        </mesh>
        {/* Timber Parapet Railing */}
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[1.45, 0.45, 1.45]} />
          <meshStandardMaterial color="#6a3b1a" />
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
          <meshStandardMaterial color="#718093" roughness={0.8} />
        </mesh>
        {/* Flared Balcony with Stone Battlements */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.65, 0.25, 12]} />
          <meshStandardMaterial color="#4a4b4d" />
        </mesh>
        {/* Merlons (Almenas) */}
        <mesh position={[0, 3.15, 0]}>
          <cylinderGeometry args={[0.84, 0.84, 0.4, 12, 1, true]} />
          <meshStandardMaterial color="#718093" />
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
        <meshStandardMaterial color="#1e272e" roughness={0.7} />
      </mesh>
      {/* Gold Trimmed Balcony */}
      <mesh position={[0, 3.25, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.72, 0.3, 14]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
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

// MAIN BUILDING MODEL DISPATCHER
// ===========================================================================
export const BuildingModel: React.FC<{
  type: BuildingType;
  level: number;
  aimAngle?: number;
}> = ({ type, level, aimAngle }) => {
  switch (type) {
    case 'townhall':
      return <TownhallModel level={level} />;
    case 'goldmine':
      return <GoldmineModel level={level} />;
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
    default:
      return null;
  }
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
