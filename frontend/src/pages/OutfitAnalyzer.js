import React, { useState } from 'react';
import '../styles/OutfitAnalyzer.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function OutfitAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    formality: 'all',
    season: 'all'
  });

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/analyze/compatibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFilters)
      });

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing outfits:', error);
      alert('Failed to analyze outfit compatibility');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSelectedFilters({ ...selectedFilters, [name]: value });
  };

  return (
    <div className="analyzer-page">
      <div className="container">
        <h2>🎯 Outfit Analyzer</h2>
        <p className="subtitle">Discover how your clothing items work together as a complete system</p>

        <div className="analyzer-section">
          <div className="filter-panel">
            <h3>Analysis Filters</h3>
            
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

            <button 
              className="btn btn-primary" 
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Analyze Outfits'}
            </button>
          </div>

          <div className="analysis-results">
            {!analysis ? (
              <div className="empty-state">
                <p>Select your preferences and click "Analyze Outfits" to get started.</p>
                <p>This will show you outfit compatibility and item utilization metrics.</p>
              </div>
            ) : (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>Total Valid Outfits</h4>
                    <p className="stat-value">{analysis.totalOutfits || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Analyzed Items</h4>
                    <p className="stat-value">{analysis.itemsAnalyzed || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Avg Item Utilization</h4>
                    <p className="stat-value">{analysis.avgUtilization?.toFixed(1) || 0}%</p>
                  </div>
                </div>

                <div className="compatibility-section">
                  <h3>Item Utilization Breakdown</h3>
                  {analysis.itemUtilization && analysis.itemUtilization.length > 0 ? (
                    <div className="utilization-list">
                      {analysis.itemUtilization.map((item, index) => (
                        <div key={index} className="utilization-item">
                          <div className="item-info">
                            <p className="item-name">{item.name}</p>
                            <p className="item-category">{item.category}</p>
                          </div>
                          <div className="utilization-bar">
                            <div 
                              className="bar-fill" 
                              style={{ width: `${item.utilizationPercentage}%` }}
                            ></div>
                            <span className="percentage">{item.utilizationPercentage?.toFixed(1) || 0}%</span>
                          </div>
                          <p className="outfit-count">{item.outfitCount || 0} outfits</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No utilization data available. Add more clothing items to your inventory.</p>
                  )}
                </div>

                <div className="insights-section">
                  <h3>Key Insights</h3>
                  {analysis.insights && analysis.insights.length > 0 ? (
                    <ul className="insights-list">
                      {analysis.insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Build your wardrobe inventory to receive personalized insights.</p>
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

export default OutfitAnalyzer;
