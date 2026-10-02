import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { Movie } from '../types';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  isLoading?: boolean;
  onSelectMovie: (movie: Movie) => void;
  isAiRow?: boolean;
  rightAction?: React.ReactNode;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  subtitle,
  movies,
  isLoading = false,
  onSelectMovie,
  isAiRow = false,
  rightAction
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.75;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!isLoading && movies.length === 0) {
    return null;
  }

  return (
    <section className="relative my-8 sm:my-10 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {isAiRow && (
              <span className="p-1 rounded-md bg-violet-600/20 border border-violet-500/40 text-violet-400">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </span>
            )}
            <h3 className={`text-lg sm:text-2xl font-bold tracking-tight text-gray-100 ${
              isAiRow ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-cyan-200 to-indigo-300' : ''
            }`}>
              {title}
            </h3>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightAction}
          {/* Scroll Arrows for Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <button
              onClick={() => scroll('left')}
              aria-label={`Scroll ${title} left`}
              className="p-2 rounded-full bg-[#191D30]/80 hover:bg-violet-600 border border-white/10 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label={`Scroll ${title} right`}
              className="p-2 rounded-full bg-[#191D30]/80 hover:bg-violet-600 border border-white/10 text-gray-300 hover:text-white transition-colors duration-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Carousel */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        aria-label={`${title} carousel`}
        className="flex gap-3 sm:gap-4.5 overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory pb-3 pt-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50 rounded-xl"
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-none w-[140px] sm:w-[170px] md:w-[195px] flex flex-col gap-2 animate-pulse"
              >
                <div className="aspect-[2/3] w-full rounded-xl bg-[#191D30] border border-white/5" />
                <div className="h-4 bg-[#191D30] rounded w-3/4" />
                <div className="h-3 bg-[#191D30] rounded w-1/2" />
              </div>
            ))
          : movies.map((movie) => (
              <div
                key={movie.id || movie.tmdb_id || movie.title}
                className="flex-none w-[140px] sm:w-[170px] md:w-[195px] snap-start"
              >
                <MovieCard
                  movie={movie}
                  onSelect={onSelectMovie}
                  showAiBadge={isAiRow}
                />
              </div>
            ))}
      </div>
    </section>
  );
};
