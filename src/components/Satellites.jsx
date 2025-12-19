import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

export const ACTION_DATA = {
    'Internships': {
        color: '#ff88aa',
        items: [

            {
                name: 'Intern — MNNIT Allahabad',
                color: '#ff88aa',
                detail: 'Project: Swarm-based Node Localization in IoT WSNs\nJune 2025 — July 2025',
                externalLink: 'https://github.com/codingplugin/NL-Simulation-research',
                link: '/MNNIT-certificate.jpg',
                linkLabel: 'View Certificate'
            },
            {
                name: 'Intern — IIT Patna',
                color: '#ff88aa',
                detail: 'Project: Lightweight Satellite Air Quality Forecasting via Knowledge Distillation\nJan 2025 — June 2025',
                externalLink: 'https://github.com/codingplugin/ML-Air-Pollution',
                link: '/iitpcertificate.jpg',
                linkLabel: 'View Certificate'
            },
            {
                name: 'Intern — Tripura University',
                color: '#ff88aa',
                detail: 'Project: Real-time Hand Mudra Recognition via Skeletal Landmark Detection\nJune 2024 — July 2024',
                link: '/TU-Certificate.jpg',
                linkLabel: 'View Certificate'
            }
        ]

    },
    'Skills': {
        color: '#88aaff',
        items: [
            { name: 'Python', color: '#88aaff' },
            { name: 'C++', color: '#88aaff' },
            { name: 'HTML/CSS', color: '#88aaff' },
            { name: 'JavaScript', color: '#88aaff' },
            { name: 'React', color: '#88aaff' },
            { name: 'Node.js', color: '#88aaff' },
            { name: 'MongoDB', color: '#88aaff' },
            { name: 'MySQL', color: '#88aaff' },
            { name: 'Machine Learning', color: '#88aaff' },
            { name: 'System Design', color: '#88aaff' },
            { name: 'Prompt Eng.', color: '#88aaff' },
            { name: 'AI Tools', color: '#88aaff' }
        ]
    },
    'Projects': {
        color: '#aaff88',
        description: "A showcase of my projects.",
        items: [
            { name: 'Portfolio Website', color: '#aaff88', externalLink: 'https://github.com/codingplugin/portfolio-SN' },
            { name: 'AI-Photo-Share', color: '#aaff88', externalLink: 'https://github.com/codingplugin/AI-Photo-Share' },
            { name: 'NodeLocalization', color: '#aaff88', externalLink: 'https://nl-simulation.onrender.com/' },
            { name: 'VoiceFlow', color: '#aaff88', externalLink: 'https://voiceflow-z45v.onrender.com/' },
            { name: 'Document Scanner', color: '#aaff88', externalLink: 'https://github.com/pranavupadhyay123/Document-Scanner' },
            { name: 'Air Pollutant prediction', color: '#aaff88', externalLink: 'https://github.com/codingplugin/ML-Air-Pollution' }
        ]
    },
    'Education': {
        color: '#ffff88',
        description: "",
        items: [
            {
                name: 'B.Tech',
                color: '#ffff88',
                detail: "B.Tech in Computer Science & Engineering\nNorth Eastern Regional Institute of Science and Technology (NERIST)\n2022-2026\nCGPA: 8.16"
            },
            {
                name: 'Class 12',
                color: '#ffff88',
                detail: "CBSE Board\nScore: 86.8%",
                link: '/class12.jpg',
                linkLabel: 'View Class 12 Marksheet'
            },
            {
                name: 'Class 10',
                color: '#ffff88',
                detail: "TBSE Board\nScore: 88.8%",
                link: '/class10.jpg',
                linkLabel: 'View Class 10 Marksheet'
            }
        ]
    }
};

