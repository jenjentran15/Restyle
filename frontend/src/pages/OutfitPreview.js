import React, { Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import '../styles/OutfitPreview.css';
import { useOutfit } from '../content/OutfitContext';

const COLORS = {
  white:'#f5f5f0', cream:'#f0ece0', black:'#1c1c1c', gray:'#9a9a96',
  silver:'#c8c8c4', navy:'#2c3e6b', blue:'#4a6fa5', beige:'#d4b896',
  tan:'#c8a878', brown:'#7a5c3e', green:'#5a8a5a', olive:'#7a8c5a',
  red:'#c0392b', pink:'#e8a0b0', yellow:'#e8c84a', orange:'#e07830',
  purple:'#7a55b0', teal:'#3a8a8a',
};

const toHex = c => COLORS[(c || '').toLowerCase().trim()] || '#a0a0a0';
const norm = s => (s || '').toLowerCase().trim();
const isTop = c => ['t-shirt','tshirt','shirt','tee','blouse','top','tank top','sweater'].includes(norm(c));
const isBottom = c => ['pants','jeans','trousers','bottom','shorts','skirt'].includes(norm(c));
const isShoes = c => ['shoes','sneakers','boots','heels','loafers'].includes(norm(c));
const isOuterwear = c => ['jacket','jacket / coat','coat','outerwear','blazer','hoodie'].includes(norm(c));

function getMeshType(n) {
  if (['Object_6','Object_7'].includes(n)) return 'mannequin';
  if (n.includes('Shoe_L_') || n.includes('Shoe_R_')) return 'shoes';
  if (n.includes('Trousers') || /^(Cube0|Cylinder|Plane)/.test(n)) return 'pants';
  if (['Object_4','Object_5001','Object_6001','Object_7001'].includes(n)) return 'shirt';
  if (n.startsWith('Hoodie_')) return 'hoodie';
  return null;
}

const mat = color => new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.85, metalness: 0 });

function OutfitModel({ top, bottom, shoes, outerwear }) {
  const { scene } = useGLTF('/models/outfit.glb');
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cloned.position.set(0, 0, 0);
    cloned.rotation.set(0, 0, 0);
    cloned.scale.set(1, 1, 1);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      cloned.scale.setScalar(2 / size.y);
      cloned.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(cloned);
      const c2 = b2.getCenter(new THREE.Vector3());
      cloned.position.set(-c2.x, -b2.min.y, -c2.z);
    }

    cloned.traverse((child) => {
      if (!child.isMesh) return;
      const type = getMeshType(child.name);
      if (!type) return;
      child.castShadow = true;
      switch (type) {
        case 'mannequin': child.visible = true; child.material = mat('#c8b89a'); break;
        case 'shirt': child.visible = !!top && !outerwear; child.material = mat(top ? toHex(top.color) : '#a0a0a0'); break;
        case 'hoodie': child.visible = !!outerwear; child.material = mat(outerwear ? toHex(outerwear.color) : '#a0a0a0'); break;
        case 'pants': child.visible = !!bottom; child.material = mat(bottom ? toHex(bottom.color) : '#a0a0a0'); break;
        case 'shoes': child.visible = !!shoes; child.material = mat(shoes ? toHex(shoes.color) : '#a0a0a0'); break;
        default: break;
      }
    });
  }, [cloned, top, bottom, shoes, outerwear]);

  useEffect(() => () => cloned.traverse(c => c.isMesh && c.material.dispose()), [cloned]);

  return <primitive object={cloned} />;
}

function Scene({ items }) {
  const top = items.find(i => isTop(i.category)) || null;
  const bottom = items.find(i => isBottom(i.category)) || null;
  const shoes = items.find(i => isShoes(i.category)) || null;
  const outerwear = items.find(i => isOuterwear(i.category)) || null;
  return (
    <group>
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.5} />
      <Suspense fallback={null}>
        <OutfitModel top={top} bottom={bottom} shoes={shoes} outerwear={outerwear} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
    </group>
  );
}

function OutfitPreview() {
  const { outfits, selectedIdx, setSelectedIdx } = useOutfit();
  const outfit = outfits[selectedIdx] || null;

  return (
    <div className="capsule-page">
      <div className="container">
        <h2>Outfit Preview</h2>
        <p className="subtitle">Preview how generated outfits will look on your 3D model</p>
        <div className="capsule-section">

          <div className="preferences-panel">
            <h3>Preview Controls</h3>
            {outfits.length === 0 ? (
              <p>Go to the <a href="/outfit-generator">Outfit Generator</a> to generate outfits.</p>
            ) : (
              <>
                <div className="recommendations-section">
                  <h4>Generated Outfits</h4>
                  <ul className="recommendations-list">
                    {outfits.map((o, i) => (
                      <li key={i} onClick={() => setSelectedIdx(i)} style={{
                        cursor: 'pointer',
                        fontWeight: selectedIdx === i ? '600' : '400',
                        color: selectedIdx === i ? 'var(--color-primary, #1a56c4)' : 'inherit',
                        padding: '4px 0',
                      }}>
                        Outfit {i + 1}
                        {o.score !== undefined && (
                          <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '6px' }}>★ {o.score}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {outfit && (
                  <div className="recommendations-section" style={{ marginTop: '16px' }}>
                    <h4>Outfit {selectedIdx + 1} Items</h4>
                    <ul className="recommendations-list">
                      {outfit.items?.map((item, i) => (
                        <li key={i}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            background: toHex(item.color), color: '#fff',
                            fontSize: '11px', fontWeight: '500',
                            padding: '2px 8px', borderRadius: '20px',
                            marginRight: '6px', verticalAlign: 'middle',
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                          }}>{item.color}</span>
                          {item.name} — {item.category}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="recommendations-results">
            {outfits.length === 0 ? (
              <div className="empty-state">
                <p>No outfits generated yet.</p>
                <p>Go to the Outfit Generator page to generate outfit combinations.</p>
              </div>
            ) : (
              <div style={{ width:'100%', height:'520px', borderRadius:'12px', overflow:'hidden', background:'#f7f7f5', touchAction:'none' }}>
                <Canvas shadows camera={{ position:[0, 0.915, 2.8], fov:50 }} gl={{ antialias:true }}>
                  <Scene items={outfit?.items ?? []} />
                  <OrbitControls enableZoom enablePan={false} enableRotate={false} minDistance={1.5} maxDistance={6} target={[0, 0.915, 0]} />
                </Canvas>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/outfit.glb');
export default OutfitPreview;