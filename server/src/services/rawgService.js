const axios = require('axios');

const RAWG_BASE = 'https://api.rawg.io/api';
const API_KEY = process.env.RAWG_API_KEY;

async function searchGame(title) {
  if (!API_KEY) return null;

  try {
    const response = await axios.get(`${RAWG_BASE}/games`, {
      params: {
        key: API_KEY,
        search: title,
        search_precise: true,
        page_size: 1,
        platforms: '18,16,15', // PS4, PS5, PS3 platform IDs in RAWG
      },
      timeout: 8000,
    });

    const results = response.data?.results;
    if (!results || results.length === 0) return null;

    const game = results[0];
    return {
      rawgId: game.id,
      rating: game.rating,
      ratingCount: game.ratings_count,
      metacritic: game.metacritic,
      genres: game.genres?.map((g) => g.name) || [],
      backgroundImage: game.background_image,
      released: game.released,
      description: null, // fetched separately if needed
    };
  } catch (err) {
    console.warn(`RAWG search failed for "${title}":`, err.message);
    return null;
  }
}

async function getGameDetails(rawgId) {
  if (!API_KEY || !rawgId) return null;

  try {
    const response = await axios.get(`${RAWG_BASE}/games/${rawgId}`, {
      params: { key: API_KEY },
      timeout: 8000,
    });

    const g = response.data;
    return {
      rawgId: g.id,
      description: g.description_raw,
      rating: g.rating,
      ratingCount: g.ratings_count,
      metacritic: g.metacritic,
      genres: g.genres?.map((x) => x.name) || [],
      tags: g.tags?.slice(0, 10).map((x) => x.name) || [],
      backgroundImage: g.background_image,
      screenshots: g.short_screenshots?.map((s) => s.image) || [],
      playtime: g.playtime,
      released: g.released,
      website: g.website,
      developers: g.developers?.map((d) => d.name) || [],
      publishers: g.publishers?.map((p) => p.name) || [],
    };
  } catch (err) {
    console.warn(`RAWG details failed for id ${rawgId}:`, err.message);
    return null;
  }
}

module.exports = { searchGame, getGameDetails };
