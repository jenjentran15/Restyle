/* Wardrobe.js - page for viewing and managing wardrobe items.
 * Fetches from /api/clothing and allows add/delete operations.
 * Supports both manual item entry and image upload.
 */
import React, { useState, useEffect } from 'react';
import '../styles/Wardrobe.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Wardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'top',
    color: '',
    formality: 'casual',
    season: 'all',
    notes: '',
    image: null
  });
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(null);

  useEffect(() => { fetchClothingItems(); }, []);

  const fetchClothingItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setItems([]);
        setError('Please log in to view your wardrobe.');
        return;
      }

      const response = await fetch(`${API_URL}/api/clothing`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        setItems([]);
        setError('Your session expired. Please log in again.');
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to load wardrobe (HTTP ${response.status})`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error('Error fetching clothing items:', error);
      setError(error.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: value}));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null;
    setNewItem((prev) => ({...prev, image: file}));
    setScanError(null);
    setScanSuccess(null);
  };

  const handleScanPhoto = async () => {
    if (!newItem.image) return alert('Choose an image first, then click scan.');

    const token = localStorage.getItem('token');

    if (!token) return alert('Please log in to scan photos.');

    setScanError(null);
    setScanSuccess(null);
    setScanLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', newItem.image);
      const response = await fetch(`${API_URL}/api/predict-clothing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`},
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        const msg = data.message || data.error ||
          (response.status === 503
            ? 'Prediction service is not running. Start: python clothing_predict_server.py'
            : 'Scan failed');
        throw new Error(msg);
      }
      setNewItem((prev) => ({
        ...prev,
        name: data.suggestedName || prev.name,
        category: data.category || prev.category,
        color: data.color || prev.color,
        season: data.season || prev.season
      }));
      const summary =
        data.description ||
        `${data.rawCategory || data.category}, ${data.color}, ${data.season}`;
      const conf = data.confidence;
      const confOk = typeof conf === 'number' && !Number.isNaN(conf);
      setScanSuccess(
        confOk
          ? `${summary} (model confidence ${Math.round(Math.min(conf, 1) * 100)}%)`
          : summary
      );
    } catch (err) {
      console.error('Scan error:', err);
      setScanError(err.message || 'Scan failed');
    } finally {
      setScanLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();

    if (!newItem.name || !newItem.color || !newItem.category) {
      return alert('Please fill in all required fields');
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return alert('Please log in before adding items.');
      }
      let response;

      if (newItem.image) {
        const formData = new FormData();
        formData.append('image', newItem.image);
        formData.append('name', newItem.name);
        formData.append('category', newItem.category);
        formData.append('color', newItem.color);
        formData.append('formality', newItem.formality);
        formData.append('season', newItem.season);
        formData.append('notes', newItem.notes);

        response = await fetch(`${API_URL}/api/upload-clothing`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`},
          body: formData
        });
      } else {
        response = await fetch(`${API_URL}/api/clothing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newItem.name,
            category: newItem.category,
            color: newItem.color,
            formality: newItem.formality,
            season: newItem.season,
            notes: newItem.notes
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setNewItem({
        name: '',
        category: 'top',
        color: '',
        formality: 'casual',
        season: 'all',
        notes: '',
        image: null
      });
      setScanError(null);
      setScanSuccess(null);

      const fileInput = document.getElementById('item-image-input');
      if (fileInput) fileInput.value = '';

      setShowAddForm(false);
      fetchClothingItems();
      alert('Clothing item added successfully!');
    } catch (error) {
      console.error('Error adding clothing item:', error);
      alert(`Failed to add clothing item: ${error.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/clothing/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}`}
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        fetchClothingItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Failed to delete item: ${error.message}`);
      }
    }
  };

  return (
    <div className="inventory-page">
      <div className="container">
        <h2>My Wardrobe</h2>
        <div className="wardrobe-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const token = localStorage.getItem('token');
              if (!token) {
                if (window.confirm('You need to be logged in to add items. Go to login page?')) {
                  window.location.href = '/login';
                }
                return;
              }
              setShowAddForm((prev) => !prev);
            }}
          >
            {showAddForm ? 'Close Add Item Form' : '+ Add Clothing Item'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-item-section">
            <h3>Add New Clothing Item</h3>
            <form onSubmit={handleAddItem} className="add-item-form">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Blue Jeans, White T-shirt"
                  required
                />
              </div>

              <div className="form-group">
                <label>Item Image</label>
                <input
                  id="item-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleScanPhoto}
                    disabled={scanLoading || !newItem.image}
                  >
                    {scanLoading ? 'Scanning…' : 'Scan photo & fill fields'}
                  </button>
                  <span style={{ fontSize: '0.9rem', color: '#555' }}>
                    Lightweight local scan (Python server). Optional: add PyTorch later for better type detection.
                  </span>
                </div>
                {scanError && (
                  <p style={{ color: '#c33', marginTop: '0.5rem', fontSize: '0.9rem' }} role="alert">
                    {scanError}
                  </p>
                )}
                {scanSuccess && (
                  <p style={{ color: '#1a7f37', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {scanSuccess} — edit below if anything looks wrong.
                  </p>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={newItem.category}
                    onChange={handleInputChange}
                  >
                    <optgroup label="Tops">
                      <option value="t-shirt">T-shirt</option>
                      <option value="shirt">Shirt</option>
                      <option value="blouse">Blouse</option>
                      <option value="sweater">Sweater</option>
                      <option value="hoodie">Hoodie</option>
                      <option value="tank top">Tank top</option>
                      <option value="top">Top (generic)</option>
                    </optgroup>
                    <optgroup label="Bottoms">
                      <option value="jeans">Jeans</option>
                      <option value="pants">Pants</option>
                      <option value="shorts">Shorts</option>
                      <option value="skirt">Skirt</option>
                      <option value="bottom">Bottom (generic)</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="dress">Dress</option>
                      <option value="jacket">Jacket / coat</option>
                      <option value="shoes">Shoes</option>
                      <option value="accessory">Accessory</option>
                    </optgroup>
                  </select>
                </div>

                <div className="form-group">
                  <label>Color *</label>
                  <input
                    type="text"
                    name="color"
                    value={newItem.color}
                    onChange={handleInputChange}
                    placeholder="e.g., Blue, Red, Black"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Formality Level</label>
                  <select
                    name="formality"
                    value={newItem.formality}
                    onChange={handleInputChange}
                  >
                    <option value="casual">Casual</option>
                    <option value="business">Business</option>
                    <option value="formal">Formal</option>
                    <option value="athletic">Athletic</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Season</label>
                  <select
                    name="season"
                    value={newItem.season}
                    onChange={handleInputChange}
                  >
                    <option value="all">All Seasons</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={newItem.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional details about this item"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn btn-primary"> Add Item </button>
            </form>
          </div>
        )}

        <div className="items-section">
          <h3>Your Items ({items.length})</h3>
          {loading ? ( <p>Loading your wardrobe...</p>) : items.length === 0 ? 
          (
            <p className="empty-state">
              No items in your wardrobe yet. Add your first item above!
            </p>
          ) : (
            <div className="items-grid">
              {items.map((item) => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <h4>{item.name}</h4>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Delete item"
                    >
                      ✕
                    </button>
                  </div>

                  {item.image_url && (
                    <div className="item-image">
                      <img
                        src={`${API_URL}${item.image_url}`}
                        alt={item.name}
                        style={{
                          width: '100%',
                          maxHeight: '220px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          marginBottom: '1rem'
                        }}
                      />
                    </div>
                  )}

                  <div className="item-details">
                    <p><strong>Category:</strong> {item.category}</p>
                    <p><strong>Color:</strong> <span className="color-tag">{item.color}</span></p>
                    <p><strong>Formality:</strong> {item.formality}</p>
                    <p><strong>Season:</strong> {item.season}</p>
                    {item.notes && <p><strong>Notes:</strong> {item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Wardrobe;