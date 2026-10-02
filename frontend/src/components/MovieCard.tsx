import React, { useState, useEffect } from 'react';
import { Star, Plus, Check, Sparkles, Tv, Film } from 'lucide-react';
import type { Movie } from '../types';
import { PosterImage } from './PosterImage';
import { watchlistService } from '../services/watchlist';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  showAiBadge?: boolean;
  priority?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  showAiBadge = false
}) => {
  const [inWatchlist, setInWatchlist] = useState(false);
  const movieId = movie.id || movie.tmdb_id || 0;

  useEffect(() => {
    setInWatchlist(watchlistService.isInWatchlist(movieId));
    const unsubscribe = watchlistService.subscribe(() => {
      setInWatchlist(watchlistService.isInWatchlist(movieId));
    });
    return unsubscribe;
  }, [movieId]);

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = watchlistService.toggleWatchlist(movie);
    setInWatchlist(added);
  };

  const title = movie.title || movie.name || 'Untitled';
  const releaseYear = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;
  const isTv = movie.media_type === 'tv' || Boolean(movie.first_air_date);

  return (
    <div
      onClick={() => onSelect(movie)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(movie);
        }
      }}
      className="group relative flex flex-col text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-xl transition-all duration-300"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#191D30] border border-white/5 shadow-lg group-hover:shadow-violet-900/20 group-hover:border-violet-500/40 transition-all duration-300">
        <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
          <PosterImage path={movie.poster_path} title={title} />
        </div>

        {/* Gradient Overlay on Hover for Desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D17] via-transparent to-black/30 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Badges: Top Left - AI Match or Media Type */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {(showAiBadge || movie.is_ai_pick) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md border border-violet-400/40">
              <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
              {movie.match_percentage ? `${movie.match_percentage}% MATCH` : 'AI PICK'}
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 uppercase">
            {isTv ? <Tv className="w-2.5 h-2.5 text-cyan-400" /> : <Film className="w-2.5 h-2.5 text-violet-400" />}
            {isTv ? 'SERIES' : 'MOVIE'}
          </span>
        </div>

        {/* Watchlist Toggle Button (Top Right) */}
        <button
          onClick={handleWatchlistClick}
          aria-label={inWatchlist ? `Remove ${title} from My List` : `Add ${title} to My List`}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all duration-200 z-20 ${
            inWatchlist
              ? 'bg-cyan-500 text-black shadow-cyan-500/30 shadow-md'
              : 'bg-black/60 text-white hover:bg-violet-600 hover:text-white border border-white/10'
          }`}
        >
          {inWatchlist ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
        </button>

        {/* Rating Badge (Bottom Left overlay) */}
        {rating && Number(rating) > 0 && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 z-10">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-gray-100">{rating}</span>
          </div>
        )}

        {/* Release Year (Bottom Right overlay) */}
        {releaseYear && (
          <div className="absolute bottom-2.5 right-2.5 text-[11px] font-medium text-gray-300 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 z-10">
            {releaseYear}
          </div>
        )}
      </div>

      {/* Card Info Below Poster */}
      <div className="mt-2.5 px-0.5 flex flex-col">
        <h4 className="text-sm font-semibold text-gray-100 group-hover:text-violet-300 line-clamp-1 transition-colors leading-snug">
          {title}
        </h4>

        {/* AI Explanation or Subtitle */}
        {movie.ai_explanation ? (
          <p className="text-[11px] text-cyan-400/90 line-clamp-1 mt-0.5 font-medium">
            {movie.ai_explanation}
          </p>
        ) : (
          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
            {typeof movie.genres === 'string'
              ? movie.genres
              : Array.isArray(movie.genres)
              ? movie.genres.map((g) => (typeof g === 'string' ? g : g.name)).join(' • ')
              : 'Popular on CineNOVA'}
          </p>
        )}
      </div>
    </div>
  );
};
