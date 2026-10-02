import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, RotateCcw, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { api } from '../services/api';
import { MovieCard } from '../components/MovieCard';

interface ExplorePageProps {
  onSelectMovie: (movie: Movie) => void;
  initialMediaType?: 'movie' | 'tv';
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  onSelectMovie,
  initialMediaType = 'movie',
}) => {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(initialMediaType);
  const [selectedGenreId, setSelectedGenreId] = useState<number | undefined>(undefined);
  const [selectedGenreName, setSelectedGenreName] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedSort, setSelectedSort] = useState('popularity.desc');
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 14, name: 'Fantasy' },
    { id: 27, name: 'Horror' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' }
  ];

  const languages = [
    { code: '', label: 'All Languages' },
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi (Bollywood)' },
    { code: 'ko', label: 'Korean' },
    { code: 'ja', label: 'Japanese' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' }
  ];

  const sortOptions = [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Top Rated' },
    { value: 'primary_release_date.desc', label: 'Newest Releases' }
  ];

  const years = [2025, 2024, 2023, 2022, 2020, 2015, 2010, 2000, 1990];

  const fetchExploreMovies = async (targetPage = 1, append = false) => {
    if (targetPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.discover({
        mediaType,
        genreId: selectedGenreId,
        genreName: selectedGenreName,
        year: selectedYear,
        sortBy: selectedSort,
        minRating,
        language: selectedLanguage || undefined,
        page: targetPage
      });

      const items = res.results || [];
      if (append) {
        setMovies((prev) => [...prev, ...items]);
      } else {
        setMovies(items);
      }
      setHasMore(items.length >= 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchExploreMovies(1, false);
  }, [mediaType, selectedGenreId, selectedYear, selectedSort, minRating, selectedLanguage]);

  const handleClearFilters = () => {
    setSelectedGenreId(undefined);
    setSelectedGenreName('');
    setSelectedYear(undefined);
    setSelectedSort('popularity.desc');
    setMinRating(undefined);
    setSelectedLanguage('');
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExploreMovies(nextPage, true);
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-7 h-7 text-cyan-400" />
            Explore & Filter
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Browse movies and series by genres, ratings, origins, and release periods.
          </p>
        </div>

        {/* Media Type Switcher */}
        <div className="flex items-center bg-[#121525] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setMediaType('movie')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mediaType === 'movie'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setMediaType('tv')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              mediaType === 'tv'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TV Series
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#121525] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 shadow-xl shadow-black/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Sort By */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Sort Order</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#191D30] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-violet-500"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Language / Region */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Language / Region</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#191D30] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-violet-500"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Release Year</label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-[#191D30] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-violet-500"
            >
              <option value="">Any Year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Minimum Rating</label>
            <select
              value={minRating || ''}
              onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 rounded-xl bg-[#191D30] border border-white/10 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-violet-500"
            >
              <option value="">Any Rating</option>
              <option value="8.0">8.0+ ⭐ Masterpieces</option>
              <option value="7.0">7.0+ ⭐ Acclaimed</option>
              <option value="6.0">6.0+ ⭐ Good</option>
            </select>
          </div>
        </div>

        {/* Genre Chips */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">Filter by Genre</label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSelectedGenreId(undefined); setSelectedGenreName(''); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedGenreId === undefined
                  ? 'bg-violet-600 text-white font-semibold shadow-sm'
                  : 'bg-[#191D30] text-gray-400 hover:text-white'
              }`}
            >
              All Genres
            </button>
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGenreId(g.id);
                  setSelectedGenreName(g.name);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedGenreId === g.id
                    ? 'bg-violet-600 text-white font-semibold shadow-sm border border-violet-400/40'
                    : 'bg-[#191D30] text-gray-300 hover:text-white border border-white/5'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Filters */}
        <div className="flex justify-end pt-3 mt-3 border-t border-white/5">
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      </div>

      {/* Grid Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="aspect-[2/3] w-full rounded-xl bg-[#191D30] border border-white/5" />
              <div className="h-4 bg-[#191D30] rounded w-3/4" />
              <div className="h-3 bg-[#191D30] rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : movies.length > 0 ? (
        <div className="space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {movies.map((movie) => (
              <MovieCard
                key={`${movie.id || movie.tmdb_id}-${movie.title}`}
                movie={movie}
                onSelect={onSelectMovie}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#191D30] hover:bg-[#222742] border border-white/10 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg hover:border-violet-500/50"
              >
                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : null}
                Load More Titles
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-[#121525] rounded-2xl border border-white/5">
          <p className="text-base font-semibold text-gray-300">No movies match these filters.</p>
          <p className="text-xs text-gray-500 mt-1">Try resetting or broadening your criteria.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
