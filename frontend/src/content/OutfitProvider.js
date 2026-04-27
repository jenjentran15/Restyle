import React, { createContext, useContext, useState } from 'react';

const OutfitContext = createContext();

export function OutfitProvider({ children }) {
  const [outfits, setOutfits] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [savedOutfits, setSavedOutfits] = useState([]);

  const saveOutfit = (outfit) => {
    setSavedOutfits(prev => {
      const alreadySaved = prev.some(o => JSON.stringify(o.items) === JSON.stringify(outfit.items));
      if (alreadySaved) return prev;
      return [...prev, { ...outfit, savedAt: new Date().toISOString() }];
    });
  };

  const removeSavedOutfit = (index) => {
    setSavedOutfits(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <OutfitContext.Provider value={{ outfits, setOutfits, selectedIdx, setSelectedIdx, savedOutfits, saveOutfit, removeSavedOutfit }}>
      {children}
    </OutfitContext.Provider>
  );
}

export const useOutfit = () => useContext(OutfitContext);