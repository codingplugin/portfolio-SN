import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Explosion = ({ position, color = '#ffaa00' }) => {
    const group = useRef();

    // Create particles
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < 20; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const speed = 0.05 + Math.random() * 0.1;
            temp.push({
                id: i,
                dir: new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta),
                    Math.sin(phi) * Math.sin(theta),
                    Math.cos(phi)
                ),
                speed: speed,
                scale: 1.0
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if (group.current) {
            group.current.children.forEach((child, i) => {
                const p = particles[i];
                // Move
                child.position.add(p.dir.clone().multiplyScalar(p.speed));
                // Shrink slowly
                child.scale.multiplyScalar(0.97);
            });
        }
    });

    return (
        <group ref={group} position={position}>
            {particles.map(p => (
                <mesh key={p.id} position={[0, 0, 0]}>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#ff5500"
                        emissiveIntensity={4.0}
                        toneMapped={false}
                    />
                </mesh>
            ))}
        </group>
    );
};
