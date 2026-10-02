import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, TrendingUp } from 'lucide-react';
import type { Movie } from '../types';
import { api } from '../services/api';
import { MovieCard } from '../components/MovieCard';

interface SearchPageProps {
  onSelectMovie: (movie: Movie) => void;
  initialQuery?: string;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onSelectMovie,
  initialQuery = ''
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [mediaFilter, setMediaFilter] = useState<'multi' | 'movie' | 'tv'>('multi');
  const [results, setResults] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const trendingSearches = [
    'Inception', 'Interstellar', 'Oppenheimer', 'Dune', 'Avengers',
    'Parasite', 'Spider-Man', 'Stranger Things', 'Squid Game', 'The Dark Knight'
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const data = await api.search(query.trim(), mediaFilter, 1);
        setResults(data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, mediaFilter]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Search Bar Input */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-cyan-400 absolute left-4 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search movies, series, titles, or actors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-2xl bg-[#121525] border border-white/10 text-white placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 shadow-xl transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search query"
              className="absolute right-4 p-1 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Media Filter Tabs */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMediaFilter('multi')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mediaFilter === 'multi'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white bg-[#121525]'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setMediaFilter('movie')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mediaFilter === 'movie'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white bg-[#121525]'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setMediaFilter('tv')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                mediaFilter === 'tv'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white bg-[#121525]'
              }`}
            >
              TV Series
            </button>
          </div>

          {results.length > 0 && (
            <span className="text-xs text-gray-400 font-mono">
              {results.length} found
            </span>
          )}
        </div>
      </div>

      {/* Suggested Trending Searches when query is empty */}
      {!query && (
        <div className="max-w-2xl mx-auto mb-16 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Trending Searches on CineNOVA
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {trendingSearches.map((title) => (
              <button
                key={title}
                onClick={() => setQuery(title)}
                className="px-3.5 py-1.5 rounded-xl bg-[#121525] hover:bg-[#191D30] border border-white/5 hover:border-violet-500/40 text-xs text-gray-300 hover:text-white transition-all"
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-[#191D30] border border-white/5" />
              <div className="h-4 bg-[#191D30] rounded w-3/4" />
              <div className="h-3 bg-[#191D30] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {results.map((movie) => (
            <MovieCard
              key={`${movie.id || movie.tmdb_id}-${movie.title || movie.name}`}
              movie={movie}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      ) : hasSearched ? (
        <div className="text-center py-20 bg-[#121525] rounded-2xl border border-white/5 max-w-xl mx-auto p-8">
          <Film className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-200">No titles found for "{query}"</h3>
          <p className="text-xs text-gray-400 mt-1">
            Check the spelling or try searching for a different keyword, director, or franchise.
          </p>
        </div>
      ) : null}
    </div>
  );
};
