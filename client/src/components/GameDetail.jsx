import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, ExternalLink, Clock, Users, Trophy, Gamepad2, ChevronRight, Image } from 'lucide-react';
import { fetchGameDetails } from '../lib/api';
import ScoreBadge from './ScoreBadge';

const CATEGORY_LABEL = {
  GAME_CATALOG: 'PS Plus Game Catalog',
  CLASSICS_CATALOG: 'Classics Catalog',
};

function StatBox({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="bg-gray-800 rounded-xl p-3 flex flex-col items-center gap-1">
      <Icon size={18} className="text-blue-400" />
      <span className="text-lg font-bold text-white">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}

function ScoreChip({ score, scoreDisplay }) {
  if (score === null || score === undefined) return null;
  // Scores can be 0-100 or 0-10 depending on outlet
  const normalised = score > 10 ? score : Math.round(score * 10);
  const color =
    normalised >= 80 ? 'bg-green-600' :
    normalised >= 60 ? 'bg-blue-600' :
    normalised >= 40 ? 'bg-yellow-500 text-gray-900' :
    'bg-red-600';
  return (
    <span className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 rounded-lg text-sm font-bold text-white ${color}`}>
      {scoreDisplay || score}
    </span>
  );
}

function ReviewCard({ review }) {
  const date = review.publishedDate
    ? new Date(review.publishedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <a
      href={review.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-gray-800 rounded-2xl p-4 hover:bg-gray-750 border border-gray-700 hover:border-blue-700 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">{review.outlet || 'Unknown Outlet'}</p>
          {review.author && (
            <p className="text-xs text-gray-500 truncate">{review.author}{date ? ` · ${date}` : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreChip score={review.score} scoreDisplay={review.scoreDisplay} />
          <ExternalLink size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
      {review.snippet && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 italic">
          "{review.snippet}"
        </p>
      )}
    </a>
  );
}

function ScreenshotGallery({ screenshots }) {
  const [lightbox, setLightbox] = useState(null);

  if (!screenshots.length) return null;

  return (
    <>
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
          <Image size={14} />
          Screenshots
          <span className="text-gray-600 font-normal">({screenshots.length})</span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {screenshots.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 group focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img
                src={src}
                alt={`Screenshot ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <img
            src={screenshots[lightbox]}
            alt={`Screenshot ${lightbox + 1}`}
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded-full"
            onClick={() => setLightbox(null)}
          >
            <X size={20} />
          </button>
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 rounded-full rotate-180"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              <ChevronRight size={20} />
            </button>
          )}
          {lightbox < screenshots.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-800/80 rounded-full"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              <ChevronRight size={20} />
            </button>
          )}
          <span className="absolute bottom-4 text-xs text-gray-400">
            {lightbox + 1} / {screenshots.length}
          </span>
        </div>
      )}
    </>
  );
}

