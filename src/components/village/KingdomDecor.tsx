import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import type { KingdomVisualTheme } from '../../config/KingdomsConfig';

interface KingdomDecorProps {
    theme: KingdomVisualTheme;
    seed?: number;
}

export const BORDER_HALF = 19.5; // Boundary edge of the playable village valley

// ===========================================================================
// 1. WEATHER PARTICLES (Snow, Sandstorm, Magic Leaves)
// ===========================================================================
const WeatherParticles: React.FC<{ type: 'snow' | 'sand' | 'leaves'; color: string }> = ({ type, color }) => {
    const pointsRef = useRef<Points>(null);
    const count = 180;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 80;
            pos[i * 3 + 1] = Math.random() * 24 + 1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 80;

            if (type === 'snow') {
                spd[i * 3] = (Math.random() - 0.5) * 0.4;
                spd[i * 3 + 1] = -(Math.random() * 1.5 + 1.2);
                spd[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
            } else if (type === 'sand') {
                spd[i * 3] = Math.random() * 2.5 + 1.5;
                spd[i * 3 + 1] = -(Math.random() * 0.6 + 0.2);
                spd[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
            } else {
                spd[i * 3] = (Math.random() - 0.5) * 0.8;
                spd[i * 3 + 1] = -(Math.random() * 0.8 + 0.4);
                spd[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
            }
        }
        return [pos, spd];
    }, [type]);

    useFrame((_, delta) => {
        if (!pointsRef.current) return;
        const geo = pointsRef.current.geometry;
        const posArr = geo.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            posArr[i * 3] += speeds[i * 3] * delta;
            posArr[i * 3 + 1] += speeds[i * 3 + 1] * delta;
            posArr[i * 3 + 2] += speeds[i * 3 + 2] * delta;

            if (posArr[i * 3 + 1] < 0.2) {
                posArr[i * 3 + 1] = 24;
                posArr[i * 3] = (Math.random() - 0.5) * 80;
                posArr[i * 3 + 2] = (Math.random() - 0.5) * 80;
            }
            if (type === 'sand' && posArr[i * 3] > 40) {
                posArr[i * 3] = -40;
            }
        }
        geo.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                color={color}
                size={type === 'snow' ? 0.45 : type === 'sand' ? 0.35 : 0.4}
                transparent
                opacity={0.75}
                depthWrite={false}
            />
        </points>
    );
};

// ===========================================================================
// 2. MAJESTIC 3D MOUNTAIN PEAKS & HILLS
// ===========================================================================

interface MountainPeakProps {
    position: [number, number, number];
    radius: number;
    height: number;
    rotation?: number;
    style: 'ice' | 'desert' | 'forest';
}

/** Majestic mountain peak with multi-layered rocky ridges and snow/sand/moss cap */
const MountainPeak: React.FC<MountainPeakProps> = ({
    position,
    radius,
    height,
    rotation = 0,
    style,
}) => {
    // Color palettes based on kingdom style
    const rockColor = style === 'ice' ? '#3d4d5c' : style === 'desert' ? '#9c6634' : '#424939';
    const midColor = style === 'ice' ? '#5a6d7c' : style === 'desert' ? '#c28542' : '#556b2f';
    const capColor = style === 'ice' ? '#ffffff' : style === 'desert' ? '#e5a952' : '#2d6a22';

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            {/* Mountain Base Body (Rugged faceted cone) */}
            <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
                <coneGeometry args={[radius, height * 0.9, 7]} />
                <meshStandardMaterial color={rockColor} roughness={0.9} flatShading />
            </mesh>
            {/* Mid-elevation Ridge Layer */}
            <mesh position={[0, height * 0.65, 0]} castShadow receiveShadow>
                <coneGeometry args={[radius * 0.68, height * 0.55, 6]} />
                <meshStandardMaterial color={midColor} roughness={0.8} flatShading />
            </mesh>
            {/* Summit Peak Cap (Glistening Snow, Desert Sandstone Crest, or Lush Alpine Peak) */}
            <mesh position={[0, height * 0.86, 0]} castShadow receiveShadow>
                <coneGeometry args={[radius * 0.36, height * 0.3, 5]} />
                <meshStandardMaterial
                    color={capColor}
                    roughness={style === 'ice' ? 0.3 : 0.85}
                    flatShading
                />
            </mesh>
            {/* Secondary Jagged Sub-peak for organic asymmetry */}
            <mesh
                position={[radius * 0.42, height * 0.35, radius * 0.25]}
                rotation={[0.2, 0.4, -0.1]}
                castShadow
            >
                <coneGeometry args={[radius * 0.45, height * 0.55, 5]} />
                <meshStandardMaterial color={rockColor} roughness={0.9} flatShading />
            </mesh>
        </group>
    );
};

