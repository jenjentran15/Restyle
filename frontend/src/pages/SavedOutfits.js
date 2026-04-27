import React from 'react';
import { useOutfit } from '../content/OutfitProvider';
import '../styles/OutfitGenerator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function SavedOutfits() {
  const { savedOutfits, removeSavedOutfit } = useOutfit();

  if (savedOutfits.length === 0) {
    return (
      <div className="analyzer-page">
        <div className="container">
          <h2>Saved Outfits</h2>
          <p className="subtitle">Your saved generated outfit combinations will appear here</p>
          <div className="analysis-results" style={{ marginTop: '2rem' }}>
            <div className="empty-state">
              <p>
                Go to the <a href="/outfit-generator">Outfit Generator</a> to generate and save outfit combinations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analyzer-page">
      <div className="container">
        <h2>Saved Outfits</h2>
        <p className="subtitle">Your saved generated outfit combinations</p>

        <div className="analysis-results">
          <div className="compatibility-section">
            <h3>Your Saved Outfits</h3>

            <div className="utilization-list">
              {savedOutfits.map((outfit, index) => (
                <div key={index} className="utilization-item">
                  {/* Left column — outfit label */}
                  <div className="item-info">
                    <p className="item-name">Outfit {index + 1}</p>
                    {outfit.score !== undefined && (
                      <p className="item-category">Score: {outfit.score}</p>
                    )}
                    <button
                      onClick={() => removeSavedOutfit(index)}
                      className="btn btn-primary"
                      style={{
                        marginTop: '12px',
                        background: '#c0392b',
                        width: 'auto',
                        padding: '8px 16px',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  {/* Right column — items list */}
                  <div className="outfit-items">
                    {outfit.items && outfit.items.length > 0 ? (
                      <ul className="insights-list">
                        {outfit.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="outfit-item-entry">
                            {item.image_url && (
                              <img
                                src={`${API_URL}${item.image_url}`}
                                alt={item.name}
                                className="outfit-item-image"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  marginBottom: '0.5rem',
                                  display: 'block',
                                }}
                              />
                            )}
                            <span>
                              {item.name} ({item.category}, {item.color})
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="item-category">No items available for this outfit.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SavedOutfits;