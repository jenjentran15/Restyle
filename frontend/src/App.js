import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Wardrobe from './pages/Wardrobe';
import OutfitGenerator from './pages/OutfitGenerator';
import OutfitPreview from './pages/OutfitPreview';
import Authentication from './pages/Authentication'
import './styles/App.css';
import { OutfitProvider } from './content/OutfitContext';

function AppContent() {
  const location = useLocation(); //react import which gives access to the current path
  const hideHeaderFooter = location.pathname === '/login'; //Checks if in login page if yes

  return (
    <div className="app">
      {!hideHeaderFooter && <Header />} {/*if hideHeaderFooter is false hide header, if true shows it */} 
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
    <OutfitProvider>
      <Router>
        <AppContent />
      </Router>
    </OutfitProvider>
  );
}

export default App;