// ===========================================================================
// 3. NATURAL VALLEY BORDER FORMATIONS (Organic Rocks & Foothills at Boundary)
// ===========================================================================

interface BorderCliffProps {
    position: [number, number, number];
    scale?: number;
    rotation?: number;
    style: 'ice' | 'desert' | 'forest';
}

/** Organic natural rock bluff marking the perimeter without artificial straight box fences */
const BorderCliff: React.FC<BorderCliffProps> = ({
    position,
    scale = 1,
    rotation = 0,
    style,
}) => {
    const stoneColor = style === 'ice' ? '#4a5d6e' : style === 'desert' ? '#a56f3a' : '#4d483e';
    const topColor = style === 'ice' ? '#ffffff' : style === 'desert' ? '#dfa253' : '#336e28';

    return (
        <group position={position} rotation={[0, rotation, 0]} scale={scale}>
            {/* Main Boulder Base */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <dodecahedronGeometry args={[1.2, 0]} />
                <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
            </mesh>
            {/* Flanking Secondary Rock */}
            <mesh position={[0.85, 0.5, 0.2]} rotation={[0.3, 0.5, 0]} castShadow receiveShadow>
                <dodecahedronGeometry args={[0.85, 0]} />
                <meshStandardMaterial color={stoneColor} roughness={0.95} flatShading />
            </mesh>
            {/* Soft Organic Cap (Snow Crest / Moss Mound / Sand Dune) */}
            <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
                <coneGeometry args={[0.9, 0.65, 5]} />
                <meshStandardMaterial color={topColor} roughness={0.7} flatShading />
            </mesh>
        </group>
    );
};

// ===========================================================================
// 4. NATURAL FLORA (Pines, Palms, Forest Trees)
// ===========================================================================

const SnowyPine: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={scale}>
        <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 1.6, 5]} />
            <meshStandardMaterial color="#3e2723" roughness={1} />
        </mesh>
        <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[1.5, 1.8, 5]} />
            <meshStandardMaterial color="#2d5a52" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 2.15, 0]}>
            <coneGeometry args={[1.52, 0.45, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
        </mesh>
        <mesh position={[0, 2.9, 0]} castShadow>
            <coneGeometry args={[1.15, 1.5, 5]} />
            <meshStandardMaterial color="#35655c" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 3.15, 0]}>
            <coneGeometry args={[1.17, 0.4, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
        </mesh>
    </group>
);

const DesertPalm: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={scale}>
        <mesh position={[0.2, 1.5, 0]} rotation={[0, 0, -0.15]} castShadow>
            <cylinderGeometry args={[0.18, 0.32, 3.0, 6]} />
            <meshStandardMaterial color="#8d5b28" roughness={1} />
        </mesh>
        <group position={[0.5, 3.0, 0]}>
            <mesh rotation={[0.4, 0, 0]} position={[0, 0, 0.7]} castShadow>
                <boxGeometry args={[0.5, 0.1, 1.6]} />
                <meshStandardMaterial color="#4d7c0f" roughness={0.8} flatShading />
            </mesh>
            <mesh rotation={[-0.4, 0, 0]} position={[0, 0, -0.7]} castShadow>
                <boxGeometry args={[0.5, 0.1, 1.6]} />
                <meshStandardMaterial color="#3f6212" roughness={0.8} flatShading />
            </mesh>
            <mesh rotation={[0, 0, 0.4]} position={[0.7, 0, 0]} castShadow>
                <boxGeometry args={[1.6, 0.1, 0.5]} />
                <meshStandardMaterial color="#4d7c0f" roughness={0.8} flatShading />
            </mesh>
            <mesh rotation={[0, 0, -0.4]} position={[-0.7, 0, 0]} castShadow>
                <boxGeometry args={[1.6, 0.1, 0.5]} />
                <meshStandardMaterial color="#3f6212" roughness={0.8} flatShading />
            </mesh>
        </group>
    </group>
);

const ForestTree: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={scale}>
        <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.4, 2.4, 6]} />
            <meshStandardMaterial color="#5c3818" roughness={1} />
        </mesh>
        <mesh position={[0, 3.2, 0]} castShadow>
            <dodecahedronGeometry args={[1.6, 0]} />
            <meshStandardMaterial color="#2e7d32" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.5, 3.8, 0.3]} castShadow>
            <dodecahedronGeometry args={[1.1, 0]} />
            <meshStandardMaterial color="#388e3c" roughness={0.85} flatShading />
        </mesh>
    </group>
);

