import { useState } from 'react';
import { Star, Clock, Gamepad2, ExternalLink } from 'lucide-react';
import ScoreBadge from './ScoreBadge';

const CATEGORY_LABEL = {
  GAME_CATALOG: 'PS Plus',
  CLASSICS_CATALOG: 'Classic',
};

const CATEGORY_COLOR = {
  GAME_CATALOG: 'bg-blue-600',
  CLASSICS_CATALOG: 'bg-amber-600',
};

function RatingStars({ rating }) {
  if (!rating) return null;
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 fill-gray-600'}
        />
      ))}
    </div>
  );
}

export default function GameCard({ game, enriched, onClick }) {
  const [imgError, setImgError] = useState(false);
  const coverImage = enriched?.backgroundImage || game?.thumbnailUrl;
  const score = enriched?.openCriticScore ?? enriched?.metacritic;
  const tier = enriched?.openCriticTier;
  const rating = enriched?.rating; // RAWG 0-5 scale
  const genres = enriched?.genres?.slice(0, 2) || game?.genres?.slice(0, 2) || [];
  const playtime = enriched?.playtime;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gray-900 rounded-2xl overflow-hidden card-hover border border-gray-800 group focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Cover image */}
      <div className="relative aspect-video bg-gray-800 overflow-hidden">
        {coverImage && !imgError ? (
          <img
            src={coverImage}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <Gamepad2 size={40} className="text-gray-600" />
          </div>
        )}

        {/* Overlay: category badge + score */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${CATEGORY_COLOR[game.category] || 'bg-gray-700'}`}>
            {CATEGORY_LABEL[game.category] || game.category}
          </span>
        </div>
        {(score !== null && score !== undefined) && (
          <div className="absolute top-2 right-2">
            <ScoreBadge score={score} tier={tier} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 leading-tight mb-2 group-hover:text-blue-400 transition-colors">
          {game.title}
        </h3>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* RAWG star rating */}
          {rating ? (
            <RatingStars rating={rating} />
          ) : (
            <span className="text-xs text-gray-500">No rating yet</span>
          )}

          {/* Playtime */}
          {playtime ? (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {playtime}h
            </span>
          ) : null}
        </div>

        {/* Genres */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genres.map((g) => (
              <span key={g} className="text-xs px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
