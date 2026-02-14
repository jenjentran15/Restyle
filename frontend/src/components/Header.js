import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token') != null;
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login')
  };

  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">👔 Restyle</h1>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/inventory">My Wardrobe</Link>
          <Link to="/analyzer">Outfit Analyzer</Link>
          <Link to="/capsule">Capsule Suggestions</Link>

          {isLoggedIn ? (
            <>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
            ):(
            <Link to="/login">Sign in</Link>
            )            
          }
        </nav>
      </div>
    </header>
  );
}

export default Header;
