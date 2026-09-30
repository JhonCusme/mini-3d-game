import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import { mulberry32 } from '../../core/pvp/PvpBattle';

// Catches model loading errors (e.g. missing .gltf files) and shows a simple fallback instead
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* fallback shown */ }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

type PropTransform = { position: [number, number, number]; rotation: [number, number, number]; scale?: number };

const GltfModel = ({ url, position, rotation, scale = 1 }: PropTransform & { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} position={position} rotation={rotation} scale={scale} receiveShadow castShadow />;
};

const TreeFallback = ({ position, rotation, scale = 1 }: PropTransform) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 1.5, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.45, 3, 6]} />
      <meshStandardMaterial color="#6b4423" roughness={1} />
    </mesh>
    <mesh position={[0, 4.5, 0]} castShadow>
      <icosahedronGeometry args={[2, 0]} />
      <meshStandardMaterial color="#8e5ab8" roughness={0.9} flatShading />
    </mesh>
  </group>
);

const RockFallback = ({ position, rotation, scale = 1 }: PropTransform) => (
  <mesh position={position} rotation={rotation} scale={scale * 1.5} castShadow receiveShadow>
    <dodecahedronGeometry args={[0.8, 0]} />
    <meshStandardMaterial color="#8a8275" roughness={1} flatShading />
  </mesh>
);

const Tree = (p: PropTransform) => (
  <ModelBoundary fallback={<TreeFallback {...p} />}>
    <GltfModel url="/assets/models/tree/jacaranda_tree_4k.gltf" {...p} />
  </ModelBoundary>
);

const Rock = (p: PropTransform) => (
  <ModelBoundary fallback={<RockFallback {...p} />}>
    <GltfModel url="/assets/models/rock/namaqualand_boulder_02_4k.gltf" {...p} />
  </ModelBoundary>
);

const WALL_COLORS = ['#a0784a', '#a0784a', '#9a958c', '#9a958c', '#6b6b75', '#6b6b75', '#6b6b75', '#c9a227'];

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

export const Walls: React.FC<{ level: number; broken?: Set<number> }> = ({ level, broken }) => {
  const segs = useMemo(wallSegments, []);
  if (level <= 0) return null;
  const color = WALL_COLORS[Math.min(level, WALL_COLORS.length - 1)];
  const h = 0.6 + Math.min(level, 10) * 0.07;
  return (
    <group>
      {segs.map((s, i) => broken?.has(i) ? (
        <mesh key={i} position={[s.x, 0.1, s.z]}>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color="#5a5550" />
        </mesh>
      ) : (
        <mesh key={i} position={[s.x, h / 2, s.z]} castShadow receiveShadow>
          <boxGeometry args={s.horizontal ? [1.02, h, 0.45] : [0.45, h, 1.02]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/** Ground, village plot, decor outside the walls. */
export const VillageTerrain: React.FC<{ showGrid?: boolean; seed?: number; tint?: string }> = ({ showGrid, seed = 7, tint = '#6cbf4a' }) => {
  const decor = useMemo(() => {
    const rng = mulberry32(seed);
    const place = (min: number) => {
      for (;;) {
        const x = (rng() - 0.5) * 70, z = (rng() - 0.5) * 70;
        if (Math.max(Math.abs(x), Math.abs(z)) > min) return [x, 0, z] as [number, number, number];
      }
    };
    return {
      trees: Array.from({ length: 26 }, () => ({ position: place(VILLAGE_HALF + 3), rotation: [0, rng() * 6.28, 0] as [number, number, number], scale: 0.35 + rng() * 0.3 })),
      rocks: Array.from({ length: 14 }, () => ({ position: place(VILLAGE_HALF + 2), rotation: [rng() * 3, rng() * 3, rng() * 3] as [number, number, number], scale: 0.3 + rng() * 0.6 })),
    };
  }, [seed]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#4f9a3a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <planeGeometry args={[VILLAGE_HALF * 2 + 1.2, VILLAGE_HALF * 2 + 1.2]} />
        <meshStandardMaterial color={tint} roughness={1} />
      </mesh>
      {showGrid && <gridHelper args={[VILLAGE_HALF * 2, VILLAGE_HALF * 2, '#ffffff', '#ffffff']} position={[0, 0.01, 0]} material-opacity={0.25} material-transparent />}
      <Suspense fallback={null}>
        {decor.trees.map((t, i) => <Tree key={`t${i}`} {...t} />)}
        {decor.rocks.map((r, i) => <Rock key={`r${i}`} {...r} />)}
      </Suspense>
    </group>
  );
};
