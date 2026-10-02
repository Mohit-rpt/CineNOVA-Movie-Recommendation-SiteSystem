import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, Star, Info, ChevronRight, ChevronLeft, Sparkles, Film } from 'lucide-react';
import type { Movie } from '../types';
import { watchlistService } from '../services/watchlist';
import { getTmdbImageUrl } from '../utils/image';

interface HeroBannerProps {
  featuredMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredMovies,
  onSelectMovie,
  onPlayTrailer,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Pick current movie safely, fallback to first movie
  const currentMovie = (featuredMovies.length > 0 && featuredMovies[currentIndex])
    ? featuredMovies[currentIndex]
    : (featuredMovies[0] || null);

  useEffect(() => {
    if (!currentMovie) return;
    const movieId = currentMovie.id || currentMovie.tmdb_id || 0;
    setInWatchlist(watchlistService.isInWatchlist(movieId));
    setImageError(false); // Reset image error state on slide switch
    const unsubscribe = watchlistService.subscribe(() => {
      setInWatchlist(watchlistService.isInWatchlist(movieId));
    });
    return unsubscribe;
  }, [currentMovie]);

  // Auto-rotate hero every 8 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  // Safe fallback if featuredMovies is still loading
  if (!currentMovie) {
    return (
      <div className="relative w-full h-[65vh] min-h-[480px] bg-[#0B0D17] flex items-center justify-center border-b border-white/5">
        <div className="text-center p-8 max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 text-violet-400">
            <Film className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">CineNOVA Cinematic Discovery</h2>
          <p className="text-xs text-gray-400">Discover Beyond the Screen. Your next obsession starts here.</p>
        </div>
      </div>
    );
  }

  const title = currentMovie.title || currentMovie.name || 'Featured Title';
  const backdropUrl = !imageError
    ? (getTmdbImageUrl(currentMovie.backdrop_path, 'original') || getTmdbImageUrl(currentMovie.poster_path, 'original'))
    : null;

  const releaseYear = (currentMovie.release_date || currentMovie.first_air_date || '').substring(0, 4);
  const rating = currentMovie.vote_average ? Number(currentMovie.vote_average).toFixed(1) : null;
  const isTv = currentMovie.media_type === 'tv' || Boolean(currentMovie.first_air_date);

  const handleWatchlist = () => {
    const added = watchlistService.toggleWatchlist(currentMovie);
    setInWatchlist(added);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  };

  return (
    <div className="relative w-full h-[75vh] min-h-[520px] max-h-[800px] overflow-hidden select-none bg-[#0B0D17]">
      {/* Background Backdrop Image with Graceful Ambient Fallback */}
      {backdropUrl ? (
        <div className="absolute inset-0">
          <img
            key={backdropUrl}
            src={backdropUrl}
            alt={`${title} backdrop`}
            fetchPriority="high"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center animate-fadeIn scale-100 transition-all duration-1000"
          />
        </div>
      ) : (
        /* Cinematic Designed Ambient Fallback */
        <div className="absolute inset-0 bg-gradient-to-br from-[#121525] via-[#191D30] to-[#0B0D17]">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Cinematic Gradient Vignettes for Maximum Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D17] via-[#0B0D17]/65 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D17] via-[#0B0D17]/80 to-transparent max-w-4xl" />

      {/* Hero Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-8 flex flex-col justify-end pb-16 sm:pb-20 z-10">
        <div className="max-w-2xl">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-3.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-violet-600/30 border border-violet-400/40 text-violet-200">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              CINENOVA SPOTLIGHT
            </span>

            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-black/60 backdrop-blur-md text-gray-300 border border-white/10 uppercase">
              {isTv ? 'TV Series' : 'Movie'}
            </span>

            {rating && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {rating}
              </span>
            )}

            {releaseYear && (
              <span className="text-xs text-gray-300 font-medium px-2 py-0.5 rounded bg-black/40 border border-white/5">
                {releaseYear}
              </span>
            )}

            <span className="text-[10px] text-cyan-400 font-mono tracking-wider px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
              4K ULTRA HD
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md mb-3.5">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed mb-6 font-normal drop-shadow">
            {currentMovie.overview || 'Explore this acclaimed cinematic masterpiece on CineNOVA.'}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play Trailer */}
            <button
              onClick={() => onPlayTrailer(currentMovie)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-xl shadow-violet-900/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              Watch Trailer
            </button>

            {/* View Details */}
            <button
              onClick={() => onSelectMovie(currentMovie)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#191D30]/80 hover:bg-[#222742] text-gray-200 hover:text-white border border-white/10 text-sm font-semibold transition-all backdrop-blur-md"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              Explore Details
            </button>

            {/* Add to Watchlist */}
            <button
              onClick={handleWatchlist}
              aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
              className={`p-3 rounded-xl border transition-all backdrop-blur-md ${
                inWatchlist
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-black/40 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Rotation Pagination Indicators & Nav Arrows */}
      <div className="absolute bottom-5 right-4 sm:right-8 z-20 flex items-center gap-3">
        {featuredMovies.length > 1 && (
          <>
            <div className="flex items-center gap-1.5 mr-2">
              {featuredMovies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-cyan-400' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handlePrev}
              aria-label="Previous featured movie"
              className="p-2 rounded-full bg-black/50 hover:bg-violet-600 text-white border border-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next featured movie"
              className="p-2 rounded-full bg-black/50 hover:bg-violet-600 text-white border border-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
