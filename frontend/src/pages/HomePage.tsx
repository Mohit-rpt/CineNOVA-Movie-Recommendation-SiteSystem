import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { Movie } from '../types';
import { api } from '../services/api';
import { watchlistService } from '../services/watchlist';
import { HeroBanner } from '../components/HeroBanner';
import { MovieRow } from '../components/MovieRow';

interface HomePageProps {
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  onNavigateToAiStudio: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectMovie,
  onPlayTrailer,
  onNavigateToAiStudio,
}) => {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingTime, setTrendingTime] = useState<'day' | 'week'>('day');
  const [aiRecommendations, setAiRecommendations] = useState<Movie[]>([]);
  const [aiSourceTitle, setAiSourceTitle] = useState<string>('Interstellar');
  const [aiLoading, setAiLoading] = useState(false);

  // Discovery rows
  const [hollywoodMovies, setHollywoodMovies] = useState<Movie[]>([]);
  const [bollywoodMovies, setBollywoodMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [popularTV, setPopularTV] = useState<Movie[]>([]);
  const [koreanDramas, setKoreanDramas] = useState<Movie[]>([]);
  const [koreanFilms, setKoreanFilms] = useState<Movie[]>([]);
  const [sciFiMovies, setSciFiMovies] = useState<Movie[]>([]);
  const [actionMovies, setActionMovies] = useState<Movie[]>([]);
  const [thrillerMovies, setThrillerMovies] = useState<Movie[]>([]);
  const [romanceMovies, setRomanceMovies] = useState<Movie[]>([]);
  const [horrorMovies, setHorrorMovies] = useState<Movie[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Movie[]>([]);
  const [animationMovies, setAnimationMovies] = useState<Movie[]>([]);

  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load hero and primary rows
  useEffect(() => {
    let isMounted = true;
    async function loadPrimaryData() {
      try {
        const [trending, popular] = await Promise.all([
          api.getTrending('all', trendingTime),
          api.getPopularMovies(1)
        ]);
        if (!isMounted) return;

        setTrendingMovies(trending);
        setHollywoodMovies(popular);

        // Featured heroes from trending with backdrops, with fallback to all trending/popular
        const withBackdrops = trending.filter((m) => Boolean(m.backdrop_path || m.poster_path));
        const featured = withBackdrops.length > 0 ? withBackdrops : (trending.length > 0 ? trending : popular);
        setFeaturedMovies(featured.slice(0, 5));

        // Load AI recommendations using watchlist if available, else top trending movie
        const topSeed = featured[0]?.title || featured[0]?.name || 'Interstellar';
        await loadAiRecommendations(topSeed);
      } catch (err) {
        console.error('Failed to load primary home data', err);
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }

    loadPrimaryData();
    return () => { isMounted = false; };
  }, [trendingTime]);

  // Load secondary discovery rows progressively
  useEffect(() => {
    let isMounted = true;
    async function loadSecondaryRows() {
      try {
        const [
          bollywood,
          topRated,
          tv,
          kdrama,
          kfilm,
          scifi,
          action,
          thriller,
          romance,
          horror,
          comedy,
          animation
        ] = await Promise.all([
          api.getBollywood(1),
          api.getTopRated(1),
          api.getPopularTV(1),
          api.getKoreanDramas(1),
          api.getKoreanMovies(1),
          api.discover({ genreId: 878, genreName: 'Science Fiction' }),
          api.discover({ genreId: 28, genreName: 'Action' }),
          api.discover({ genreId: 53, genreName: 'Thriller' }),
          api.discover({ genreId: 10749, genreName: 'Romance' }),
          api.discover({ genreId: 27, genreName: 'Horror' }),
          api.discover({ genreId: 35, genreName: 'Comedy' }),
          api.discover({ genreId: 16, genreName: 'Animation' })
        ]);

        if (!isMounted) return;
        setBollywoodMovies(bollywood);
        setTopRatedMovies(topRated);
        setPopularTV(tv);
        setKoreanDramas(kdrama);
        setKoreanFilms(kfilm);
        setSciFiMovies(scifi.results || []);
        setActionMovies(action.results || []);
        setThrillerMovies(thriller.results || []);
        setRomanceMovies(romance.results || []);
        setHorrorMovies(horror.results || []);
        setComedyMovies(comedy.results || []);
        setAnimationMovies(animation.results || []);
      } catch (err) {
        console.error('Failed to load secondary rows', err);
      }
    }

    const timer = setTimeout(loadSecondaryRows, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const loadAiRecommendations = async (seedTitle: string) => {
    setAiLoading(true);
    try {
      const watchlist = watchlistService.getWatchlist();
      if (watchlist.length > 0) {
        // Use composite user taste from watchlist!
        const titles = watchlist.map((m) => m.title || m.name || '').filter(Boolean);
        const recs = await api.recommendPersonalized(titles, 12);
        if (recs.length > 0) {
          setAiRecommendations(recs);
          setAiSourceTitle('Your Watchlist Taste Profile');
          return;
        }
      }

      // Model recommendation based on seed movie title
      const titleToQuery = seedTitle || 'Interstellar';
      const recs = await api.recommendByMovie(titleToQuery, 12);
      setAiRecommendations(recs);
      setAiSourceTitle(titleToQuery);
    } catch (e) {
      console.error('Error fetching AI recommendations', e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefreshAi = () => {
    const candidates = ['Toy Story', 'Inception', 'The Dark Knight', 'Gladiator', 'Pulp Fiction', 'Avatar', 'Interstellar', 'The Matrix'];
    const randomSeed = candidates[Math.floor(Math.random() * candidates.length)];
    loadAiRecommendations(randomSeed);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Featured Cinematic Hero */}
      <HeroBanner
        featuredMovies={featuredMovies}
        onSelectMovie={onSelectMovie}
        onPlayTrailer={onPlayTrailer}
      />

      {/* CORE AI FEATURE: "Recommended For You — CineNOVA AI" */}
      <div className="relative mt-2 sm:mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-[#191D30]/80 to-[#121525] border border-violet-500/30 shadow-xl shadow-violet-950/20 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[1.5px] flex-none shadow-md shadow-violet-900/30">
                  <div className="w-full h-full bg-[#121525] rounded-[9px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Recommended For You
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/40 text-violet-200 border border-violet-400/40">
                      CineNOVA AI
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Trained on 45,447 films • Content-similarity engine based on: <strong className="text-cyan-300">{aiSourceTitle}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleRefreshAi}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 hover:text-white transition-all border border-white/5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={onNavigateToAiStudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white transition-all shadow-md shadow-violet-900/30"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                  AI Studio
                </button>
              </div>
            </div>

            {/* AI Recommendations Carousel */}
            <MovieRow
              title=""
              movies={aiRecommendations}
              isLoading={aiLoading}
              onSelectMovie={onSelectMovie}
              isAiRow={true}
            />
          </div>
        </div>
      </div>

      {/* Row 1: Trending Now with Day/Week Toggle */}
      <MovieRow
        title="Trending Now"
        subtitle="Most watched titles across the global catalog"
        movies={trendingMovies}
        isLoading={loadingInitial}
        onSelectMovie={onSelectMovie}
        rightAction={
          <div className="flex items-center bg-[#191D30] rounded-lg p-0.5 border border-white/5 text-xs font-medium">
            <button
              onClick={() => setTrendingTime('day')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                trendingTime === 'day' ? 'bg-violet-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTrendingTime('week')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                trendingTime === 'week' ? 'bg-violet-600 text-white font-semibold shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              This Week
            </button>
          </div>
        }
      />

      {/* Row 2: Popular Hollywood */}
      <MovieRow
        title="Popular Hollywood"
        subtitle="Blockbusters leading the worldwide box office"
        movies={hollywoodMovies}
        isLoading={loadingInitial}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 3: Bollywood Hits */}
      <MovieRow
        title="Bollywood Hits"
        subtitle="Iconic Hindi cinema, high-energy dramas, and Indian blockbusters"
        movies={bollywoodMovies}
        isLoading={bollywoodMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 4: Top Rated Masterpieces */}
      <MovieRow
        title="Top Rated Masterpieces"
        subtitle="Critically acclaimed cinematic history with highest audience praise"
        movies={topRatedMovies}
        isLoading={topRatedMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 5: Popular TV Series */}
      <MovieRow
        title="Popular TV Series & Bingeable Hits"
        subtitle="Top serials, limited series, and streaming sensations"
        movies={popularTV}
        isLoading={popularTV.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 6: Korean Dramas (K-Dramas) */}
      <MovieRow
        title="Korean Dramas (K-Dramas)"
        subtitle="Romantic storylines, emotional twists, and sensational Korean series"
        movies={koreanDramas}
        isLoading={koreanDramas.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 7: Korean Cinema */}
      <MovieRow
        title="Korean Cinema & Thrillers"
        subtitle="Groundbreaking auteur cinema and intense Korean feature films"
        movies={koreanFilms}
        isLoading={koreanFilms.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 8: Sci-Fi & Cyberpunk */}
      <MovieRow
        title="Sci-Fi & Cyberpunk Frontiers"
        subtitle="Time loops, alternate dimensions, and distant galaxies"
        movies={sciFiMovies}
        isLoading={sciFiMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 9: Action & High Octane Adventure */}
      <MovieRow
        title="Action & Adrenaline"
        subtitle="Explosive spectacles, martial arts, and epic quests"
        movies={actionMovies}
        isLoading={actionMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 10: Mind-Bending Thrillers */}
      <MovieRow
        title="Thriller & Suspense"
        subtitle="Psychological tension, unexpected twists, and high stakes"
        movies={thrillerMovies}
        isLoading={thrillerMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 11: Romance & Drama */}
      <MovieRow
        title="Romance & Heartfelt Stories"
        subtitle="Passionate encounters, romantic comedies, and heartfelt journeys"
        movies={romanceMovies}
        isLoading={romanceMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 12: Horror Nights */}
      <MovieRow
        title="Horror Nights"
        subtitle="Supernatural terror, spine-chilling psychological nightmares"
        movies={horrorMovies}
        isLoading={horrorMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 13: Comedy Club */}
      <MovieRow
        title="Comedy Club"
        subtitle="Laugh-out-loud favorites and witty banter"
        movies={comedyMovies}
        isLoading={comedyMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />

      {/* Row 14: Anime & Animation */}
      <MovieRow
        title="Anime & Animated Universes"
        subtitle="Visually stunning animation, anime masterworks, and family epics"
        movies={animationMovies}
        isLoading={animationMovies.length === 0}
        onSelectMovie={onSelectMovie}
      />
    </div>
  );
};
