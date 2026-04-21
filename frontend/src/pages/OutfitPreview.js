import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import '../styles/OutfitPreview.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const COLOR_HEX = {
  white: '#f5f5f0', cream: '#f0ece0', ivory: '#f7f3e8',
  black: '#1c1c1c', charcoal: '#3a3a3a',
  gray: '#9a9a96', grey: '#9a9a96', silver: '#c8c8c4',
  navy: '#2c3e6b', blue: '#4a6fa5', denim: '#4a6fa5', cobalt: '#2255aa',
  beige: '#d4b896', tan: '#c8a878', camel: '#c19a6b', khaki: '#c4a96e',
  brown: '#7a5c3e', green: '#5a8a5a', sage: '#8aab88', olive: '#7a8c5a',
  red: '#c0392b', burgundy: '#7a1f2e', rose: '#d4748a',
  pink: '#e8a0b0', coral: '#e8784a', yellow: '#e8c84a', mustard: '#c8a020',
  orange: '#e07830', rust: '#b85c2e', purple: '#7a55b0', teal: '#3a8a8a',
};

function colorToHex(c) {
  if (!c) return '#a0a0a0';
  return COLOR_HEX[c.toLowerCase().trim()] || '#a0a0a0';
}

const norm = s => (s || '').toLowerCase().trim();

const CATEGORY_TO_MODEL = {
  't-shirt': '/models/t_shirt.glb', 'tshirt': '/models/t_shirt.glb',
  'shirt': '/models/t_shirt.glb', 'tee': '/models/t_shirt.glb',
  'blouse': '/models/t_shirt.glb', 'top': '/models/t_shirt.glb',
  'tank top': '/models/t_shirt.glb', 'sweater': '/models/t_shirt.glb',
  'hoodie': '/models/t_shirt.glb',
  'pants': '/models/pants.glb', 'jeans': '/models/pants.glb',
  'trousers': '/models/pants.glb', 'bottom': '/models/pants.glb',
  'shorts': '/models/shorts.glb', 'skirt': '/models/skirt.glb',
  'jacket': '/models/jacket.glb', 'jacket / coat': '/models/jacket.glb',
  'coat': '/models/jacket.glb', 'outerwear': '/models/jacket.glb',
  'blazer': '/models/jacket.glb',
  'shoes': '/models/shoes.glb', 'sneakers': '/models/shoes.glb',
  'boots': '/models/shoes.glb', 'heels': '/models/shoes.glb',
  'loafers': '/models/shoes.glb',
};

function getModelPath(category) {
  return CATEGORY_TO_MODEL[norm(category)] || null;
}

// ─── The key insight: each clothing type has a known fraction of total body height
// A standard human body is ~7.5 heads tall. We use these proportions:
//   Total height = 1.0 (normalized)
//   Head:        0.0  – 0.133  (not shown, mannequin handles)
//   Neck/chest:  0.133 – 0.2
//   Torso:       0.2  – 0.55   ← shirt/hoodie/jacket lives here
//   Waist:       0.45 – 0.55   ← waistband
//   Legs:        0.1  – 0.55   ← pants lives here  
//   Feet:        0.0  – 0.12   ← shoes lives here
//
// In our 2-unit tall scene (mannequin = 2 units):
//   Feet:    y = 0.0
//   Ankles:  y = 0.24
//   Knees:   y = 0.6
//   Waist:   y = 1.0
//   Chest:   y = 1.4
//   Shoulder:y = 1.6
//   Head:    y = 1.8

const BODY_SLOTS = {
  // slot: { yBottom, yTop } — where on the 2-unit body this item lives
  shoes:     { yBottom: 0.0,  yTop: 0.125, zOffset: .14 },
  pants:     { yBottom: 0.0,  yTop: 1.02, zOffset: 0.0 },
  shorts:    { yBottom: 0.55, yTop: 1.05, zOffset: 0.0 },
  skirt:     { yBottom: 0.55, yTop: 1.05, zOffset: 0.0 },
  shirt:     { yBottom: 0.88,  yTop: 1.65, zOffset: 0.0 },
  outerwear: { yBottom: 0.82, yTop: 1.82, zOffset: 0.0 },
};

function getSlot(category) {
  const c = norm(category);
  if (['shoes','sneakers','boots','heels','loafers'].includes(c)) return BODY_SLOTS.shoes;
  if (['pants','jeans','trousers','bottom'].includes(c))           return BODY_SLOTS.pants;
  if (['shorts'].includes(c))                                       return BODY_SLOTS.shorts;
  if (['skirt'].includes(c))                                        return BODY_SLOTS.skirt;
  if (['jacket','jacket / coat','coat','outerwear','blazer'].includes(c)) return BODY_SLOTS.outerwear;
  return BODY_SLOTS.shirt; // all tops default to shirt slot
}

