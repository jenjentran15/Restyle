import React, { useState } from 'react';
import '../styles/UploadClothes.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function UploadClothes() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clothingDetails, setClothingDetails] = useState({
    type: 'top',
    color: '',
    brand: '',
    size: 'M'
  });
  const [uploadedItems, setUploadedItems] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    
    // Create previews
    const previewUrls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClothingDetails({ ...clothingDetails, [name]: value });
  };

  const handleRemoveBackground = async () => {
    if (files.length === 0) {
      alert('Please select an image first');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await fetch(`${API_URL}/api/remove-background`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to remove background');
      }

      const data = await response.json();
      
      if (data.success && data.processedImage) {
        // Create preview from base64
        setPreviews([data.processedImage]);
        alert('Background removed successfully!');
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      alert('Failed to remove background: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select an image');
      return;
    }

    if (!clothingDetails.color) {
      alert('Please enter a color');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', files[0]);
    formData.append('type', clothingDetails.type);
    formData.append('color', clothingDetails.color);
    formData.append('brand', clothingDetails.brand);
    formData.append('size', clothingDetails.size);

    try {
      const response = await fetch(`${API_URL}/api/upload-clothing`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedItems([...uploadedItems, data.clothing_item || data]);
      setFiles([]);
      setPreviews([]);
      setClothingDetails({
        type: 'top',
        color: '',
        brand: '',
        size: 'M'
      });
      alert('Clothing item uploaded successfully!');
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Failed to upload clothing item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-clothes-page">
      <div className="container">
        <h2>📸 Upload Your Clothes</h2>
        <p className="subtitle">Upload images of your clothing items to try them on virtually</p>

        <div className="upload-section">
          <div className="upload-form">
            <h3>Upload & Process Image</h3>
            
            <div className="file-upload-area">
              <input
                type="file"
                id="file-input"
                accept="image/*"
                onChange={handleFileSelect}
                multiple={false}
              />
              <label htmlFor="file-input">
                <div className="upload-icon">📷</div>
                <p>Click to select image</p>
                <p className="hint">or drag & drop</p>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="preview-section">
                <h4>Preview</h4>
                <div className="preview-images">
                  <div className="preview-image">
                    <img src={previews[0]} alt="Preview" />
                  </div>
                </div>
              </div>
            )}

            <h3 style={{ marginTop: '30px' }}>Clothing Details</h3>
            
            <div className="form-group">
              <label>Clothing Type</label>
              <select name="type" value={clothingDetails.type} onChange={handleInputChange}>
                <option value="top">Top/Shirt</option>
                <option value="bottom">Bottom/Pants</option>
                <option value="dress">Dress</option>
                <option value="jacket">Jacket</option>
                <option value="shoes">Shoes</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Color *</label>
                <input
                  type="text"
                  name="color"
                  value={clothingDetails.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Blue"
                  required
                />
              </div>

              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={clothingDetails.brand}
                  onChange={handleInputChange}
                  placeholder="e.g., Nike"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Size</label>
              <select name="size" value={clothingDetails.size} onChange={handleInputChange}>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>

            <div className="button-group">
              <button 
                className="btn btn-secondary" 
                onClick={handleRemoveBackground}
                disabled={loading || files.length === 0}
              >
                {loading ? '⏳ Processing...' : '🎨 Remove Background'}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUpload}
                disabled={loading || files.length === 0}
              >
                {loading ? '⏳ Uploading...' : '📦 Upload to Wardrobe'}
              </button>
            </div>
          </div>

          <div className="uploaded-items-section">
            <h3>{uploadedItems.length > 0 ? `✅ Uploaded Items (${uploadedItems.length})` : '📋 Uploaded Items (0)'}</h3>
            {uploadedItems.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🧥</div>
                <p>No items uploaded yet. Upload your first piece!</p>
              </div>
            ) : (
              <div className="uploaded-items">
                {uploadedItems.map((item, idx) => (
                  <div key={idx} className="uploaded-item">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.category || item.type} className="item-image" />}
                    <div className="item-details">
                      <div className="item-type">{item.category || item.type}</div>
                      <div className="item-info"><strong>Color:</strong> {item.color}</div>
                      <div className="item-info"><strong>Brand:</strong> {item.name || item.brand || 'Unknown'}</div>
                      {item.size && <div className="item-info"><strong>Size:</strong> {item.size}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadClothes;
