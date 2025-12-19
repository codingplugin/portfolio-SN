import React, { useRef, useMemo, useState, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei'; // Import Trail for effects
import * as THREE from 'three';

const Asteroid = forwardRef(({ position }, ref) => {
    const internalRef = useRef();

    // Expose the mesh to the parent via the forwarded ref
    useImperativeHandle(ref, () => internalRef.current);

    useFrame((state, delta) => {
        if (internalRef.current) {
            // Rotate asteroid
            internalRef.current.rotation.x += delta * 0.5;
            internalRef.current.rotation.y += delta * 0.2;

            // Move towards center (Earth at 0,0,0) slow speed
            const direction = new THREE.Vector3(0, 0, 0).sub(internalRef.current.position).normalize();
            internalRef.current.position.add(direction.multiplyScalar(delta * 2));

            // Loop back if too close
            if (internalRef.current.position.length() < 2.5) {
                internalRef.current.position.setLength(15 + Math.random() * 5);
            }
        }
    });

    return (
        // Wrap in a group for the trail to follow
        <group>
            <Trail width={1.5} length={8} color="#ff8800" attenuation={(t) => t * t}>
                <mesh ref={internalRef} position={position} scale={[0.3, 0.3, 0.3]}>
                    <icosahedronGeometry args={[1, 1]} /> {/* Rounder geometry */}
                    <meshStandardMaterial
                        color="#554444" // Brighter asteroid color
                        emissive="#ff2200"
                        emissiveIntensity={0.5}
                        roughness={0.8}
                        flatShading={true}
                    />
                </mesh>
            </Trail>
        </group>
    );
});

export const AsteroidField = forwardRef(({ active }, ref) => {
    const asteroidRefs = useRef({});
    const [activeIds, setActiveIds] = useState(() => {
        // IDs 0 to 19
        return Array.from({ length: 20 }, (_, i) => i);
    });

    const asteroidsData = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 10 + Math.random() * 10;

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            temp.push({ id: i, pos: [x, y, z] });
        }
        return temp;
    }, []);

    useImperativeHandle(ref, () => ({
        destroyAsteroid: () => {
            if (activeIds.length === 0) return null;

            // Find closest asteroid to Earth (0,0,0)
            let closestId = -1;
            let minDistance = Infinity;

            activeIds.forEach(id => {
                const mesh = asteroidRefs.current[id];
                if (mesh) {
                    const dist = mesh ? mesh.position.length() : Infinity;
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestId = id;
                    }
                }
            });

            if (closestId === -1) return null;

            const mesh = asteroidRefs.current[closestId];
            const pos = mesh ? mesh.position.clone() : new THREE.Vector3();

            setActiveIds(prev => prev.filter(id => id !== closestId));

            return pos;
        }
    }));

    if (!active) return null;

    return (
        <group>
            {asteroidsData.map((ast) => (
                activeIds.includes(ast.id) && (
                    <Asteroid
                        key={ast.id}
                        position={ast.pos}
                        ref={(el) => asteroidRefs.current[ast.id] = el}
                    />
                )
            ))}
        </group>
    );
});
