import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', syncAuthState);
    syncAuthState();

    return () => window.removeEventListener('storage', syncAuthState);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);

    if (onLogout) {
      onLogout();
    }

    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">RESTYLE</h1>

        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/wardrobe">Wardrobe</Link>
          <Link to="/outfit-generator">Outfit Generator</Link>
          <Link to="/outfit-preview">Outfit Preview</Link>

          {!isAuthenticated && <Link to="/login">Log In / Sign Up</Link>}

          {isAuthenticated && (
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;