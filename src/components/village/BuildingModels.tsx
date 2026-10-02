import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { BUILDINGS, type BuildingType } from '../../config/BuildingsConfig';
import { ArcherModel, HeroKingModel } from '../common/StylizedCharacters';

/** Low-poly model for each building type, centred on its footprint, base at y=0. */
export const BuildingModel: React.FC<{ type: BuildingType; level: number; aimAngle?: number }> = ({ type, level, aimAngle }) => {
  const d = BUILDINGS[type];
  const s = d.size;
  const lvlTint = Math.min(level, 10) / 10; // higher levels look taller/shinier

  switch (type) {
    case 'townhall':
      return (
        <group>
          <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.8, 1.8, s * 0.8]} />
            <meshStandardMaterial color={d.color} roughness={0.8} />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
            <group key={i} position={[x * s * 0.38, 0, z * s * 0.38]}>
              <mesh position={[0, 1.4 + lvlTint, 0]} castShadow>
                <cylinderGeometry args={[0.45, 0.5, 2.8 + lvlTint * 2, 8]} />
                <meshStandardMaterial color={d.color} roughness={0.7} />
              </mesh>
              <mesh position={[0, 3.2 + lvlTint * 2, 0]} castShadow>
                <coneGeometry args={[0.6, 1, 8]} />
                <meshStandardMaterial color={d.roofColor} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 2.6 + lvlTint, 0]} castShadow>
            <boxGeometry args={[1.6, 1.6 + lvlTint * 2, 1.6]} />
            <meshStandardMaterial color={d.color} roughness={0.7} />
          </mesh>
          <mesh position={[0, 4.1 + lvlTint * 2, 0]} castShadow>
            <coneGeometry args={[1.35, 1.6, 4]} />
            <meshStandardMaterial color={d.roofColor} />
          </mesh>
          <mesh position={[0, 5.2 + lvlTint * 2, 0]}>
            <boxGeometry args={[0.05, 0.9, 0.05]} />
            <meshStandardMaterial color="#4a3520" />
          </mesh>
          <mesh position={[0.25, 5.45 + lvlTint * 2, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.03]} />
            <meshStandardMaterial color="#ffd700" emissive="#aa8800" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0.6, s * 0.4 + 0.01]}>
            <boxGeometry args={[0.8, 1.2, 0.05]} />
            <meshStandardMaterial color="#5a3418" />
          </mesh>
        </group>
      );
    case 'goldmine':
      return (
        <group>
          <mesh position={[0, 0.7, -0.2]} castShadow receiveShadow>
            <coneGeometry args={[1.4, 1.8, 6]} />
            <meshStandardMaterial color={d.color} roughness={1} flatShading />
          </mesh>
          <mesh position={[0, 0.5, 0.75]} castShadow>
            <boxGeometry args={[0.9, 1, 0.3]} />
            <meshStandardMaterial color="#6b4423" />
          </mesh>
          <mesh position={[0, 0.4, 0.92]}>
            <boxGeometry args={[0.6, 0.8, 0.05]} />
            <meshStandardMaterial color="#1a1310" />
          </mesh>
          {[[-0.8, 0.9], [0.8, 0.95], [0.5, 1.2], [-0.4, 1.25]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.15, z]} castShadow>
              <sphereGeometry args={[0.18 + (i % 2) * 0.05, 8, 6]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.25} emissive="#7a5a00" emissiveIntensity={0.3} />
            </mesh>
          ))}
        </group>
      );
    case 'barracks':
      return (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.8, 1.2, s * 0.6]} />
            <meshStandardMaterial color={d.color} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[s * 0.62, 0.9, 4]} />
            <meshStandardMaterial color={d.roofColor} />
          </mesh>
          {[-0.9, 0.9].map((x, i) => (
            <mesh key={i} position={[x, 0.9, s * 0.38]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 1.8]} />
              <meshStandardMaterial color="#3a3a48" />
            </mesh>
          ))}
          <mesh position={[0, 2.3, 0]}>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#e8e8f0" />
          </mesh>
        </group>
      );
    case 'blacksmith':
      return (
        <group>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.75, 1.2, s * 0.65]} />
            <meshStandardMaterial color={d.color} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[s * 0.58, 0.8, 4]} />
            <meshStandardMaterial color={d.roofColor} />
          </mesh>
          <mesh position={[0.8, 1.6, -0.5]} castShadow>
            <boxGeometry args={[0.45, 2, 0.45]} />
            <meshStandardMaterial color="#8d887e" />
          </mesh>
          <mesh position={[0, 0.5, s * 0.33 + 0.01]}>
            <boxGeometry args={[0.8, 0.8, 0.05]} />
            <meshStandardMaterial color="#ff7a1a" emissive="#ff5a00" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case 'armory':
      return (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.75, 1.3, s * 0.7]} />
            <meshStandardMaterial color={d.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.65, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[s * 0.6, 0.9, 4]} />
            <meshStandardMaterial color={d.roofColor} />
          </mesh>
          <mesh position={[0, 0.8, s * 0.36]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.08, 16]} />
            <meshStandardMaterial color="#cfd8e3" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      );
    case 'arena':
      return (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[s * 0.45, s * 0.48, 0.8, 16, 1, true]} />
            <meshStandardMaterial color={d.color} roughness={0.9} side={2} />
          </mesh>
          <mesh position={[0, 0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[s * 0.44, 16]} />
            <meshStandardMaterial color="#e7d3a0" />
          </mesh>
          {[-0.9, 0.9].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.4]} />
                <meshStandardMaterial color="#4a3520" />
              </mesh>
              <mesh position={[0.18, 1.6, 0]}>
                <boxGeometry args={[0.35, 0.22, 0.02]} />
                <meshStandardMaterial color={i ? '#3a6fd6' : '#d63a3a'} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case 'altar':
      return <AltarModel level={level} />;
    case 'cannon':
      return (
        <group>
          <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.85, 0.95, 0.5, 8]} />
            <meshStandardMaterial color="#8d887e" roughness={1} />
          </mesh>
          <group position={[0, 0.7, 0]} rotation={[0, aimAngle ?? Math.PI / 4, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.42, 12, 10]} />
              <meshStandardMaterial color={d.color} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.05, 0.55]} rotation={[Math.PI / 2 - 0.15, 0, 0]} castShadow>
              <cylinderGeometry args={[0.16 + lvlTint * 0.05, 0.22, 1.1, 10]} />
              <meshStandardMaterial color={d.roofColor} metalness={0.6} roughness={0.35} />
            </mesh>
          </group>
        </group>
      );
    case 'archertower':
      return (
        <group>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
            <mesh key={i} position={[x * 0.55, 1.1, z * 0.55]} castShadow>
              <boxGeometry args={[0.15, 2.2 + lvlTint, 0.15]} />
              <meshStandardMaterial color="#6b4423" />
            </mesh>
          ))}
          <mesh position={[0, 2.3 + lvlTint, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.5, 1.4]} />
            <meshStandardMaterial color={d.color} />
          </mesh>
          <mesh position={[0, 3.05 + lvlTint, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.1, 0.9, 4]} />
            <meshStandardMaterial color={d.roofColor} />
          </mesh>
          <group position={[0, 2.55 + lvlTint, 0]} rotation={[0, aimAngle ?? 0, 0]}>
            <ArcherModel teamColor="#2ed573" isAttacking={aimAngle !== undefined} scale={0.7} />
          </group>
        </group>
      );
  }
};

const AltarModel: React.FC<{ level: number }> = ({ level }) => {
  const crystal = useRef<Group>(null);
  useFrame((_, dt) => {
    if (crystal.current) crystal.current.rotation.y += dt * 0.8;
  });
  return (
    <group>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.1, 1.2, 0.3, 14]} />
        <meshStandardMaterial color="#636e72" roughness={0.9} />
      </mesh>
      {/* Stone Pillars */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.8, -0.5]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 1.4, 8]} />
          <meshStandardMaterial color="#8395a7" />
        </mesh>
      ))}
      {/* Floating Hero Power Crystal behind King */}
      <group ref={crystal} position={[0, 1.6, -0.4]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial color="#ffd700" emissive="#f39c12" emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
      </group>
      <pointLight position={[0, 1.6, -0.4]} color="#ffd700" intensity={2} distance={4} />

      {/* The Grand Hero King standing prominently on the altar */}
      <group position={[0, 0.3, 0.1]}>
        <HeroKingModel level={level} scale={0.85} />
      </group>
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
