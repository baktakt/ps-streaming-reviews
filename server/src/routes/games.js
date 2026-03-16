const express = require('express');
const NodeCache = require('node-cache');
const { fetchAllGames } = require('../services/playstationService');
const { searchGame: rawgSearch, getGameDetails } = require('../services/rawgService');
const { searchGame: ocSearch, getGameScores } = require('../services/openCriticService');
const SEED_GAMES = require('../data/seedGames');

const router = express.Router();

// Cache: game list for 1 hour, enriched details for 24 hours
const listCache = new NodeCache({ stdTTL: 3600 });
const detailCache = new NodeCache({ stdTTL: 86400 });

// Throttle helper to avoid hammering APIs
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// GET /api/games - return list of all streamable games
router.get('/', async (req, res) => {
  const cached = listCache.get('games');
  if (cached) {
    return res.json(cached);
  }

  let games = [];

  // Try PlayStation API first
  try {
    games = await fetchAllGames();
    console.log(`Fetched ${games.length} games from PlayStation API`);
  } catch (err) {
    console.warn('PlayStation API failed, using seed data:', err.message);
  }

  // Fall back to seed data if PS API returned nothing
  if (games.length === 0) {
    games = SEED_GAMES.map((g) => ({ ...g, source: 'seed' }));
    console.log(`Using ${games.length} seed games`);
  }

  // Deduplicate by title (normalize)
  const seen = new Set();
  games = games.filter((g) => {
    const key = g.title?.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  listCache.set('games', games);
  res.json(games);
});

// GET /api/games/:id/details - get enriched details for a single game
router.get('/:id/details', async (req, res) => {
  const { id } = req.params;
  const cacheKey = `details:${id}`;

  const cached = detailCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Find the game in our list
  const listGames = listCache.get('games') || SEED_GAMES;
  const game = listGames.find((g) => g.id === id);

  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const enriched = { ...game };

  // Enrich with RAWG data
  const rawgBasic = await rawgSearch(game.title);
  if (rawgBasic) {
    const rawgDetails = await getGameDetails(rawgBasic.rawgId);
    if (rawgDetails) {
      Object.assign(enriched, rawgDetails);
    } else {
      Object.assign(enriched, rawgBasic);
    }
  }

  // Enrich with OpenCritic scores
  const ocBasic = await ocSearch(game.title);
  if (ocBasic) {
    await sleep(200); // gentle rate limit
    const ocScores = await getGameScores(ocBasic.openCriticId);
    if (ocScores) {
      Object.assign(enriched, ocScores);
    }
  }

  detailCache.set(cacheKey, enriched);
  res.json(enriched);
});

// POST /api/games/enrich-batch - enrich multiple games in one call
// Accepts { ids: string[] }
router.post('/enrich-batch', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array required' });
  }

  const listGames = listCache.get('games') || SEED_GAMES;
  const results = {};

  for (const id of ids.slice(0, 20)) {
    // cap at 20 per batch
    const cacheKey = `details:${id}`;
    const cached = detailCache.get(cacheKey);
    if (cached) {
      results[id] = cached;
      continue;
    }

    const game = listGames.find((g) => g.id === id);
    if (!game) continue;

    const enriched = { ...game };

    // RAWG enrichment
    const rawgBasic = await rawgSearch(game.title);
    if (rawgBasic) {
      const rawgDetails = await getGameDetails(rawgBasic.rawgId);
      Object.assign(enriched, rawgDetails || rawgBasic);
    }

    // OpenCritic enrichment
    const ocBasic = await ocSearch(game.title);
    if (ocBasic) {
      await sleep(300);
      const ocScores = await getGameScores(ocBasic.openCriticId);
      if (ocScores) Object.assign(enriched, ocScores);
    }

    detailCache.set(cacheKey, enriched);
    results[id] = enriched;
    await sleep(200);
  }

  res.json(results);
});

// GET /api/games/enrich/:title - enrich a game by title (for quick lookup)
router.get('/enrich/:title', async (req, res) => {
  const title = decodeURIComponent(req.params.title);
  const cacheKey = `enrich:${title.toLowerCase()}`;

  const cached = detailCache.get(cacheKey);
  if (cached) return res.json(cached);

  const enriched = { title };

  const rawgBasic = await rawgSearch(title);
  if (rawgBasic) {
    const rawgDetails = await getGameDetails(rawgBasic.rawgId);
    Object.assign(enriched, rawgDetails || rawgBasic);
  }

  const ocBasic = await ocSearch(title);
  if (ocBasic) {
    await sleep(200);
    const ocScores = await getGameScores(ocBasic.openCriticId);
    if (ocScores) Object.assign(enriched, ocScores);
  }

  detailCache.set(cacheKey, enriched);
  res.json(enriched);
});

module.exports = router;
