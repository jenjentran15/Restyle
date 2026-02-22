import React, { forwardRef, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const AvatarModel = ({ settings, outfit }) => {
  const groupRef = useRef();

  // Create 3D body parts based on avatar settings
  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous geometry
    groupRef.current.children.forEach(child => groupRef.current.remove(child));

    // Body (torso)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: settings.skinTone });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.name = 'body';
    groupRef.current.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({ color: settings.skinTone });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 0.8;
    head.name = 'head';
    groupRef.current.add(head);

    // Arms
    const armGeometry = new THREE.CapsuleGeometry(0.1, 0.7, 4, 8);
    const armLeft = new THREE.Mesh(armGeometry, bodyMaterial);
    armLeft.position.set(-0.5, 0.3, 0);
    armLeft.rotation.z = Math.PI / 6;
    armLeft.name = 'armLeft';
    groupRef.current.add(armLeft);

    const armRight = new THREE.Mesh(armGeometry, bodyMaterial);
    armRight.position.set(0.5, 0.3, 0);
    armRight.rotation.z = -Math.PI / 6;
    armRight.name = 'armRight';
    groupRef.current.add(armRight);

    // Legs
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.8, 4, 8);
    const legLeft = new THREE.Mesh(legGeometry, bodyMaterial);
    legLeft.position.set(-0.2, -0.8, 0);
    legLeft.name = 'legLeft';
    groupRef.current.add(legLeft);

    const legRight = new THREE.Mesh(legGeometry, bodyMaterial);
    legRight.position.set(0.2, -0.8, 0);
    legRight.name = 'legRight';
    groupRef.current.add(legRight);

    // Add clothing if selected
    if (outfit.top) {
      const topGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.2);
      const topMaterial = new THREE.MeshPhongMaterial({ color: outfit.top.color || '#ff0000' });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 0.3;
      top.name = 'clothing-top';
      groupRef.current.add(top);
    }

    if (outfit.bottom) {
      const bottomGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.15);
      const bottomMaterial = new THREE.MeshPhongMaterial({ color: outfit.bottom.color || '#0000ff' });
      const bottom = new THREE.Mesh(bottomGeometry, bottomMaterial);
      bottom.position.y = -0.3;
      bottom.name = 'clothing-bottom';
      groupRef.current.add(bottom);
    }

    if (outfit.shoes) {
      const shoeGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.3);
      const shoeMaterial = new THREE.MeshPhongMaterial({ color: outfit.shoes.color || '#8b0000' });
      const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
      shoe.position.y = -1.35;
      shoe.name = 'clothing-shoes';
      groupRef.current.add(shoe);
    }

    // Scale based on body type
    const bodyScales = {
      slim: 0.85,
      average: 1,
      athletic: 1.1,
      curvy: 1.15
    };
    const scale = bodyScales[settings.bodyType] || 1;
    groupRef.current.scale.set(scale, scale * (settings.height / 170), scale);
  }, [settings, outfit]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Avatar geometry is generated in useEffect */}
    </group>
  );
};

const Lighting = () => (
  <>
    <ambientLight intensity={0.6} />
    <pointLight position={[10, 10, 10]} intensity={0.8} />
    <pointLight position={[-10, -10, -10]} intensity={0.4} />
  </>
);

const Avatar3D = forwardRef(({ settings, outfit }, ref) => {
  return (
    <Canvas
      ref={ref}
      style={{ width: '100%', height: '500px' }}
      camera={{ position: [0, 0, 3], fov: 50 }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={50} />
      <Lighting />
      <AvatarModel settings={settings} outfit={outfit} />
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={5}
      />
      <gridHelper args={[10, 10]} />
      <color attach="background" args={['#f0f0f0']} />
    </Canvas>
  );
});

Avatar3D.displayName = 'Avatar3D';

export default Avatar3D;
