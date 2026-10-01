import { useMemo } from 'react';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import type { KingdomType } from '../../core/GameState';
import { getKingdomConfig } from '../../config/KingdomsConfig';
import { KingdomDecor, BORDER_HALF } from './KingdomDecor';

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
  const color = colorPalette[Math.min(level, colorPalette.length - 1)];
  const h = 0.6 + Math.min(level, 10) * 0.07;

  return (
    <group>
      {segs.map((s, i) =>
        broken?.has(i) ? (
          <mesh key={i} position={[s.x, 0.1, s.z]}>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color={kingdom === 'frost' ? '#5a6d7c' : kingdom === 'golden' ? '#7a5a32' : '#5a5550'} />
          </mesh>
        ) : (
          <mesh key={i} position={[s.x, h / 2, s.z]} castShadow receiveShadow>
            <boxGeometry args={s.horizontal ? [1.02, h, 0.45] : [0.45, h, 1.02]} />
            <meshStandardMaterial
              color={color}
              roughness={kingdom === 'frost' ? 0.4 : 0.85}
              metalness={kingdom === 'frost' ? 0.2 : 0}
            />
          </mesh>
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
      {/* Outer terrain plane beyond the square boundary */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color={tint || theme.groundColor} roughness={1} />
      </mesh>

      {/* Raised playable battlefield square area inside BORDER_HALF */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <planeGeometry args={[BORDER_HALF * 2, BORDER_HALF * 2]} />
        <meshStandardMaterial color={theme.groundColor} roughness={0.9} />
      </mesh>

      {/* Inner village construction plot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[VILLAGE_HALF * 2 + 1.2, VILLAGE_HALF * 2 + 1.2]} />
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
