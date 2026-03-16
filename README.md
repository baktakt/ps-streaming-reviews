# PS Portal – Cloud Streaming Game Browser

A mobile-first web app to browse, filter, and discover PS Plus Premium cloud streaming games with critic scores and reviews.

## Features

- **Full game catalog** — PS Plus Game Catalog + Classics Catalog (120+ titles seeded, live PlayStation API fetch attempted first)
- **OpenCritic scores** — Mighty/Strong/Fair/Weak tier ratings, percent recommended, review counts
- **RAWG enrichment** — Cover art, genres, tags, playtime, Metacritic score, screenshots
- **Filters** — Category, genre, critic tier, sort by title/score/rating/playtime
- **Search** — Instant title search
- **Progressive loading** — Games load immediately from seed, scores enrich in background batches
- **Mobile-first** — Designed for iPhone/Android viewport, dark theme

## Setup

### 1. Get a RAWG API key (free)
1. Sign up at https://rawg.io/login?forward=developer
2. Copy your API key

### 2. Configure environment
```bash
cd server
cp .env.example .env
# Edit .env and set RAWG_API_KEY=your_key_here
```

### 3. Install and run
```bash
npm run install:all
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Architecture

```
client/          React + Vite + TailwindCSS
  src/
    components/  GameCard, GameDetail, FilterBar, ScoreBadge
    hooks/       useEnrichment (progressive background loading)
    lib/         api.js (axios client)

server/          Express.js
  src/
    routes/      games.js (list, details, enrich-batch)
    services/    playstationService, rawgService, openCriticService
    data/        seedGames.js (120+ curated PS Plus Premium titles)
```

## Data Sources

| Source | What it provides | Auth required |
|--------|-----------------|---------------|
| PlayStation GraphQL API | Live game list | No (attempted, falls back to seed) |
| Seed data (`seedGames.js`) | 120+ curated titles | No |
| OpenCritic (unofficial API) | Critic scores, tier, % recommended | No |
| RAWG.io | Cover art, genres, Metacritic, playtime, screenshots | Free API key |

## Adding more games

Edit `server/src/data/seedGames.js` and add entries with:
```js
{ id: 'unique-id', title: 'Game Title', category: 'GAME_CATALOG' | 'CLASSICS_CATALOG', slug: 'url-slug' }
```
