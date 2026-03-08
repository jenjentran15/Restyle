/* App.js - root React component that sets up routing and overall layout.
 * It renders Header and Footer, and uses react-router-dom to switch pages.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import OutfitGenerator from './pages/OutfitGenerator';
import OutfitPreview from './pages/OutfitPreview';
import Authentication from './pages/Authentication';
import './styles/App.css';

function AppContent() {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login';

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/outfit-generator" element={<OutfitGenerator />} />
          <Route path="/outfit-preview" element={<OutfitPreview />} />
          <Route path="/login" element={<Authentication />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;