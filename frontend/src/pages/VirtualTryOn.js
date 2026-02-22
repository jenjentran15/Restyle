import React, { useState, useRef } from 'react';
import '../styles/VirtualTryOn.css';
import Avatar3D from '../components/Avatar3D';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function VirtualTryOn() {
  const [avatarSettings, setAvatarSettings] = useState({
    bodyType: 'average',
    height: 170,
    skinTone: '#f4a460',
    gender: 'female'
  });
  const [wardrobe, setWardrobe] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState({
    top: null,
    bottom: null,
    shoes: null,
    accessory: null
  });
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);

  const handleAvatarChange = (e) => {
    const { name, value } = e.target;
    setAvatarSettings({ ...avatarSettings, [name]: value });
  };

  const fetchWardrobe = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/wardrobe`);
      const data = await response.json();
      setWardrobe(data);
    } catch (error) {
      console.error('Error fetching wardrobe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClothingSelect = (type, item) => {
    setSelectedOutfit({ ...selectedOutfit, [type]: item });
  };

  const handleSaveOutfit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/save-outfit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit: selectedOutfit,
          avatar: avatarSettings
        })
      });

      if (!response.ok) throw new Error('Failed to save outfit');
      alert('Outfit saved successfully!');
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Failed to save outfit');
    }
  };

  return (
    <div className="virtual-tryon-page">
      <div className="container">
        <h2>👗 Virtual Try-On Room</h2>
        <p className="subtitle">Create your avatar and mix & match your wardrobe</p>

        <div className="tryon-section">
          {/* Avatar Settings */}
          <div className="avatar-panel">
            <h3>Your Avatar</h3>
            
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={avatarSettings.gender} onChange={handleAvatarChange}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>

            <div className="form-group">
              <label>Body Type</label>
              <select name="bodyType" value={avatarSettings.bodyType} onChange={handleAvatarChange}>
                <option value="slim">Slim</option>
                <option value="average">Average</option>
                <option value="athletic">Athletic</option>
                <option value="curvy">Curvy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Height (cm)</label>
              <input
                type="range"
                name="height"
                min="150"
                max="200"
                value={avatarSettings.height}
                onChange={handleAvatarChange}
              />
              <span className="value">{avatarSettings.height} cm</span>
            </div>

            <div className="form-group">
              <label>Skin Tone</label>
              <input
                type="color"
                name="skinTone"
                value={avatarSettings.skinTone}
                onChange={handleAvatarChange}
              />
            </div>

            <button className="btn btn-secondary" onClick={fetchWardrobe} disabled={loading}>
              {loading ? 'Loading...' : 'Load Wardrobe Items'}
            </button>
          </div>

          {/* 3D Model Canvas */}
          <div className="avatar-canvas">
            <h3>Avatar Preview</h3>
            <Avatar3D 
              settings={avatarSettings} 
              outfit={selectedOutfit}
              ref={canvasRef}
            />
          </div>

          {/* Clothing Selection */}
          <div className="clothing-panel">
            <h3>Your Wardrobe</h3>
            
            {['top', 'bottom', 'shoes', 'accessory'].map(type => (
              <div key={type} className="clothing-category">
                <h4 className="category-title">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </h4>
                <div className="clothing-items">
                  {wardrobe.filter(item => item.type === type).map(item => (
                    <div
                      key={item.id}
                      className={`clothing-item ${selectedOutfit[type]?.id === item.id ? 'selected' : ''}`}
                      onClick={() => handleClothingSelect(type, item)}
                    >
                      <img src={item.imageUrl} alt={item.color} />
                      <span className="label">{item.color}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button className="btn btn-primary" onClick={handleSaveOutfit}>
              💾 Save This Outfit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualTryOn;
