import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import { VILLAGE_HALF } from '../../config/BuildingsConfig';
import type { KingdomVisualTheme } from '../../config/KingdomsConfig';
import { mulberry32 } from '../../core/pvp/PvpBattle';

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

/** Snowy Mountain Peak for Frost Kingdom */
const SnowMountainPeak: React.FC<{
    position: [number, number, number];
    radius: number;
    height: number;
    rotation?: number;
}> = ({ position, radius, height, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        {/* Rocky Base */}
        <mesh position={[0, height * 0.38, 0]} castShadow receiveShadow>
            <coneGeometry args={[radius, height * 0.76, 5]} />
            <meshStandardMaterial color="#4a5d6e" roughness={0.9} flatShading />
        </mesh>
        {/* Snowy Cap */}
        <mesh position={[0, height * 0.78, 0]} castShadow receiveShadow>
            <coneGeometry args={[radius * 0.48, height * 0.44, 5]} />
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

/** Desert Sand Dune / Mesa Monolith for Golden Kingdom */
const DesertMesa: React.FC<{
    position: [number, number, number];
    width: number;
    height: number;
    depth: number;
    rotation?: number;
}> = ({ position, width, height, depth, rotation = 0 }) => (
    <group position={position} rotation={[0, rotation, 0]}>
        {/* Tier 1 Base Mesa */}
        <mesh position={[0, height * 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height * 0.7, depth]} />
            <meshStandardMaterial color="#b87a32" roughness={0.95} flatShading />
        </mesh>
        {/* Tier 2 Tapered Mesa Top */}
        <mesh position={[0, height * 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.75, height * 0.5, depth * 0.75]} />
            <meshStandardMaterial color="#d49242" roughness={0.9} flatShading />
        </mesh>
        {/* Sand Dune Summit */}
        <mesh position={[0, height + 0.3, 0]} castShadow receiveShadow>
            <coneGeometry args={[width * 0.35, 1.2, 5]} />
            <meshStandardMaterial color="#f0b45b" roughness={0.85} flatShading />
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

/** Rolling Green Forest Hill */
const ForestHill: React.FC<{
    position: [number, number, number];
    radius: number;
    height: number;
}> = ({ position, radius, height }) => (
    <mesh position={[position[0], height * 0.4, position[2]]} castShadow receiveShadow>
        <sphereGeometry args={[radius, 7, 6]} />
        <meshStandardMaterial color="#2d6a22" roughness={0.9} flatShading />
    </mesh>
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

export const KingdomDecor: React.FC<KingdomDecorProps> = ({ theme, seed = 42 }) => {
    const rng = useMemo(() => mulberry32(seed), [seed]);

    // Generate backdrop mountain amphitheater (strictly in the North / flanks, never blocking camera foreground)
    const mountains = useMemo(() => {
        const list: { pos: [number, number, number]; r: number; h: number; rot: number; w?: number; d?: number }[] = [];

        // Primary backdrop arc across the Northern horizon: West (-x) -> North (-z) -> East (+x)
        const count = 14;
        for (let i = 0; i < count; i++) {
            // Arc spanning 210 degrees across the back: from 155° to 385°
            const angle = Math.PI * 0.86 + (i / (count - 1)) * (Math.PI * 1.28) + (rng() - 0.5) * 0.12;
            const dist = 32 + rng() * 10;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const r = 7 + rng() * 4.5;
            const h = 10 + rng() * 10;
            const rot = rng() * Math.PI * 2;
            list.push({ pos: [x, 0, z], r, h, rot, w: r * 1.3, d: r * 1.1 });
        }

        // Secondary towering background peaks further in the distance
        for (let i = 0; i < 9; i++) {
            const angle = Math.PI * 0.88 + (i / 8) * (Math.PI * 1.24) + (rng() - 0.5) * 0.15;
            const dist = 48 + rng() * 14;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const r = 9 + rng() * 6;
            const h = 16 + rng() * 12;
            const rot = rng() * Math.PI * 2;
            list.push({ pos: [x, 0, z], r, h, rot, w: r * 1.5, d: r * 1.2 });
        }

        return list;
    }, [rng]);

    // Generate vegetation / foliage outside the deploy perimeter
    const flora = useMemo(() => {
        const list: { pos: [number, number, number]; scale: number }[] = [];
        for (let i = 0; i < 22; i++) {
            // Arc around lateral flanks and northern perimeter (keeps camera foreground clear)
            const angle = Math.PI * 0.8 + rng() * (Math.PI * 1.4);
            const dist = VILLAGE_HALF + 3.8 + rng() * 9;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;
            const scale = 0.65 + rng() * 0.45;
            list.push({ pos: [x, 0, z], scale });
        }
        return list;
    }, [rng]);

    const weatherColor = useMemo(() => {
        if (theme.weatherType === 'snow') return '#ffffff';
        if (theme.weatherType === 'sand') return '#ffda79';
        return '#86efac';
    }, [theme.weatherType]);

    return (
        <group>
            {/* Atmospheric weather particles */}
            <WeatherParticles type={theme.weatherType} color={weatherColor} />

            {/* Kingdom Specific Mountains / Hills */}
            {theme.mountainStyle === 'ice' && (
                <group>
                    {mountains.map((m, i) => (
                        <SnowMountainPeak
                            key={`peak_${i}`}
                            position={m.pos}
                            radius={m.r}
                            height={m.h}
                            rotation={m.rot}
                        />
                    ))}
                    {flora.map((f, i) => (
                        <SnowyPine key={`pine_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}

            {theme.mountainStyle === 'desert' && (
                <group>
                    {mountains.map((m, i) => (
                        <DesertMesa
                            key={`mesa_${i}`}
                            position={m.pos}
                            width={m.w || m.r * 1.5}
                            height={m.h * 0.7}
                            depth={m.d || m.r * 1.2}
                            rotation={m.rot}
                        />
                    ))}
                    {flora.map((f, i) => (
                        <DesertPalm key={`palm_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}

            {theme.mountainStyle === 'forest' && (
                <group>
                    {mountains.map((m, i) => (
                        <ForestHill
                            key={`hill_${i}`}
                            position={m.pos}
                            radius={m.r * 1.2}
                            height={m.h * 0.6}
                        />
                    ))}
                    {flora.map((f, i) => (
                        <ForestTree key={`ftree_${i}`} position={f.pos} scale={f.scale} />
                    ))}
                </group>
            )}
        </group>
    );
};
