import React, { useRef, forwardRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

export const RotatingPlanet = forwardRef(({ focusOn = null, ...props }, ref) => {
  const meshRef = useRef();
  const cloudsRef = useRef();

  // Load textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    '/textures/earth_daymap.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png'
  ]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      if (focusOn) {
        // Focus Mode: smoothly rotate to face the target coordinates
        // Agartala: Lat 23.83, Lon 91.28
        // We need to rotate the sphere so that (Lat, Lon) is at (0, 0, Z)

        // Convert Lat/Lon to Radians
        const targetLat = focusOn.lat * (Math.PI / 180);
        const targetLon = -focusOn.lon * (Math.PI / 180); // Negative because texture mapping

        // Target Rotations
        // Y rotation handles Longitude. Offset by -PI/2 usually for ThreeJS spheres starting at Prime Meridian
        const targetRotY = targetLon - Math.PI / 2;
        // X rotation handles Latitude.
        const targetRotX = targetLat;

        // Smooth Damping (Lerp)
        meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 2 * delta;
        meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 2 * delta;

        // Stop Z rotation
        meshRef.current.rotation.z += (0 - meshRef.current.rotation.z) * 2 * delta;

      } else {
        // Idle Mode: Auto Rotate
        meshRef.current.rotation.y += delta * 0.05;
        // Slowly Reset X/Z if they were changed
        meshRef.current.rotation.x += (0 - meshRef.current.rotation.x) * delta;
        meshRef.current.rotation.z += (0 - meshRef.current.rotation.z) * delta;
      }
    }

    // Independent cloud rotation
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.07;
    }
  });

  // Forward the mesh to the parent ref
  React.useImperativeHandle(ref, () => meshRef.current);

  return (
    <group {...props}>
      {/* Earth Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false} // Prevents clouds from occluding the planet weirdly
        />
      </mesh>
    </group>
  );
});

// Export a dummy Planet to avoid breaking imports if App.jsx was still using it (though it uses RotatingPlanet)
export function Planet(props) {
  return <RotatingPlanet {...props} />;
}