function getRotation(category) {
  const c = norm(category);
  // T-shirts from this source face backward — rotate 180° on Y
  if (['t-shirt','tshirt','shirt','tee','blouse','top','tank top','sweater'].includes(c)) {
    return [0, Math.PI, 0];
  }
  return [0, 0, 0];
}

// ─── Ghost mannequin — very transparent, just a body shape hint ───────────────
function GhostMannequin() {
  const { scene } = useGLTF('/models/male_mannequin.glb');
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // Normalize to 2 units
    cloned.position.set(0, 0, 0);
    cloned.rotation.set(0, 0, 0);
    cloned.scale.set(1, 1, 1);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    if (size.y === 0) return;

    const scale = 2 / size.y;
    cloned.scale.setScalar(scale);
    cloned.updateMatrixWorld(true);

    const box2 = new THREE.Box3().setFromObject(cloned);
    const center = box2.getCenter(new THREE.Vector3());
    cloned.position.set(-center.x, -box2.min.y, -center.z);

    // Make mannequin a very faint ghost — just a silhouette hint
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#d0ccc8'),
          transparent: true,
          opacity: 0.15,  // very faint — just a shape hint
          roughness: 1.0,
          metalness: 0.0,
        });
      }
    });
  }, [cloned]);

  return <primitive object={cloned} />;
}

// ─── Clothing item — scaled to exactly fit its body slot ─────────────────────
function ClothingItem({ modelPath, color, slot, rotation }) {
  const { scene } = useGLTF(modelPath);
  const hex = colorToHex(color);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    // 1. Reset and apply rotation
    cloned.position.set(0, 0, 0);
    cloned.rotation.set(rotation[0], rotation[1], rotation[2]);
    cloned.scale.set(1, 1, 1);
    cloned.updateMatrixWorld(true);

    // 2. Measure current size
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    if (size.y === 0) return;

    // 3. Scale to exactly fill its body slot height
    const slotHeight = slot.yTop - slot.yBottom;
    const scale = slotHeight / size.y;
    cloned.scale.setScalar(scale);
    cloned.updateMatrixWorld(true);

    // 4. Center on x/z, place bottom at slot.yBottom
    const box2 = new THREE.Box3().setFromObject(cloned);
    const center = box2.getCenter(new THREE.Vector3());
    cloned.position.set(
      -center.x,
      -box2.min.y + slot.yBottom,
      -center.z + slot.zOffset,
    );

    // 5. Apply color
    const threeColor = new THREE.Color(hex);
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        const isStitch = child.name.toLowerCase().includes('stitch');
        child.material = new THREE.MeshStandardMaterial({
          color: isStitch ? new THREE.Color('#1a1a1a') : threeColor,
          roughness: 0.85,
          metalness: 0.0,
        });
      }
    });
  }, [cloned, hex, slot, rotation]);

  useEffect(() => {
    return () => {
      cloned.traverse((child) => {
        if (child.isMesh) child.material.dispose();
      });
    };
  }, [cloned]);
  return <primitive object={cloned} />;
}

function ClothingLayer({ category, color, allItems }) {
  const modelPath = getModelPath(category);
  if (!modelPath) return null;

  const c = norm(category);
  const isTop = ['t-shirt', 'tshirt', 'shirt', 'tee', 'blouse', 'top', 'tank top'].includes(c);
  const hasOuterwear = allItems.some(i => ['jacket', 'jacket/coat', 'coat', 'outerwear', 'blazer', 'hoodie', 'sweater']
    .includes(norm(i.category))
  );
  if (isTop && hasOuterwear) return null;

  const slot = getSlot(category);
  const rotation = getRotation(category);
  return (
    <ClothingItem
      modelPath={modelPath}
      color={color}
      slot={slot}
      rotation={rotation}
    />
  );
}

function Scene({ items }) {
  const validItems = Array.isArray(items)
    ? items.filter(i => i && i.category && getModelPath(i.category))
    : [];
  const sceneKey = validItems.map(i => i.category).sort().join('-');

  return (
    <group key={sceneKey}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[2, 4, 3]} intensity={1.5} castShadow />
      <directionalLight position={[-2, 3, -2]} intensity={0.5} />
      <Suspense fallback={null}>
        <GhostMannequin />
        {validItems.map((item, i) => (
          <ClothingLayer
            key={`${item.category}-${i}`}
            category={item.category}
            color={item.color}
            allItems={validItems}
          />
        ))}
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
    </group>
  );
}

