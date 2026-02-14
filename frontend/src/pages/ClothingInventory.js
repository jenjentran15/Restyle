import React, { useState, useEffect } from 'react';
import '../styles/ClothingInventory.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ClothingInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'top',
    color: '',
    formality: 'casual',
    season: 'all',
    notes: ''
  });

  useEffect(() => {
    fetchClothingItems();
  }, []);

  const fetchClothingItems = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching from:', `${API_URL}/api/clothing`)
      const response = await fetch(`${API_URL}/api/clothing`);

      if(!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if(Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        console.error('Unexpected data format:', data);
        setItems([]);
        setError('Received invalid data format from server');
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
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.color) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/clothing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        setNewItem({
          name: '',
          category: 'top',
          color: '',
          formality: 'casual',
          season: 'all',
          notes: ''
        });
        fetchClothingItems();
        alert('Clothing item added successfully!');
      }
    } catch (error) {
      console.error('Error adding clothing item:', error);
      alert('Failed to add clothing item');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await fetch(`${API_URL}/api/clothing/${id}`, {
          method: 'DELETE'
        });
        fetchClothingItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  return (
    <div className="inventory-page">
      <div className="container">
        <h2>👕 My Wardrobe Inventory</h2>
        
        {error && (
          <div className="error-banner" style={{
            background: '#fee',
            color: '#c33',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            Error: {error}
          </div>
        )}

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

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={newItem.category} onChange={handleInputChange}>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="dress">Dress</option>
                  <option value="jacket">Jacket</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessory">Accessory</option>
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
                <select name="formality" value={newItem.formality} onChange={handleInputChange}>
                  <option value="casual">Casual</option>
                  <option value="business">Business</option>
                  <option value="formal">Formal</option>
                  <option value="athletic">Athletic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Season</label>
                <select name="season" value={newItem.season} onChange={handleInputChange}>
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

            <button type="submit" className="btn btn-primary">Add Item</button>
          </form>
        </div>

        <div className="items-section">
          <h3>Your Items ({items.length})</h3>
          {loading ? (
            <p>Loading your wardrobe...</p>
          ) : items.length === 0 ? (
            <p className="empty-state">No items in your wardrobe yet. Add your first item above!</p>
          ) : (
            <div className="items-grid">
              {items.map(item => (
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

export default ClothingInventory;
