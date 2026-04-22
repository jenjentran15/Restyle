import React, { createContext, useContext, useState } from 'react';

const OutfitContext = createContext();

export function OutfitProvider({ children }) {
  const [outfits, setOutfits] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0);
  return (
    <OutfitContext.Provider value={{ outfits, setOutfits, selectedIdx, setSelectedIdx }}>
      {children}
    </OutfitContext.Provider>
  );
}

export function useOutfit() {
  return useContext(OutfitContext);
}