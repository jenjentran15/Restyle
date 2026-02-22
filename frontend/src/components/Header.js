import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token')
  );

  const [greeting, setGreeting] = useState('Good morning');
  const [timeClass, setTimeClass] = useState('morning');

  useEffect(() => {
    const updateTimeBasedStyles = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setTimeClass('morning');
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 17) {
        setTimeClass('afternoon');
        setGreeting('Good afternoon');
      } else if (hour >= 17 && hour < 21) {
        setTimeClass('evening');
        setGreeting('Good evening');
      } else {
        setTimeClass('night');
        setGreeting('Good night');
      }
    };

    updateTimeBasedStyles();
    const interval = setInterval(updateTimeBasedStyles, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <header className={`header ${timeClass}`}>
      <div className="container">
        <h1 className="logo">RESTYLE</h1>
        
        <span className="greeting">{greeting}</span>
        
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/inventory">Inventory</Link>
          <Link to="/analyzer">Analyzer</Link>
          <Link to="/capsule">Capsule</Link>
          <Link to="/upload-clothes">Upload</Link>
          <Link to="/virtual-tryon">Try-On</Link>
          {!isAuthenticated && <Link to="/login">Sign in</Link>}
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