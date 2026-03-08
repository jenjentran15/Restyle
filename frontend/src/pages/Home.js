/* Home.js - landing page with overview of features and status check. */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => response.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h2>👔 Restyle</h2>
        <p>Organize your wardrobe and generate outfit combinations with ease.</p>
        <p className="hero-subtitle">
          Reduce decision fatigue, explore your closet more intentionally, and preview where the app is headed next.
        </p>
        <Link to="/wardrobe" className="btn btn-primary btn-large">
          Start Building Your Wardrobe
        </Link>
      </section>

      <section id="features" className="features">
        <h2>🌟 Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>👕 Wardrobe</h3>
            <p>
              Add and manage your clothing items with details like category, color,
              formality, season, and optional images.
            </p>
            <Link to="/wardrobe" className="feature-link">
              Manage Wardrobe →
            </Link>
          </div>

          <div className="feature-card">
            <h3>✨ Outfit Generator</h3>
            <p>
              Generate outfit combinations from your wardrobe using filters like
              formality, season, and outfit variety.
            </p>
            <Link to="/outfit-generator" className="feature-link">
              Generate Outfits →
            </Link>
          </div>

          <div className="feature-card">
            <h3>🪞 Outfit Preview</h3>
            <p>
              Explore the future preview experience where generated outfits will be
              displayed on a 2D model.
            </p>
            <Link to="/outfit-preview" className="feature-link">
              View Preview Page →
            </Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>💡 How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h4>Add Your Items</h4>
            <p>Build your wardrobe by adding clothing items and optional photos.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h4>Generate Outfits</h4>
            <p>Use filters to create outfit combinations from your wardrobe.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h4>Preview the Future Flow</h4>
            <p>Use the Outfit Preview page as the placeholder for upcoming visual try-on features.</p>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h4>Style More Intentionally</h4>
            <p>Make faster outfit decisions using a more organized wardrobe system.</p>
          </div>
        </div>
      </section>

      <section className="benefits">
        <h2>📊 Benefits</h2>
        <ul className="benefits-list">
          <li>✓ Keep your wardrobe organized in one place</li>
          <li>✓ Generate outfit ideas from items you already own</li>
          <li>✓ Reduce decision fatigue when getting dressed</li>
          <li>✓ Build toward a future visual outfit preview experience</li>
          <li>✓ Make better use of underused clothing pieces</li>
          <li>✓ Create a stronger foundation for smarter styling decisions</li>
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