export default function GameDetail({ game, onClose }) {
  const { data: details, isLoading } = useQuery({
    queryKey: ['game-details', game.id],
    queryFn: () => fetchGameDetails(game.id),
    staleTime: 1000 * 60 * 30,
  });

  const enriched = details || {};
  const score = enriched.openCriticScore ?? enriched.metacritic;
  const tier = enriched.openCriticTier;
  const coverImage = enriched.backgroundImage || game.thumbnailUrl;
  const genres = enriched.genres || game.genres || [];
  const tags = enriched.tags || [];
  const screenshots = enriched.screenshots || [];
  const reviews = enriched.reviews || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 overflow-y-auto">
      {/* Hero image */}
      <div className="relative">
        {coverImage ? (
          <img src={coverImage} alt={game.title} className="w-full aspect-video object-cover" />
        ) : (
          <div className="w-full aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <Gamepad2 size={64} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-900/80 rounded-full hover:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="px-4 pb-8 -mt-8 relative">
        {/* Title + score */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white leading-tight">{game.title}</h1>
            <span className="text-sm text-blue-400 mt-1 block">{CATEGORY_LABEL[game.category]}</span>
          </div>
          {score !== null && score !== undefined && (
            <ScoreBadge score={score} tier={tier} size="lg" />
          )}
        </div>

        {/* Stats grid */}
        {!isLoading && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            <StatBox icon={Trophy} label="OpenCritic" value={enriched.openCriticScore ? `${Math.round(enriched.openCriticScore)}` : null} />
            <StatBox icon={Users} label="Reviews" value={enriched.openCriticNumReviews} />
            <StatBox icon={Clock} label="Avg playtime" value={enriched.playtime ? `${enriched.playtime}h` : null} />
          </div>
        )}

        {/* Critics recommend bar */}
        {enriched.openCriticPercentRecommended !== undefined && (
          <div className="mb-5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Critics Recommend</span>
              <span className="font-semibold text-white">{Math.round(enriched.openCriticPercentRecommended)}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${enriched.openCriticPercentRecommended}%` }}
              />
            </div>
            {enriched.openCriticUrl && (
              <a
                href={enriched.openCriticUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 mt-2 hover:text-blue-300"
              >
                All reviews on OpenCritic <ExternalLink size={11} />
              </a>
            )}
          </div>
        )}

        {/* Metacritic fallback */}
        {enriched.metacritic && !enriched.openCriticScore && (
          <div className="mb-5 flex items-center gap-3">
            <div className="bg-green-600 text-white font-bold text-xl px-3 py-1.5 rounded-lg">
              {enriched.metacritic}
            </div>
            <span className="text-sm text-gray-400">Metacritic Score</span>
          </div>
        )}

        {/* Description */}
        {isLoading ? (
          <div className="space-y-2 mb-5">
            <div className="h-4 loading-shimmer rounded" />
            <div className="h-4 loading-shimmer rounded w-4/5" />
            <div className="h-4 loading-shimmer rounded w-3/5" />
          </div>
        ) : enriched.description ? (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">About</h2>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-6">{enriched.description}</p>
          </div>
        ) : null}

        {/* Genres */}
        {genres.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <span key={g} className="px-2.5 py-1 bg-blue-900/50 border border-blue-800 text-blue-300 rounded-full text-xs">
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Screenshot gallery with lightbox */}
        {isLoading ? (
          <div className="mb-5">
            <div className="h-4 loading-shimmer rounded w-24 mb-2" />
            <div className="grid grid-cols-2 gap-2">
              {[0,1,2,3].map(i => <div key={i} className="aspect-video loading-shimmer rounded-xl" />)}
            </div>
          </div>
        ) : (
          <ScreenshotGallery screenshots={screenshots} />
        )}

        {/* Written reviews */}
        {isLoading ? (
          <div className="mb-5 space-y-3">
            <div className="h-4 loading-shimmer rounded w-24" />
            {[0,1,2].map(i => <div key={i} className="h-24 loading-shimmer rounded-2xl" />)}
          </div>
        ) : reviews.length > 0 ? (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">
              Critic Reviews
              <span className="text-gray-600 font-normal ml-1">({reviews.length})</span>
            </h2>
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <ReviewCard key={i} review={review} />
              ))}
            </div>
            {enriched.openCriticUrl && (
              <a
                href={enriched.openCriticUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-3 bg-gray-800 rounded-2xl text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border border-gray-700"
              >
                See all {enriched.openCriticNumReviews} reviews on OpenCritic
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        ) : null}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        {(enriched.developers?.length > 0 || enriched.publishers?.length > 0) && (
          <div className="text-xs text-gray-500 space-y-1">
            {enriched.developers?.length > 0 && (
              <p>Developer: <span className="text-gray-300">{enriched.developers.join(', ')}</span></p>
            )}
            {enriched.publishers?.length > 0 && (
              <p>Publisher: <span className="text-gray-300">{enriched.publishers.join(', ')}</span></p>
            )}
            {enriched.released && (
              <p>Released: <span className="text-gray-300">{new Date(enriched.released).toLocaleDateString()}</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