// ===========================================================================
// MAIN KINGDOM DECOR (Multi-layered Organic Mountain Valley & Skyline)
// ===========================================================================
export const KingdomDecor: React.FC<KingdomDecorProps> = ({ theme }) => {
    const style = theme.mountainStyle;
    const B = BORDER_HALF;

    // 1. Natural Border Cliffs & Boulders surrounding the playable area
    const borderCliffs = useMemo(() => {
        const list: { pos: [number, number, number]; scale: number; rot: number }[] = [];
        const countPerSide = 7;
        const span = B * 2;
        const step = span / countPerSide;

        for (let i = 0; i <= countPerSide; i++) {
            const coord = -B + i * step;
            const jitter1 = Math.sin(i * 1.7) * 0.8;
            const jitter2 = Math.cos(i * 2.3) * 0.8;

            // North boundary (natural rocky ridge)
            list.push({ pos: [coord + jitter1, 0, -B - 0.6 + jitter2], scale: 1.1 + (i % 3) * 0.25, rot: i * 0.9 });
            // South boundary
            list.push({ pos: [coord - jitter2, 0, B + 0.6 + jitter1], scale: 1.1 + ((i + 1) % 3) * 0.25, rot: i * 1.1 });
            // West boundary
            list.push({ pos: [-B - 0.6 + jitter2, 0, coord + jitter1], scale: 1.1 + ((i + 2) % 3) * 0.25, rot: i * 1.3 });
            // East boundary
            list.push({ pos: [B + 0.6 + jitter1, 0, coord - jitter2], scale: 1.1 + (i % 4) * 0.2, rot: i * 0.7 });
        }
        return list;
    }, [B]);

    // 2. Layer 1: Foothills & Midground Mountain Peaks (Radius 26 - 46m)
    const midgroundMountains = useMemo(() => {
        const list: MountainPeakProps[] = [];
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.15;
            const dist = 28 + (i % 4) * 4;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const h = 10 + (i % 5) * 2.5;
            const r = 7 + (i % 3) * 2;
            list.push({ position: [x, 0, z], radius: r, height: h, rotation: i * 0.8, style });
        }
        return list;
    }, [style]);

    // 3. Layer 2: Towering Epic Distant Mountain Range (Radius 50 - 80m, reaching up to 28m high)
    const distantMountains = useMemo(() => {
        const list: MountainPeakProps[] = [];
        const count = 18;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 54 + (i % 3) * 8;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const h = 18 + (i % 4) * 3.5;
            const r = 14 + (i % 3) * 3;
            list.push({ position: [x, 0, z], radius: r, height: h, rotation: i * 1.2, style });
        }
        return list;
    }, [style]);

    // 4. Clusters of Trees nestled along the valley boundary and mountain foothills
    const trees = useMemo(() => {
        const list: { pos: [number, number, number]; scale: number }[] = [];
        const count = 24;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 21 + (i % 3) * 3.5;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            list.push({ pos: [x, 0, z], scale: 0.65 + (i % 3) * 0.25 });
        }
        return list;
    }, []);

    const weatherColor = useMemo(() => {
        if (theme.weatherType === 'snow') return '#ffffff';
        if (theme.weatherType === 'sand') return '#ffda79';
        return '#86efac';
    }, [theme.weatherType]);

    return (
        <group>
            {/* Atmospheric weather particles */}
            <WeatherParticles type={theme.weatherType} color={weatherColor} />

            {/* Natural Valley Border Cliffs (No artificial boxes!) */}
            <group>
                {borderCliffs.map((c, i) => (
                    <BorderCliff
                        key={`b_cliff_${i}`}
                        position={c.pos}
                        scale={c.scale}
                        rotation={c.rot}
                        style={style}
                    />
                ))}
            </group>

            {/* Midground Mountain Peaks & Foothills */}
            <group>
                {midgroundMountains.map((m, i) => (
                    <MountainPeak
                        key={`mid_mtn_${i}`}
                        position={m.position}
                        radius={m.radius}
                        height={m.height}
                        rotation={m.rotation}
                        style={m.style}
                    />
                ))}
            </group>

            {/* Towering Epic Distant Mountain Range */}
            <group>
                {distantMountains.map((m, i) => (
                    <MountainPeak
                        key={`dist_mtn_${i}`}
                        position={m.position}
                        radius={m.radius}
                        height={m.height}
                        rotation={m.rotation}
                        style={m.style}
                    />
                ))}
            </group>

            {/* Natural Flora along the Valley Edge */}
            <group>
                {trees.map((t, i) => {
                    if (style === 'ice') return <SnowyPine key={`tree_${i}`} position={t.pos} scale={t.scale} />;
                    if (style === 'desert') return <DesertPalm key={`tree_${i}`} position={t.pos} scale={t.scale} />;
                    return <ForestTree key={`tree_${i}`} position={t.pos} scale={t.scale} />;
                })}
            </group>
        </group>
    );
};
