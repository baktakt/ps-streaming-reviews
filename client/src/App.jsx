import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gamepad2, CloudDownload, RefreshCw } from 'lucide-react';
import { fetchGames } from './lib/api';
import { useEnrichment } from './hooks/useEnrichment';
import FilterBar from './components/FilterBar';
import GameCard from './components/GameCard';
import GameDetail from './components/GameDetail';
import './index.css';

const DEFAULT_FILTERS = {
  search: '',
  category: 'ALL',
  sort: 'title',
  genre: 'ALL',
  tier: 'ALL',
};

function CardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
      <div className="aspect-video loading-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 loading-shimmer rounded w-4/5" />
        <div className="h-3 loading-shimmer rounded w-1/2" />
      </div>
    </div>
  );
}

export default function App() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedGame, setSelectedGame] = useState(null);

  const { data: games = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['games'],
    queryFn: fetchGames,
    staleTime: 1000 * 60 * 30,
  });

  const { enriched, isEnriching } = useEnrichment(games);

  const genreList = useMemo(() => {
    const genreSet = new Set();
    games.forEach((g) => {
      const e = enriched[g.id];
      const genres = e?.genres || g.genres || [];
      genres.forEach((genre) => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [games, enriched]);

  const filteredGames = useMemo(() => {
    let result = [...games];

    if (filters.category !== 'ALL') {
      result = result.filter((g) => g.category === filters.category);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((g) => g.title?.toLowerCase().includes(q));
    }

    if (filters.genre !== 'ALL') {
      result = result.filter((g) => {
        const genres = enriched[g.id]?.genres || g.genres || [];
        return genres.includes(filters.genre);
      });
    }

    if (filters.tier !== 'ALL') {
      result = result.filter((g) => {
        const e = enriched[g.id];
        if (filters.tier === 'unrated') return !e?.openCriticTier;
        return e?.openCriticTier === filters.tier;
      });
    }

    result.sort((a, b) => {
      const ea = enriched[a.id] || {};
      const eb = enriched[b.id] || {};
      switch (filters.sort) {
        case 'score': {
          const sa = ea.openCriticScore ?? ea.metacritic ?? -1;
          const sb = eb.openCriticScore ?? eb.metacritic ?? -1;
          return sb - sa;
        }
        case 'rating':
          return (eb.rating || 0) - (ea.rating || 0);
        case 'metacritic':
          return (eb.metacritic || 0) - (ea.metacritic || 0);
        case 'playtime':
          return (eb.playtime || 0) - (ea.playtime || 0);
        case 'title':
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });

    return result;
  }, [games, filters, enriched]);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Gamepad2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">PS Portal</h1>
              <p className="text-xs text-gray-400 leading-none mt-0.5">Cloud Streaming</p>
            </div>
          </div>

          {isEnriching && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400">
              <RefreshCw size={12} className="animate-spin" />
              <span className="hidden sm:inline">Loading scores…</span>
            </div>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Refresh game list"
          >
            <CloudDownload size={18} className="text-gray-400" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="mb-5">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            genreList={genreList}
            totalCount={games.length}
            filteredCount={filteredGames.length}
          />
        </div>

        {isError && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-3">Failed to load games.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 rounded-xl text-sm hover:bg-blue-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && filteredGames.length === 0 && (
          <div className="text-center py-16">
            <Gamepad2 size={48} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-lg font-medium">No games found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 px-4 py-2 bg-gray-800 rounded-xl text-sm text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredGames.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                enriched={enriched[game.id]}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedGame && (
        <GameDetail
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
