import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">👔 Restyle</h1>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/inventory">My Wardrobe</Link>
          <Link to="/analyzer">Outfit Analyzer</Link>
          <Link to="/capsule">Capsule Suggestions</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
