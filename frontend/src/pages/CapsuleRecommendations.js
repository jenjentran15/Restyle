import React, { useState } from 'react';
import '../styles/CapsuleRecommendations.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function CapsuleRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    desiredSize: 20,
    lifestyle: 'mixed',
    budget: 'medium',
    climate: 'temperate'
  });

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences({ ...preferences, [name]: value });
  };

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/capsule/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate capsule recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="capsule-page">
      <div className="container">
        <h2>✨ Capsule Wardrobe Generator</h2>
        <p className="subtitle">Get AI-powered recommendations for a minimal wardrobe that maximizes outfit variety</p>

        <div className="capsule-section">
          <div className="preferences-panel">
            <h3>Your Preferences</h3>

            <div className="form-group">
              <label>Desired Capsule Size</label>
              <div className="slider-group">
                <input
                  type="range"
                  name="desiredSize"
                  min="10"
                  max="50"
                  value={preferences.desiredSize}
                  onChange={handlePreferenceChange}
                />
                <span className="slider-value">{preferences.desiredSize} items</span>
              </div>
            </div>

            <div className="form-group">
              <label>Lifestyle</label>
              <select name="lifestyle" value={preferences.lifestyle} onChange={handlePreferenceChange}>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="mixed">Mixed (Work + Casual)</option>
                <option value="creative">Creative</option>
              </select>
            </div>

            <div className="form-group">
              <label>Climate</label>
              <select name="climate" value={preferences.climate} onChange={handlePreferenceChange}>
                <option value="tropical">Tropical</option>
                <option value="temperate">Temperate</option>
                <option value="cold">Cold</option>
                <option value="varied">Varied Seasons</option>
              </select>
            </div>

            <div className="form-group">
              <label>Budget Priority</label>
              <select name="budget" value={preferences.budget} onChange={handlePreferenceChange}>
                <option value="budget">Budget-Friendly</option>
                <option value="medium">Medium Range</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateRecommendations}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Capsule'}
            </button>
          </div>

          <div className="recommendations-results">
            {!recommendations ? (
              <div className="empty-state">
                <p>Adjust your preferences and click "Generate Capsule" to receive personalized recommendations.</p>
                <p>We'll analyze your wardrobe to suggest a minimal set of items that maximize outfit combinations.</p>
              </div>
            ) : (
              <>
                <div className="recommendation-header">
                  <h3>Your Recommended Capsule</h3>
                  <div className="capsule-stats">
                    <div className="stat">
                      <p className="label">Items</p>
                      <p className="value">{recommendations.capsuleSize || 0}</p>
                    </div>
                    <div className="stat">
                      <p className="label">Outfit Combos</p>
                      <p className="value">{recommendations.potentialOutfits || 0}</p>
                    </div>
                    <div className="stat">
                      <p className="label">Wardrobe Reduction</p>
                      <p className="value">{recommendations.reductionPercentage || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="capsule-items">
                  <h4>Recommended Items by Category</h4>
                  {recommendations.itemsByCategory ? (
                    Object.entries(recommendations.itemsByCategory).map(([category, items]) => (
                      <div key={category} className="category-group">
                        <h5>{category.charAt(0).toUpperCase() + category.slice(1)}</h5>
                        <div className="items-list">
                          {items.map((item, index) => (
                            <div key={index} className="recommended-item">
                              <div className="item-name">{item.name}</div>
                              <div className="item-reason">
                                <span className="badge">{item.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No recommendations available yet.</p>
                  )}
                </div>

                <div className="recommendations-section">
                  <h4>Additional Recommendations</h4>
                  {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
                    <ul className="recommendations-list">
                      {recommendations.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Add more items to your wardrobe for detailed recommendations.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CapsuleRecommendations;
