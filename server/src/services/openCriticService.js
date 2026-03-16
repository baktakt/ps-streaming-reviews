const axios = require('axios');

const OC_BASE = 'https://api.opencritic.com/api';

// OpenCritic has an unofficial public API - no key needed
async function searchGame(title) {
  try {
    const response = await axios.get(`${OC_BASE}/game/search`, {
      params: { criteria: title },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PSPortalApp/1.0)',
        'Accept': 'application/json',
      },
      timeout: 8000,
    });

    const results = response.data;
    if (!results || results.length === 0) return null;

    // Find best match by name similarity
    const best = results[0];
    return { openCriticId: best.id, openCriticName: best.name };
  } catch (err) {
    console.warn(`OpenCritic search failed for "${title}":`, err.message);
    return null;
  }
}

async function getGameScores(openCriticId) {
  if (!openCriticId) return null;

  try {
    const response = await axios.get(`${OC_BASE}/game/${openCriticId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PSPortalApp/1.0)',
        'Accept': 'application/json',
      },
      timeout: 8000,
    });

    const g = response.data;
    return {
      openCriticId: g.id,
      openCriticScore: g.topCriticScore,
      openCriticPercentRecommended: g.percentRecommended,
      openCriticNumReviews: g.numReviews,
      openCriticTier: g.tier, // 'Mighty', 'Strong', 'Fair', 'Weak'
      openCriticUrl: `https://opencritic.com/game/${g.id}/${g.name?.toLowerCase().replace(/\s+/g, '-')}`,
    };
  } catch (err) {
    console.warn(`OpenCritic details failed for id ${openCriticId}:`, err.message);
    return null;
  }
}

module.exports = { searchGame, getGameScores };