const SatelliteNode = ({ position, color, label, onClick, isSelected, children, earthRef }) => {
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current) {
            // S1 rotation (spin on axis)
            ref.current.rotation.y += delta * 0.5;
        }
    });

    return (
        <group position={position}>
            <Sphere ref={ref} args={[0.6, 32, 32]} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
                <meshStandardMaterial
                    color={isSelected ? '#ffffff' : '#202020'}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={isSelected ? 0.8 : 0.3}
                />
                <Html
                    position={[0, 0.8, 0]}
                    center
                    distanceFactor={15}
                    zIndexRange={[1000, 0]}
                    occlude={earthRef ? [earthRef] : undefined}
                    style={{
                        pointerEvents: 'none',
                        transition: 'opacity 0.2s',
                        userSelect: 'none'
                    }}
                >
                    <div style={{ color: color, fontFamily: 'Orbitron', fontSize: '10px', background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${color}`, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {label}
                    </div>
                </Html>
            </Sphere>
            {isSelected && children}
        </group>
    );
};

const SubSatellite = ({ index, total, color, label, link, earthRef, orbitTilt = [0, 0, 0], orbitAngle, radius = 2 }) => {
    const angle = orbitAngle !== undefined ? orbitAngle : (index / total) * Math.PI * 2;
    // const radius = 2; // Radius is passed as prop now
    const ref = useRef();
    const vec = useRef(new THREE.Vector3());
    const euler = useRef(new THREE.Euler(orbitTilt[0], orbitTilt[1], orbitTilt[2]));

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Base orbit on XZ plane
        const bx = Math.cos(angle + t) * radius;
        const bz = Math.sin(angle + t) * radius;

        vec.current.set(bx, 0, bz);
        // Apply inclination/tilt
        euler.current.set(orbitTilt[0], orbitTilt[1], orbitTilt[2]);
        vec.current.applyEuler(euler.current);

        if (ref.current) {
            ref.current.position.copy(vec.current);
        }
    });

    return (
        <Sphere
            ref={ref}
            args={[0.15, 16, 16]}
            onClick={(e) => {
                e.stopPropagation();
                if (link) window.open(link, '_blank');
            }}
            onPointerOver={() => { if (link) document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <meshStandardMaterial
                color="#202020"
                roughness={0.2}
                metalness={0.8}
                emissive={color}
                emissiveIntensity={0.5}
            />
            <Html
                position={[0, 0.3, 0]}
                center
                distanceFactor={12}
                zIndexRange={[1000, 0]}
                occlude={earthRef ? [earthRef] : undefined}
                style={{
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s',
                    userSelect: 'none'
                }}
            >
                <div style={{ color: '#fff', fontSize: '8px', whiteSpace: 'nowrap', textShadow: '0 0 5px #000' }}>{label}</div>
            </Html>
        </Sphere>
    );
};

export const Satellites = ({ active, focus, setFocus, earthRef }) => {
    const groupRef = useRef();
    const categories = Object.keys(ACTION_DATA);

    useFrame((state, delta) => {
        if (!active) return;
        if (!groupRef.current) return;

        if (focus) {
            // Target Rotation: GroupRot should be -ItemAngle to bring Item to Angle 0 (Front)
            // Wait, Angle 0 is (0,0,R) in our calc below?
            // x = sin(a)*r, z = cos(a)*r.
            // a=0 -> x=0, z=r. Yes. Front (assuming camera is at +z).

            const focusIndex = categories.indexOf(focus);
            const itemAngle = (focusIndex / categories.length) * Math.PI * 2;
            let targetRot = -itemAngle; // Rotate group back by item angle

            // Shortest path logic
            const currentRot = groupRef.current.rotation.y;
            const diff = targetRot - currentRot;
            // Normalize diff to -PI to PI
            const normalizedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));

            groupRef.current.rotation.y += normalizedDiff * delta * 4; // Smooth lerp
        } else {
            groupRef.current.rotation.y += delta * 0.2;
        }
    });

    if (!active) return null;

    return (
        <group ref={groupRef}>
            {categories.map((cat, i) => {
                const angle = (i / categories.length) * Math.PI * 2;
                const radius = 6; // Radius increased from 6 to 12
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;

                const isSelected = focus === cat;
                const data = ACTION_DATA[cat];

                return (
                    <SatelliteNode
                        key={cat}
                        position={[x, 0, z]}
                        color={data.color}
                        label={cat}
                        isSelected={isSelected}
                        onClick={() => setFocus(cat)}
                        earthRef={earthRef}
                    >
                        {isSelected && data.items.map((item, idx) => {
                            // Atom Effect for Skills: Multidirectional Orbits
                            let tilt = [0, 0, 0];
                            let orbitAngle = undefined;
                            let orbitRadius = 2;

                            if (cat === 'Skills') {
                                const itemsPerPlane = 4;
                                const planeIdx = Math.floor(idx / itemsPerPlane); // 0, 1, 2
                                const itemInPlaneIdx = idx % itemsPerPlane;

                                // Distribute items evenly along ring, but Offset each plane by 30 degrees (PI/6)
                                // to ensure they reach intersection nodes at different times
                                orbitAngle = ((itemInPlaneIdx / itemsPerPlane) * Math.PI * 2) + (planeIdx * (Math.PI / 6));

                                // Constant radius
                                orbitRadius = 2;

                                // Atom Configuration:
                                // Plane 0: Horizontal (0 deg)
                                // Plane 1: Vertical (90 deg)
                                // Plane 2: Diagonal (45 deg)
                                if (planeIdx === 0) tilt = [0, 0, 0];
                                else if (planeIdx === 1) tilt = [Math.PI / 2, 0, 0];
                                else tilt = [Math.PI / 4, 0, 0];
                            } else if (cat === 'Projects') {
                                // Full Atomic Sphere (Dynamic for N items)
                                orbitRadius = 2.5;
                                const count = data.items.length;

                                // Distribute inclination evenly across PI (180 degrees)
                                const inclination = idx * (Math.PI / count);
                                tilt = [inclination, 0, 0];

                                // Stagger angles
                                orbitAngle = idx * ((Math.PI * 2) / count);
                            }

                            return (
                                <SubSatellite
                                    key={idx}
                                    index={idx}
                                    total={data.items.length}
                                    color={item.color}
                                    label={item.name}
                                    link={item.link}
                                    earthRef={earthRef}
                                    orbitTilt={tilt}
                                    orbitAngle={orbitAngle}
                                    radius={orbitRadius}
                                />
                            );
                        })}
                    </SatelliteNode>
                );
            })}
        </group>
    );
};
