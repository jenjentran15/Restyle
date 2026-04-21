// Outfit generator utilities
// - Small pure-JS helpers used by the backend to score and assemble outfits
// - Entry point exported as `beamSearchGenerateOutfits` (used by server.js)
// Keep this file focused on selection heuristics and lightweight scoring.

function normalizeCategory(category) {
  if (!category) return '';
  return category.toLowerCase().trim();
}

function isTop(category) {
  return ['top', 'shirt', 't-shirt', 'tee', 'blouse', 'sweater', 'hoodie', 'tank top'].includes(normalizeCategory(category));
}

function isBottom(category) {
  return ['bottom', 'pants', 'jeans', 'trousers', 'shorts', 'skirt'].includes(normalizeCategory(category));
}

function isShoes(category) {
  return ['shoes', 'sneakers', 'boots', 'heels', 'loafers'].includes(normalizeCategory(category));
}

function isOuterwear(category) {
  return ['jacket', 'coat', 'outerwear', 'blazer', 'hoodie'].includes(normalizeCategory(category));
}

function sameSeason(itemSeason, requestedSeason) {
  if (!requestedSeason || requestedSeason === 'all') return true;
  return itemSeason === 'all' || itemSeason === requestedSeason;
}

function sameFormality(itemFormality, requestedFormality) {
  if (!requestedFormality || requestedFormality === 'all') return true;
  return itemFormality === requestedFormality;
}

function colorScore(outfit) {
  const colors = outfit.map(item => (item.color || '').toLowerCase());

  const neutralColors = ['black', 'white', 'gray', 'grey', 'navy', 'beige', 'brown', 'cream'];
  let score = 0;

  for (const color of colors) {
    if (neutralColors.includes(color)) {
      score += 2;
    }
  }

  const uniqueColors = new Set(colors);
  if (uniqueColors.size <= 3) {
    score += 2;
  }

  return score;
}

function formalityScore(outfit, requestedFormality) {
  let score = 0;
  for (const item of outfit) {
    if (sameFormality(item.formality, requestedFormality)) {
      score += 2;
    }
  }
  return score;
}

function seasonScore(outfit, requestedSeason) {
  let score = 0;
  for (const item of outfit) {
    if (sameSeason(item.season, requestedSeason)) {
      score += 2;
    }
  }
  return score;
}

function outfitScore(outfit, requestedFormality, requestedSeason) {
  return (
    colorScore(outfit) +
    formalityScore(outfit, requestedFormality) +
    seasonScore(outfit, requestedSeason)
  );
}

function buildOutfit(top, bottom, shoes, outerwear = null) {
  const outfit = [top, bottom, shoes];
  if (outerwear) {
    outfit.push(outerwear);
  }
  return outfit;
}

function beamSearchGenerateOutfits(items, options = {}) {
  const beamWidth = options.beamWidth || 5;
  const requestedFormality = options.formality || 'all';
  const requestedSeason = options.season || 'all';

  const tops = items.filter(item => isTop(item.category));
  const bottoms = items.filter(item => isBottom(item.category));
  const shoes = items.filter(item => isShoes(item.category));
  const outerwear = items.filter(item => isOuterwear(item.category));

  if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
    return [];
  }

  let beam = [];

  //tops
  beam = tops.map(top => ({
    outfitParts: [top],
    score: outfitScore([top], requestedFormality, requestedSeason)
  }));

  beam.sort((a, b) => b.score - a.score);
  beam = beam.slice(0, beamWidth);

  //bottoms
  let expanded = [];
  for (const candidate of beam) {
    for (const bottom of bottoms) {
      const newOutfit = [...candidate.outfitParts, bottom];
      expanded.push({
        outfitParts: newOutfit,
        score: outfitScore(newOutfit, requestedFormality, requestedSeason)
      });
    }
  }

  expanded.sort((a, b) => b.score - a.score);
  beam = expanded.slice(0, beamWidth);

  //shoes
  expanded = [];
  for (const candidate of beam) {
    for (const shoe of shoes) {
      const newOutfit = [...candidate.outfitParts, shoe];
      expanded.push({
        outfitParts: newOutfit,
        score: outfitScore(newOutfit, requestedFormality, requestedSeason)
      });
    }
  }

  expanded.sort((a, b) => b.score - a.score);
  beam = expanded.slice(0, beamWidth);

  //optional outerwear
  if (outerwear.length > 0) {
    expanded = [];

    for (const candidate of beam) {
      expanded.push(candidate); // keep no outerwear version too

      for (const outer of outerwear) {
        const newOutfit = [...candidate.outfitParts, outer];
        expanded.push({
          outfitParts: newOutfit,
          score: outfitScore(newOutfit, requestedFormality, requestedSeason)
        });
      }
    }

    expanded.sort((a, b) => b.score - a.score);
    beam = expanded.slice(0, beamWidth);
  }

  return beam.map(candidate => ({
    score: candidate.score,
    items: candidate.outfitParts
  }));
}

module.exports = {
  beamSearchGenerateOutfits
};