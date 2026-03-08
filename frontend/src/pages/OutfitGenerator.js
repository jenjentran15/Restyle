/* OutfitGenerator.js - page that sends outfit filters to backend
 * and displays generated outfit combinations.
 */
import React, { useState } from 'react';
import '../styles/OutfitGenerator.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function OutfitGenerator() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    formality: 'all',
    season: 'all',
    beamWidth: 5
  });

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/outfits/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(selectedFilters)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error generating outfits:', error);
      alert('Failed to generate outfits');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setSelectedFilters((prev) => ({
      ...prev,
      [name]: name === 'beamWidth' ? Number(value) : value
    }));
  };

  return (
    <div className="analyzer-page">
      <div className="container">
        <h2>✨ Outfit Generator</h2>
        <p className="subtitle">
          Generate outfit combinations from your wardrobe based on your style filters
        </p>

        <div className="analyzer-section">
          <div className="filter-panel">
            <h3>Generation Filters</h3>

            <div className="form-group">
              <label>Formality Level</label>
              <select
                name="formality"
                value={selectedFilters.formality}
                onChange={handleFilterChange}
              >
                <option value="all">All Levels</option>
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
                value={selectedFilters.season}
                onChange={handleFilterChange}
              >
                <option value="all">All Seasons</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="fall">Fall</option>
                <option value="winter">Winter</option>
              </select>
            </div>

            <div className="form-group">
              <label>Outfit Variety</label>
              <select
                name="beamWidth"
                value={selectedFilters.beamWidth}
                onChange={handleFilterChange}
              >
                <option value={3}>Focused</option>
                <option value={5}>Balanced</option>
                <option value={8}>More Variety</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Outfits'}
            </button>
          </div>

          <div className="analysis-results">
            {!results ? (
              <div className="empty-state">
                <p>Select your preferences and click "Generate Outfits" to get started.</p>
                <p>Your wardrobe items will be used to build outfit combinations.</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Wardrobe Items</h4>
                    <p className="stat-value">{results.totalItems || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Generated Outfits</h4>
                    <p className="stat-value">{results.totalOutfitsGenerated || 0}</p>
                  </div>
                </div>

                <div className="compatibility-section">
                  <h3>Generated Outfit Ideas</h3>

                  {results.outfits && results.outfits.length > 0 ? (
                    <div className="utilization-list">
                      {results.outfits.map((outfit, index) => (
                        <div key={index} className="utilization-item">
                          <div className="item-info">
                            <p className="item-name">Outfit {index + 1}</p>
                            {outfit.score !== undefined && (
                              <p className="item-category">Score: {outfit.score}</p>
                            )}
                          </div>

                          <div className="outfit-items">
                            {outfit.items && outfit.items.length > 0 ? (
                              <ul className="insights-list">
                                {outfit.items.map((item, itemIndex) => (
                                  <li key={itemIndex}>
                                    {item.name} ({item.category}, {item.color})
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No items available for this outfit.</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No outfits generated. Add more wardrobe items and try again.</p>
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

export default OutfitGenerator;