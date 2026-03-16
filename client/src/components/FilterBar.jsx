import { Search, SlidersHorizontal, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'title', label: 'A–Z' },
  { value: 'score', label: 'Top Rated' },
  { value: 'rating', label: 'RAWG Rating' },
  { value: 'metacritic', label: 'Metacritic' },
  { value: 'playtime', label: 'Playtime' },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Games' },
  { value: 'GAME_CATALOG', label: 'PS Plus' },
  { value: 'CLASSICS_CATALOG', label: 'Classics' },
];

const TIER_OPTIONS = [
  { value: 'ALL', label: 'Any Score' },
  { value: 'Mighty', label: '🟢 Mighty' },
  { value: 'Strong', label: '🔵 Strong' },
  { value: 'Fair', label: '🟡 Fair' },
  { value: 'Weak', label: '🔴 Weak' },
  { value: 'unrated', label: '⚪ Unrated' },
];

export default function FilterBar({ filters, onChange, genreList, totalCount, filteredCount }) {
  const { search, category, sort, genre, tier } = filters;

  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Search games..."
          value={search}
          onChange={(e) => set('search', e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-base"
        />
        {search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => set('category', opt.value)}
            className={`filter-chip ${category === opt.value ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort + tier row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <select
            value={sort}
            onChange={(e) => set('sort', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={tier}
            onChange={(e) => set('tier', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre chips */}
      {genreList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => set('genre', 'ALL')}
            className={`filter-chip ${genre === 'ALL' ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            All Genres
          </button>
          {genreList.map((g) => (
            <button
              key={g}
              onClick={() => set('genre', g)}
              className={`filter-chip ${genre === g ? 'filter-chip-active' : 'filter-chip-inactive'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-xs text-gray-500">
        {filteredCount} of {totalCount} games
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
