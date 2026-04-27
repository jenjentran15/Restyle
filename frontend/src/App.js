import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import OutfitGenerator from './pages/OutfitGenerator';
import OutfitPreview from './pages/OutfitPreview';
import Authentication from './pages/Authentication';
import SavedOutfits from './pages/SavedOutfits';
import './styles/App.css';
import { OutfitProvider } from './content/OutfitProvider';

function AppContent() {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login';
  return (
    <OutfitProvider>
      <div className="app">
        {!hideHeaderFooter && <Header />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/login" element={<Authentication />} />
            <Route path="/outfit-generator" element={<OutfitGenerator />} />
            <Route path="/outfit-preview" element={<OutfitPreview />} />
            <Route path="/saved-outfits" element={<SavedOutfits />} />
          </Routes>
        </main>
        {!hideHeaderFooter && <Footer />}
      </div>
    </OutfitProvider>
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