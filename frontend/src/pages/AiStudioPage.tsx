import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Film, Tag, Bookmark, Loader2, CheckCircle2, Info } from 'lucide-react';
import type { Movie, ModelSearchResult } from '../types';
import { api } from '../services/api';
import { watchlistService } from '../services/watchlist';
import { MovieCard } from '../components/MovieCard';

interface AiStudioPageProps {
  onSelectMovie: (movie: Movie) => void;
}

export const AiStudioPage: React.FC<AiStudioPageProps> = ({ onSelectMovie }) => {
  const [activeMode, setActiveMode] = useState<'movie' | 'mood' | 'watchlist'>('movie');

  // Mode 1: Search movie title
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModelSearchResult[]>([]);
  const [selectedMovieTitle, setSelectedMovieTitle] = useState('Inception');
  const [isSearchingTitles, setIsSearchingTitles] = useState(false);

  // Mode 2: Mood and keywords
  const [selectedVibe, setSelectedVibe] = useState('Mind-Bending Psychological Sci-Fi');
  const [customVibe, setCustomVibe] = useState('');

  // Watchlist items
  const [watchlistTitles, setWatchlistTitles] = useState<string[]>([]);

  // Results state
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const curatedVibes = [
    'Mind-Bending Psychological Sci-Fi',
    'Dark Gritty Neo-Noir Crime Mystery',
    'Heartwarming Coming-of-Age Roadtrip',
    'Fast-Paced High Stakes Heist Thriller',
    'Atmospheric Supernatural Cosmic Horror',
    'Epic Historical Warfare & Swordplay',
    'Whimsical Romantic Comedy in Big City',
    'Cyberpunk Dystopian Future Revolution'
  ];

  // Update watchlist
  useEffect(() => {
    const list = watchlistService.getWatchlist();
    const titles = list.map((m) => m.title || m.name || '').filter(Boolean);
    setWatchlistTitles(titles);
  }, []);

  // Debounced title search for Mode 1
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingTitles(true);
      try {
        const res = await api.searchModelTitles(searchQuery, 8);
        setSearchResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingTitles(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial recommendation run on mount
  useEffect(() => {
    handleRunRecommendations('Inception', 'movie');
  }, []);

  const handleRunRecommendations = async (inputTitle?: string, modeOverride?: 'movie' | 'mood' | 'watchlist') => {
    const mode = modeOverride || activeMode;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      let recs: Movie[] = [];
      if (mode === 'movie') {
        const title = inputTitle || selectedMovieTitle;
        if (!title.trim()) {
          setError('Please select or enter a movie title.');
          setIsLoading(false);
          return;
        }
        recs = await api.recommendByMovie(title, 15);
      } else if (mode === 'mood') {
        const prompt = customVibe.trim() || selectedVibe;
        recs = await api.recommendByTags(prompt, 15);
      } else if (mode === 'watchlist') {
        if (watchlistTitles.length === 0) {
          setError('Your My List is currently empty. Add movies to your list first!');
          setIsLoading(false);
          return;
        }
        recs = await api.recommendPersonalized(watchlistTitles, 15);
      }

      setRecommendations(recs);
      if (recs.length === 0) {
        setError('No direct matches found in the 45,447 catalog. Try adjusting your query.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing recommendation inference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 text-xs font-bold tracking-wide uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
          Pretrained Model Studio
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Find Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-indigo-300">Obsession</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mt-3 leading-relaxed">
          Powered by CineNOVA's pretrained TF-IDF cosine-similarity engine across 45,447 international films. Zero generic fluff — pure thematic math.
        </p>

        {/* Mode Selector */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 p-1.5 bg-[#121525] border border-white/10 rounded-2xl max-w-md mx-auto shadow-inner">
          <button
            onClick={() => setActiveMode('movie')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'movie'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            By Movie
          </button>
          <button
            onClick={() => setActiveMode('mood')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'mood'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            By Mood & Vibe
          </button>
          <button
            onClick={() => setActiveMode('watchlist')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'watchlist'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            From My List ({watchlistTitles.length})
          </button>
        </div>
      </div>

      {/* Control Panel by Mode */}
      <div className="max-w-3xl mx-auto mb-12 p-6 rounded-2xl bg-[#121525] border border-violet-500/20 shadow-xl shadow-black/40">
        {activeMode === 'movie' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                1. Select a Movie You Loved (45k Titles Available)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search catalog title (e.g. Inception, Interstellar, The Godfather)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#191D30] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"
                />
                <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                {isSearchingTitles && (
                  <Loader2 className="w-4 h-4 text-violet-400 absolute right-3.5 top-3.5 animate-spin" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 p-2 bg-[#191D30] border border-white/10 rounded-xl shadow-2xl max-h-56 overflow-y-auto space-y-1">
                  {searchResults.map((res) => (
                    <button
                      key={res.index}
                      onClick={() => {
                        setSelectedMovieTitle(res.title);
                        setSearchQuery('');
                        setSearchResults([]);
                        handleRunRecommendations(res.title, 'movie');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-violet-600/30 flex items-center justify-between text-xs text-gray-200 transition-colors"
                    >
                      <span className="font-semibold">{res.title}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">{res.genres}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Title Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#191D30]/80 border border-violet-500/30">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-400">Selected Seed Movie:</span>
                <span className="font-bold text-cyan-300 text-sm">{selectedMovieTitle}</span>
              </div>
              <button
                onClick={() => handleRunRecommendations(selectedMovieTitle, 'movie')}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-900/30 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                Generate Recommendations
              </button>
            </div>
          </div>
        )}

        {activeMode === 'mood' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Pick a Curated Cinematic Vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {curatedVibes.map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => {
                      setSelectedVibe(vibe);
                      setCustomVibe('');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedVibe === vibe && !customVibe
                        ? 'bg-violet-600 text-white font-semibold shadow-sm border border-violet-400/50'
                        : 'bg-[#191D30] text-gray-300 hover:text-white border border-white/5'
                    }`}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Or Enter Custom Themes / Plot Keywords
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. artificial intelligence consciousness space lonely..."
                  value={customVibe}
                  onChange={(e) => setCustomVibe(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#191D30] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => handleRunRecommendations(undefined, 'mood')}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-900/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
                  Vectorize & Match
                </button>
              </div>
            </div>
          </div>
        )}

        {activeMode === 'watchlist' && (
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-gray-100">
                  Composite Taste Profile ({watchlistTitles.length} Saved Films)
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  The model blends the mathematical vectors of every movie on your list into a single taste profile.
                </p>
              </div>
              <button
                onClick={() => handleRunRecommendations(undefined, 'watchlist')}
                disabled={isLoading || watchlistTitles.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md shadow-violet-900/30 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
                Analyze My Watchlist
              </button>
            </div>

            {watchlistTitles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {watchlistTitles.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#191D30] text-cyan-300 border border-white/5 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#191D30]/60 border border-white/5 text-center">
                <Info className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-300">
                  You have not added any titles to My List yet. Add a few movies from the Home page or Search, then return here to generate personalized recommendations!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              AI Recommendation Results
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ranked by cosine similarity against {activeMode === 'movie' ? selectedMovieTitle : activeMode === 'mood' ? selectedVibe : 'Your Taste Profile'}
            </p>
          </div>
          {recommendations.length > 0 && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-800/40">
              {recommendations.length} MATCHES
            </span>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 animate-pulse">
                <div className="aspect-[2/3] w-full rounded-xl bg-[#191D30] border border-white/5" />
                <div className="h-4 bg-[#191D30] rounded w-3/4" />
                <div className="h-3 bg-[#191D30] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {recommendations.map((movie) => (
              <MovieCard
                key={movie.id || movie.tmdb_id || movie.title}
                movie={movie}
                onSelect={onSelectMovie}
                showAiBadge={true}
              />
            ))}
          </div>
        ) : hasSearched && !error ? (
          <div className="text-center py-12 text-gray-400">
            No recommendations generated. Try another seed movie or keyword!
          </div>
        ) : null}
      </div>
    </div>
  );
};
