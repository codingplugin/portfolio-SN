import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Section } from 'lucide-react';

const HologramPanel = ({ position, title, children, delay = 0 }) => {
    return (
        <group position={position}>
            <Html transform distanceFactor={1.5} style={{ opacity: 0, animation: `hologramFadeIn 0.5s forwards ${delay}s` }}>
                <div className="hologram-panel">
                    <h3>{title}</h3>
                    <div className="scan-line"></div>
                    {children}
                </div>
            </Html>
            {/* Decorative connecting line to planet center */}
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 2, 4]} />
                <meshBasicMaterial color="#00DDFF" transparent opacity={0.2} />
            </mesh>
        </group>
    );
};

export function HologramData({ active }) {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            // Floating animation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            {/* Profile / About - Left Side */}
            <HologramPanel position={[-2.8, 0.5, 0]} title="IDENTITY" delay={0.1}>
                <p><strong>Subhradip Nandi</strong></p>
                <p>ML Researcher & Engineer</p>
                <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Status: Online</p>
                <p style={{ fontSize: '0.8rem', color: '#aaa' }}>Loc: India (Agartala)</p>
            </HologramPanel>

            {/* Skills - Right Side */}
            <HologramPanel position={[2.8, 0.5, 0]} title="CAPABILITIES" delay={0.3}>
                <ul>
                    <li>Python / TensorFlow / PyTorch</li>
                    <li>Computer Vision & NLP</li>
                    <li>React & Three.js</li>
                    <li>Skeletal Landmark Detection</li>
                </ul>
            </HologramPanel>

            {/* Contact - Bottom Center */}
            <HologramPanel position={[0, -2.8, 2]} title="CONTACT UPLINK" delay={0.5}>
                <p>nandisubhradip01@gmail.com</p>
                <p>github.com/codingplugin</p>
                <p>linkedin.com/in/subhradip-nandi</p>
            </HologramPanel>

            {/* Projects - Far Right/Back */}
            <HologramPanel position={[3.5, -1.5, -1]} title="LATEST INTEL" delay={0.7}>
                <p><strong>Skeletal Feat. Extraction</strong></p>
                <p>Novel pipeline.</p>
                <p><strong>Portfolio/Demo</strong></p>
                <p>Interactive 3D Exp.</p>
            </HologramPanel>
        </group>
    );
}
