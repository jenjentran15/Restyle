import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch backend health check
    fetch(process.env.REACT_APP_API_URL + '/api/health' || '/api/health')
      .then(response => response.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h2>👔 Restyle</h2>
        <p>Understand and optimize how your clothing items work together as a system</p>
        <p className="hero-subtitle">Reduce decision fatigue, maximize outfit variety, and make intentional wardrobe choices</p>
        <Link to="/inventory" className="btn btn-primary btn-large">Start Building Your Wardrobe</Link>
      </section>

      <section id="features" className="features">
        <h2>🌟 Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📝 Inventory Management</h3>
            <p>Add and manage your clothing items with details like category, color, formality, and season</p>
            <Link to="/inventory" className="feature-link">Manage Wardrobe →</Link>
          </div>
          <div className="feature-card">
            <h3>🎯 Outfit Analysis</h3>
            <p>Model outfit combinations using defined constraints to identify valid outfit pairings and item utilization</p>
            <Link to="/analyzer" className="feature-link">Analyze Outfits →</Link>
          </div>
          <div className="feature-card">
            <h3>✨ Capsule Suggestions</h3>
            <p>Get AI-powered recommendations for a minimal wardrobe that maximizes outfit variety</p>
            <Link to="/capsule" className="feature-link">Get Recommendations →</Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>💡 How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Add Your Items</h4>
            <p>Input your clothing inventory with key attributes</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h4>Analyze Compatibility</h4>
            <p>See how items combine into valid outfits</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h4>Get Recommendations</h4>
            <p>Receive suggestions for your perfect capsule wardrobe</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h4>Make Decisions</h4>
            <p>Use data-driven insights to optimize your wardrobe</p>
          </div>
        </div>
      </section>

      <section className="benefits">
        <h2>📊 Benefits</h2>
        <ul className="benefits-list">
          <li>✓ Reduce decision fatigue with data-driven choices</li>
          <li>✓ Maximize outfit variety with fewer items</li>
          <li>✓ Identify underutilized clothing pieces</li>
          <li>✓ Build intentional capsule wardrobes</li>
          <li>✓ Save time getting ready in the morning</li>
          <li>✓ Make smarter clothing purchases</li>
        </ul>
      </section>

      {loading ? (
        <p>Checking connection...</p>
      ) : (
        stats && (
          <section className="status-section">
            <p className="status-ok">✓ System Status: Connected</p>
          </section>
        )
      )}
    </div>
  );
}

export default Home;
