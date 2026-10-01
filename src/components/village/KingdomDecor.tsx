import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import type { KingdomVisualTheme } from '../../config/KingdomsConfig';

interface KingdomDecorProps {
    theme: KingdomVisualTheme;
    seed?: number;
}

/** 3D Weather Particle Effect (Snow for Frost, Sand dust for Desert, Magic leaves for Forest) */
const WeatherParticles: React.FC<{ type: 'snow' | 'sand' | 'leaves'; color: string }> = ({ type, color }) => {
    const pointsRef = useRef<Points>(null);
    const count = 160;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 60;
            pos[i * 3 + 1] = Math.random() * 22 + 1;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60;

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
                posArr[i * 3 + 1] = 22;
                posArr[i * 3] = (Math.random() - 0.5) * 60;
                posArr[i * 3 + 2] = (Math.random() - 0.5) * 60;
            }
            if (type === 'sand' && posArr[i * 3] > 30) {
                posArr[i * 3] = -30;
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

/** Low Snowy Ridge marking the map border for Frost Kingdom */
const LowSnowRidge: React.FC<{
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    rotation?: number;
}> = ({ position, width, height, depth, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        {/* Rocky Base Rim */}
        <mesh position={[0, height * 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.7, depth]} />
            <meshStandardMaterial color="#4a5d6e" roughness={0.9} flatShading />
        </mesh>
        {/* Soft Snow Cap on the Rim */}
        <mesh position={[0, height * 0.85, 0]} castShadow receiveShadow>
            <coneGeometry args={[width * 0.46, height * 0.5, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} flatShading />
        </mesh>
    </group>
);

/** Pine Tree with Snow for Frost */
const SnowyPine: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={scale}>
        {/* Trunk */}
        <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 1.5, 5]} />
            <meshStandardMaterial color="#3e2723" roughness={1} />
        </mesh>
        {/* Bottom Tier */}
        <mesh position={[0, 1.8, 0]} castShadow>
            <coneGeometry args={[1.5, 1.8, 5]} />
            <meshStandardMaterial color="#2d5a52" roughness={0.8} flatShading />
        </mesh>
        {/* Snow on Bottom Tier */}
        <mesh position={[0, 2.05, 0]}>
            <coneGeometry args={[1.52, 0.4, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
        </mesh>
        {/* Middle Tier */}
        <mesh position={[0, 2.8, 0]} castShadow>
            <coneGeometry args={[1.2, 1.6, 5]} />
            <meshStandardMaterial color="#35655c" roughness={0.8} flatShading />
        </mesh>
        {/* Snow on Middle Tier */}
        <mesh position={[0, 3.05, 0]}>
            <coneGeometry args={[1.22, 0.4, 5]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} flatShading />
        </mesh>
        {/* Top Tier */}
        <mesh position={[0, 3.8, 0]} castShadow>
            <coneGeometry args={[0.8, 1.4, 5]} />
            <meshStandardMaterial color="#e0f2fe" roughness={0.5} flatShading />
        </mesh>
    </group>
);

/** Low Sand Dune / Sandstone Ridge marking map boundary for Golden Desert */
const LowDesertRidge: React.FC<{
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    rotation?: number;
}> = ({ position, width, height, depth, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        {/* Low Sandstone Base */}
        <mesh position={[0, height * 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.7, depth]} />
            <meshStandardMaterial color="#b87a32" roughness={0.95} flatShading />
        </mesh>
        {/* Gentle Rounded Sand Dune Top */}
        <mesh position={[0, height * 0.75, 0]} castShadow receiveShadow>
            <coneGeometry args={[width * 0.45, height * 0.6, 5]} />
            <meshStandardMaterial color="#e5a952" roughness={0.9} flatShading />
        </mesh>
    </group>
);

/** Desert Palm Tree */
const DesertPalm: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
    <group position={position} scale={scale}>
        {/* Curved Trunk */}
        <mesh position={[0.2, 1.4, 0]} rotation={[0, 0, -0.15]} castShadow>
            <cylinderGeometry args={[0.18, 0.32, 2.8, 6]} />
            <meshStandardMaterial color="#8d5b28" roughness={1} />
        </mesh>
        {/* Palm Canopy */}
        <group position={[0.5, 2.8, 0]}>
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

/** Low Mossy Stone Berm marking map boundary for Emerald Forest */
const LowForestRidge: React.FC<{
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    rotation?: number;
}> = ({ position, width, height, depth, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        {/* Low Earth/Rock Base */}
        <mesh position={[0, height * 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.7, depth]} />
            <meshStandardMaterial color="#4a443b" roughness={0.95} flatShading />
        </mesh>
        {/* Lush Green Moss Mound */}
        <mesh position={[0, height * 0.75, 0]} castShadow receiveShadow>
            <coneGeometry args={[width * 0.45, height * 0.6, 6]} />
            <meshStandardMaterial color="#2d6a22" roughness={0.9} flatShading />
        </mesh>
    </group>
);

/** Deciduous Tree for Emerald Forest */
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

/** Corner boundary post marking the 4 vertices of the square boundary */
const CornerPost: React.FC<{
    position: [number, number, number];
    style: 'ice' | 'desert' | 'forest';
}> = ({ position, style }) => {
    const baseColor = style === 'ice' ? '#4a5d6e' : style === 'desert' ? '#b87a32' : '#4a443b';
    const topColor = style === 'ice' ? '#ffffff' : style === 'desert' ? '#e5a952' : '#2d6a22';
    return (
        <group position={position}>
            <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.3, 0.9, 1.3]} />
                <meshStandardMaterial color={baseColor} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
                <coneGeometry args={[0.7, 0.45, 4]} />
                <meshStandardMaterial color={topColor} roughness={0.8} flatShading />
            </mesh>
        </group>
    );
};

export const BORDER_HALF = 19.5; // Half-size of the square boundary (39x39 square map)

export const KingdomDecor: React.FC<KingdomDecorProps> = ({ theme }) => {
    // Square perimeter border segments (North, South, East, West)
    const squareBorder = useMemo(() => {
        const list: { pos: [number, number, number]; w: number; h: number; d: number; rot: number }[] = [];
        const B = BORDER_HALF;
        const SEGMENTS_PER_SIDE = 8;
        const segLen = (B * 2 - 2.4) / SEGMENTS_PER_SIDE; // ~4.57
        const start = -B + 1.2 + segLen / 2;

        for (let i = 0; i < SEGMENTS_PER_SIDE; i++) {
            const coord = start + i * segLen;
            const h = 0.72; // Small low boundary
            const d = 1.0;
            // North edge (z = -B)
            list.push({ pos: [coord, 0, -B], w: segLen + 0.08, h, d, rot: 0 });
            // South edge (z = +B)
            list.push({ pos: [coord, 0, B], w: segLen + 0.08, h, d, rot: 0 });
            // West edge (x = -B)
            list.push({ pos: [-B, 0, coord], w: segLen + 0.08, h, d, rot: Math.PI / 2 });
            // East edge (x = +B)
            list.push({ pos: [B, 0, coord], w: segLen + 0.08, h, d, rot: Math.PI / 2 });
        }
        return list;
    }, []);

    const cornerPosts: [number, number, number][] = useMemo(() => {
        const B = BORDER_HALF;
        return [
            [-B, 0, -B],
            [B, 0, -B],
            [-B, 0, B],
            [B, 0, B],
        ];
    }, []);

    // Minimal small foliage along the outside of the square boundary
    const flora = useMemo(() => {
        const list: { pos: [number, number, number]; scale: number }[] = [];
        const B = BORDER_HALF;
        // 4 corner trees outside the boundary
        list.push({ pos: [-B - 1.2, 0, -B - 1.2], scale: 0.5 });
        list.push({ pos: [B + 1.2, 0, -B - 1.2], scale: 0.5 });
        list.push({ pos: [-B - 1.2, 0, B + 1.2], scale: 0.5 });
        list.push({ pos: [B + 1.2, 0, B + 1.2], scale: 0.5 });

        // 2 small trees along Northern outside wall
        list.push({ pos: [-6, 0, -B - 1.2], scale: 0.45 });
        list.push({ pos: [6, 0, -B - 1.2], scale: 0.45 });
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

            {/* Kingdom-specific square perimeter ridges & corner posts */}
            {theme.mountainStyle === 'ice' && (
                <group>
                    {squareBorder.map((b, i) => (
                        <LowSnowRidge
                            key={`sq_ridge_${i}`}
                            position={b.pos}
                            width={b.w}
                            height={b.h}
                            depth={b.d}
                            rotation={b.rot}
                        />
                    ))}
                    {cornerPosts.map((cp, i) => (
                        <CornerPost key={`cp_${i}`} position={cp} style="ice" />
                    ))}
                    {flora.map((f, i) => (
                        <SnowyPine key={`pine_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}

            {theme.mountainStyle === 'desert' && (
                <group>
                    {squareBorder.map((b, i) => (
                        <LowDesertRidge
                            key={`sq_ridge_${i}`}
                            position={b.pos}
                            width={b.w}
                            height={b.h}
                            depth={b.d}
                            rotation={b.rot}
                        />
                    ))}
                    {cornerPosts.map((cp, i) => (
                        <CornerPost key={`cp_${i}`} position={cp} style="desert" />
                    ))}
                    {flora.map((f, i) => (
                        <DesertPalm key={`palm_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}

            {theme.mountainStyle === 'forest' && (
                <group>
                    {squareBorder.map((b, i) => (
                        <LowForestRidge
                            key={`sq_ridge_${i}`}
                            position={b.pos}
                            width={b.w}
                            height={b.h}
                            depth={b.d}
                            rotation={b.rot}
                        />
                    ))}
                    {cornerPosts.map((cp, i) => (
                        <CornerPost key={`cp_${i}`} position={cp} style="forest" />
                    ))}
                    {flora.map((f, i) => (
                        <ForestTree key={`ftree_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}
        </group>
    );
};
