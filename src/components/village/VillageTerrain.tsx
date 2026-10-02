import { useMemo } from 'react';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import type { KingdomType } from '../../core/GameState';
import { getKingdomConfig } from '../../config/KingdomsConfig';
import { KingdomDecor } from './KingdomDecor';

const WALL_COLORS: Record<KingdomType, string[]> = {
  frost: ['#8ba7bd', '#99b8d1', '#adc9e0', '#b9d5ec', '#cae3f7', '#d9ecfa', '#e5f3fc', '#82cbf5'],
  golden: ['#b88a44', '#c99b52', '#dcae65', '#e8be78', '#f2cd8a', '#fad99b', '#ffe4ad', '#ffd700'],
  emerald: ['#a0784a', '#a0784a', '#9a958c', '#9a958c', '#6b6b75', '#6b6b75', '#6b6b75', '#c9a227'],
};

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

export const Walls: React.FC<{ level: number; broken?: Set<number>; kingdom?: KingdomType }> = ({
  level,
  broken,
  kingdom = 'emerald',
}) => {
  const segs = useMemo(wallSegments, []);
  if (level <= 0) return null;

  const colorPalette = WALL_COLORS[kingdom] || WALL_COLORS.emerald;
  const isWood = level <= 2;
  const isStone = level >= 3 && level <= 7;
  const isImperial = level >= 8;

  const color = isWood
    ? '#6a3b1a'
    : isImperial
      ? '#1e272e'
      : (colorPalette[Math.min(level, colorPalette.length - 1)] || '#718093');

  const h = 0.55 + Math.min(level, 10) * 0.08;

  return (
    <group>
      {segs.map((s, i) =>
        broken?.has(i) ? (
          <mesh key={i} position={[s.x, 0.1, s.z]}>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color={isWood ? '#3d2110' : '#4a4b4d'} />
          </mesh>
        ) : (
          <group key={i} position={[s.x, 0, s.z]}>
            {/* Wall Main Segment */}
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={s.horizontal ? [1.02, h, 0.44] : [0.44, h, 1.02]} />
              <meshStandardMaterial
                color={color}
                roughness={isImperial ? 0.4 : 0.85}
                metalness={isImperial ? 0.3 : 0}
              />
            </mesh>
            {/* Wall Top Detail: Pointed stakes for wood, coping for stone, gold caps for imperial */}
            {isWood && (
              <mesh position={[0, h + 0.08, 0]} rotation={[s.horizontal ? 0 : Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.18, 0.2, 4]} />
                <meshStandardMaterial color="#4a2810" roughness={0.9} />
              </mesh>
            )}
            {isStone && (
              <mesh position={[0, h + 0.04, 0]}>
                <boxGeometry args={s.horizontal ? [1.04, 0.08, 0.48] : [0.48, 0.08, 1.04]} />
                <meshStandardMaterial color="#2f3542" />
              </mesh>
            )}
            {isImperial && (
              <mesh position={[0, h + 0.05, 0]}>
                <boxGeometry args={s.horizontal ? [1.04, 0.1, 0.48] : [0.48, 0.1, 1.04]} />
                <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
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
      {/* Expansive continuous valley terrain extending into the mountains */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={tint || theme.groundColor} roughness={0.95} />
      </mesh>

      {/* Gentle natural village clearing plot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.008, 0]} receiveShadow>
        <planeGeometry args={[VILLAGE_HALF * 2 + 0.6, VILLAGE_HALF * 2 + 0.6]} />
        <meshStandardMaterial color={theme.plotColor} roughness={1} />
      </mesh>

      {/* Natural dirt path trailing through the village into the mountains */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 14]} receiveShadow>
        <planeGeometry args={[3.2, 16]} />
        <meshStandardMaterial color={theme.plotColor} roughness={1} />
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
