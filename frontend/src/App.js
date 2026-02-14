import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ClothingInventory from './pages/ClothingInventory';
import OutfitAnalyzer from './pages/OutfitAnalyzer';
import CapsuleRecommendations from './pages/CapsuleRecommendations';
import Authentication from './pages/Authentication'
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
          <Route path="/inventory" element={<ClothingInventory />} />
          <Route path="/analyzer" element={<OutfitAnalyzer />} />
          <Route path="/capsule" element={<CapsuleRecommendations />} />
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
