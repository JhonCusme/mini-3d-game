import { useMemo } from 'react';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import type { KingdomType } from '../../core/GameState';
import { getKingdomConfig } from '../../config/KingdomsConfig';
import { KingdomDecor } from './KingdomDecor';
import { ProceduralTextures } from '../../core/textures/ProceduralTextures';

export function wallSegments(): { x: number; z: number; horizontal: boolean }[] {
  const segs: { x: number; z: number; horizontal: boolean }[] = [];
  const edge = VILLAGE_HALF + 0.4;
  for (let i = -VILLAGE_HALF; i < VILLAGE_HALF; i++) {
    segs.push({ x: i + 0.5, z: -edge, horizontal: true });
    segs.push({ x: i + 0.5, z: edge, horizontal: true });
    segs.push({ x: -edge, z: i + 0.5, horizontal: false });
    segs.push({ x: edge, z: i + 0.5, horizontal: false });
  }
  return segs;
}

export const Walls: React.FC<{
  level: number;
  broken?: Set<number>;
  kingdom?: KingdomType;
  onClick?: () => void;
}> = ({
  level,
  broken,
  kingdom = 'emerald',
  onClick,
}) => {
  const segs = useMemo(wallSegments, []);

  // When village has no walls yet, show subtle perimeter boundary survey stakes
  if (level <= 0) {
    return (
      <group
        onClick={e => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {segs
          .filter((_, i) => i % 2 === 0)
          .map((s, i) => (
            <group key={i} position={[s.x, 0, s.z]}>
              <mesh position={[0, 0.15, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.05, 0.3, 6]} />
                <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.32, 0]}>
                <coneGeometry args={[0.06, 0.1, 5]} />
                <meshStandardMaterial color="#e74c3c" roughness={0.5} />
              </mesh>
            </group>
          ))}
      </group>
    );
  }

  const isWood = level <= 2;
  const isStone = level >= 3 && level <= 7;
  const isImperial = level >= 8;

  const wallTexture = isWood
    ? ProceduralTextures.getWoodTexture('beam')
    : isImperial
    ? ProceduralTextures.getStoneBrickTexture('obsidian')
    : kingdom === 'frost'
    ? ProceduralTextures.getStoneBrickTexture('dark')
    : ProceduralTextures.getStoneBrickTexture('castle');

  const h = 0.55 + Math.min(level, 10) * 0.08;

  return (
    <group
      onClick={e => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {segs.map((s, i) =>
        broken?.has(i) ? (
          <mesh key={i} position={[s.x, 0.1, s.z]}>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial map={wallTexture} roughness={0.9} />
          </mesh>
        ) : (
          <group key={i} position={[s.x, 0, s.z]}>
            {/* Wall Main Segment */}
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={s.horizontal ? [1.02, h, 0.44] : [0.44, h, 1.02]} />
              <meshStandardMaterial
                map={wallTexture}
                roughness={isImperial ? 0.4 : 0.8}
                metalness={isImperial ? 0.3 : 0}
              />
            </mesh>
            {/* Wall Top Detail: Pointed stakes for wood, coping for stone, gold caps for imperial */}
            {isWood && (
              <mesh position={[0, h + 0.08, 0]} rotation={[s.horizontal ? 0 : Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.18, 0.2, 4]} />
                <meshStandardMaterial map={ProceduralTextures.getWoodTexture('beam')} roughness={0.8} />
              </mesh>
            )}
            {isStone && (
              <mesh position={[0, h + 0.04, 0]}>
                <boxGeometry args={s.horizontal ? [1.04, 0.08, 0.48] : [0.48, 0.08, 1.04]} />
                <meshStandardMaterial map={ProceduralTextures.getStoneBrickTexture('dark')} roughness={0.8} />
              </mesh>
            )}
            {isImperial && (
              <mesh position={[0, h + 0.05, 0]}>
                <boxGeometry args={s.horizontal ? [1.04, 0.1, 0.48] : [0.48, 0.1, 1.04]} />
                <meshStandardMaterial map={ProceduralTextures.getGoldTexture()} metalness={0.9} roughness={0.2} />
              </mesh>
            )}
          </group>
        )
      )}
    </group>
  );
};

/** Ground, village plot, and surrounding 3D mountains & decor for each kingdom. */
export const VillageTerrain: React.FC<{
  showGrid?: boolean;
  seed?: number;
  tint?: string;
  kingdom?: KingdomType;
}> = ({ showGrid, seed = 7, tint, kingdom = 'emerald' }) => {
  const kingdomInfo = getKingdomConfig(kingdom);
  const theme = kingdomInfo.visual;

  return (
    <group>
      {/* Expansive continuous valley terrain with realistic multi-tone grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial
          map={ProceduralTextures.getGrassTexture(tint || theme.groundColor)}
          roughness={0.85}
        />
      </mesh>

      {/* Gentle natural village clearing plot with rich organic soil & meadow texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]} receiveShadow>
        <planeGeometry args={[VILLAGE_HALF * 2 + 0.6, VILLAGE_HALF * 2 + 0.6]} />
        <meshStandardMaterial
          map={ProceduralTextures.getVillagePlotTexture(theme.plotColor)}
          roughness={0.8}
        />
      </mesh>

      {/* Medieval cobblestone & packed dirt path trailing through the village into the mountains */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 14]} receiveShadow>
        <planeGeometry args={[3.2, 16]} />
        <meshStandardMaterial
          map={ProceduralTextures.getCobblestoneTexture()}
          roughness={0.75}
        />
      </mesh>

      {/* Placement Grid */}
      {showGrid && (
        <gridHelper
          args={[VILLAGE_HALF * 2, VILLAGE_HALF * 2, theme.gridColor, theme.gridColor]}
          position={[0, 0.01, 0]}
          material-opacity={0.35}
          material-transparent
        />
      )}

      {/* 3D Mountains, Monoliths, Weather & Flora specific to the chosen kingdom */}
      <KingdomDecor theme={theme} seed={seed} />
    </group>
  );
};
