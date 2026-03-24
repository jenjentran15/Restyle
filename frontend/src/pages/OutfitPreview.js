/* OutfitPreview.js - placeholder page for future outfit visualization.
 * This page will eventually display a 2D model/avatar wearing a generated outfit.
 */
import React from 'react';
import '../styles/OutfitPreview.css';

function OutfitPreview() {
  return (
    <div className="capsule-page">
      <div className="container">
        <h2>Outfit Preview</h2>
        <p className="subtitle">
          Preview how generated outfits will look on your future 2D model
        </p>

        <div className="capsule-section">
          <div className="preferences-panel">
            <h3>Preview Controls</h3>
            <p>
              This section will later hold controls for selecting outfits, switching views,
              and previewing clothing combinations on a 2D character model.
            </p>

            <button className="btn btn-primary" disabled>
              Preview Coming Soon
            </button>
          </div>

          <div className="recommendations-results">
            <div className="empty-state">
              <p>No outfit preview is available yet.</p>
              <p>
                Once the 2D model system is implemented, this page will display selected outfits
                on a visual character preview.
              </p>
            </div>

            <div className="recommendations-section">
              <h4>Planned Features</h4>
              <ul className="recommendations-list">
                <li>Preview generated outfits on a 2D avatar</li>
                <li>Swap tops, bottoms, shoes, and accessories visually</li>
                <li>View outfit combinations before getting dressed</li>
                <li>Support future styling and fit visualization improvements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OutfitPreview;