function OutfitPreview() {
  const [filters, setFilters]         = useState({ formality: 'all', season: 'all', beamWidth: 5 });
  const [outfits, setOutfits]         = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [generated, setGenerated]     = useState(false);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: name === 'beamWidth' ? Number(value) : value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/outfits/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(filters),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOutfits(data.outfits || []);
      setSelectedIdx(0);
      setGenerated(true);
    } catch (err) {
      console.error('Failed to generate outfits:', err);
      alert('Could not generate outfits. Make sure your wardrobe has items.');
    } finally {
      setLoading(false);
    }
  };

  const currentOutfit = outfits[selectedIdx];

  return (
    <div className="capsule-page">
      <div className="container">
        <h2>Outfit Preview</h2>
        <p className="subtitle">
          Preview how generated outfits will look on your future 2D model
        </p>
        <div className="capsule-section">
          <div className="preferences-panel">
            <h3>Preview Controls</h3>
            <p>Select your preferences and generate outfits to preview them on the 3D mannequin.</p>

            <div className="form-group">
              <label>Formality</label>
              <select name="formality" value={filters.formality} onChange={handleFilterChange}>
                <option value="all">All Levels</option>
                <option value="casual">Casual</option>
                <option value="business">Business</option>
                <option value="formal">Formal</option>
                <option value="athletic">Athletic</option>
              </select>
            </div>

            <div className="form-group">
              <label>Season</label>
              <select name="season" value={filters.season} onChange={handleFilterChange}>
                <option value="all">All Seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div className="form-group">
              <label>Variety</label>
              <select name="beamWidth" value={filters.beamWidth} onChange={handleFilterChange}>
                <option value={3}>Focused</option>
                <option value={5}>Balanced</option>
                <option value={8}>More Variety</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating…' : 'Generate Outfits'}
            </button>

            {generated && outfits.length > 0 && (
              <div className="recommendations-section" style={{ marginTop: '16px' }}>
                <h4>Generated Outfits</h4>
                <ul className="recommendations-list">
                  {outfits.map((outfit, i) => (
                    <li
                      key={i}
                      onClick={() => setSelectedIdx(i)}
                      style={{
                        cursor: 'pointer',
                        fontWeight: selectedIdx === i ? '600' : '400',
                        color: selectedIdx === i ? 'var(--color-primary, #1a56c4)' : 'inherit',
                        padding: '4px 0',
                      }}
                    >
                      Outfit {i + 1}
                      {outfit.score !== undefined && (
                        <span style={{ fontSize: '12px', color: '#aaa', marginLeft: '6px' }}>
                          ★ {outfit.score}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="recommendations-results">
            {!generated ? (
              <div className="empty-state">
                <p>No outfit preview is available yet.</p>
                <p>Once you generate outfits, this page will display them on a 3D mannequin.</p>
              </div>
            ) : outfits.length === 0 ? (
              <div className="empty-state">
                <p>No outfits generated. Try adding more items to your wardrobe.</p>
              </div>
            ) : (
              <>
                <div style={{
                  width: '100%',
                  height: '520px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#f7f7f5',
                  touchAction: 'none',
                }}>
                  <Canvas
                    shadows
                    camera={{ position: [0, 1, 4], fov: 45 }}
                    gl={{ antialias: true }}
                  >
                    <Scene items={currentOutfit?.items ?? []} />
                    <OrbitControls
                      enableZoom={true}
                      enablePan={false}
                      enableRotate={false}
                      minDistance={2}
                      maxDistance={8}
                    />
                  </Canvas>
                </div>

                {currentOutfit?.items?.length > 0 && (
                  <div className="recommendations-section" style={{ marginTop: '16px' }}>
                    <h4>Outfit {selectedIdx + 1} Items</h4>
                    <ul className="recommendations-list">
                      {currentOutfit.items.map((item, i) => (
                        <li key={i}>
                          <span style={{
                            display: 'inline-block',
                            width: '10px', height: '10px',
                            borderRadius: '50%',
                            background: colorToHex(item.color),
                            border: '0.5px solid rgba(0,0,0,0.15)',
                            marginRight: '8px', verticalAlign: 'middle',
                          }} />
                          {item.name} — {item.category}, {item.color}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload('/models/male_mannequin.glb');
useGLTF.preload('/models/t_shirt.glb');
useGLTF.preload('/models/pants.glb');
useGLTF.preload('/models/jacket.glb');
useGLTF.preload('/models/shoes.glb');

export default OutfitPreview;