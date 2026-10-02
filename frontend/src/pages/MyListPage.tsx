import React, { useState, useEffect } from 'react';
import { Bookmark, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import type { Movie } from '../types';
import { watchlistService } from '../services/watchlist';
import { api } from '../services/api';
import { MovieCard } from '../components/MovieCard';
import { MovieRow } from '../components/MovieRow';

interface MyListPageProps {
  onSelectMovie: (movie: Movie) => void;
  onNavigateHome: () => void;
  onNavigateAiStudio: () => void;
}

export const MyListPage: React.FC<MyListPageProps> = ({
  onSelectMovie,
  onNavigateHome,
  onNavigateAiStudio
}) => {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');
  const [personalizedRecs, setPersonalizedRecs] = useState<Movie[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const loadList = () => {
    setWatchlist(watchlistService.getWatchlist());
  };

  useEffect(() => {
    loadList();
    const unsubscribe = watchlistService.subscribe(loadList);
    return unsubscribe;
  }, []);

  const handleGenerateTasteRecs = async () => {
    if (watchlist.length === 0) return;
    setLoadingRecs(true);
    try {
      const titles = watchlist.map((m) => m.title || m.name || '').filter(Boolean);
      const recs = await api.recommendPersonalized(titles, 12);
      setPersonalizedRecs(recs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRecs(false);
    }
  };

  const filteredMovies = watchlist.filter((m) => {
    if (filter === 'all') return true;
    const isTv = m.media_type === 'tv' || Boolean(m.first_air_date);
    return filter === 'tv' ? isTv : !isTv;
  });

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bookmark className="w-7 h-7 text-cyan-400" />
            My List & Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {watchlist.length} titles saved to your private CineNOVA watchlist.
          </p>
        </div>

        {/* Action Button: AI Taste Engine */}
        {watchlist.length > 0 && (
          <button
            onClick={handleGenerateTasteRecs}
            disabled={loadingRecs}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-violet-900/30 self-start sm:self-auto disabled:opacity-50"
          >
            {loadingRecs ? <Loader2 className="w-4 h-4 animate-spin text-cyan-300" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
            Get AI Recommendations from My List
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      {watchlist.length > 0 && (
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-[#121525] text-gray-400 hover:text-white'
            }`}
          >
            All Titles ({watchlist.length})
          </button>
          <button
            onClick={() => setFilter('movie')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'movie'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-[#121525] text-gray-400 hover:text-white'
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setFilter('tv')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'tv'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-[#121525] text-gray-400 hover:text-white'
            }`}
          >
            Series
          </button>
        </div>
      )}

      {/* Grid of Saved Movies */}
      {filteredMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 mb-16">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={`${movie.id || movie.tmdb_id}-${movie.title || movie.name}`}
              movie={movie}
              onSelect={onSelectMovie}
            />
          ))}
        </div>
      ) : watchlist.length > 0 ? (
        <div className="text-center py-16 text-gray-400">
          No {filter === 'tv' ? 'series' : 'movies'} saved in your list.
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-24 bg-[#121525] rounded-3xl border border-white/5 max-w-2xl mx-auto p-8 mb-16 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Watchlist is Empty</h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            Start adding movies and series to create your personalized library. CineNOVA's AI will learn your taste and generate hyper-tailored recommendations!
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              Browse Trending Titles <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateAiStudio}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#191D30] hover:bg-[#222742] text-cyan-300 font-semibold text-xs sm:text-sm border border-cyan-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Open AI Studio
            </button>
          </div>
        </div>
      )}

      {/* Model-Generated Taste Profile Row (if generated) */}
      {personalizedRecs.length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <MovieRow
            title="AI Recommended for You Based on Your Watchlist"
            subtitle="Pretrained model composite taste vector calculation"
            movies={personalizedRecs}
            isLoading={loadingRecs}
            onSelectMovie={onSelectMovie}
            isAiRow={true}
          />
        </div>
      )}
    </div>
  );
};
