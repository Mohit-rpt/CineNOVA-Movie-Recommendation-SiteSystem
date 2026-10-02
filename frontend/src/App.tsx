import React, { useState, useEffect } from 'react';
import type { Movie, VideoItem, SystemHealth } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { TrailerModal } from './components/TrailerModal';
import { TmdbKeyModal } from './components/TmdbKeyModal';

import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { AiStudioPage } from './pages/AiStudioPage';
import { DetailPage } from './pages/DetailPage';
import { SearchPage } from './pages/SearchPage';
import { MyListPage } from './pages/MyListPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [trailerVideos, setTrailerVideos] = useState<VideoItem[]>([]);
  const [isTmdbModalOpen, setIsTmdbModalOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Check backend health and TMDB status
  const checkHealth = async () => {
    try {
      const h = await api.getHealth();
      setSystemHealth(h);
    } catch (e) {
      console.warn('Backend health check error:', e);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSelectedMovie(null);
        setCurrentTab('search');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Browser history support
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state) {
        setCurrentTab(e.state.tab || 'home');
        setSelectedMovie(e.state.movie || null);
      } else {
        setSelectedMovie(null);
        setCurrentTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (tab: string) => {
    setSelectedMovie(null);
    setCurrentTab(tab);
    window.history.pushState({ tab, movie: null }, '', `#${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    window.history.pushState({ tab: currentTab, movie }, '', `#movie-${movie.id || movie.tmdb_id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedMovie(null);
    window.history.back();
  };

  const handlePlayTrailer = async (movie: Movie) => {
    setTrailerMovie(movie);
    const movieId = movie.id || movie.tmdb_id;
    if (movieId) {
      try {
        const isTv = movie.media_type === 'tv' || Boolean(movie.first_air_date);
        const detail = isTv ? await api.getTVDetail(movieId) : await api.getMovieDetail(movieId);
        setTrailerVideos(detail?.videos?.results || []);
      } catch (e) {
        setTrailerVideos([]);
      }
    } else {
      setTrailerVideos([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D17] text-[#F7F7FC] flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={navigateTo}
        onOpenSearch={() => navigateTo('search')}
        onOpenTmdbModal={() => setIsTmdbModalOpen(true)}
        isTmdbConfigured={Boolean(systemHealth?.tmdb_configured)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {selectedMovie ? (
          <DetailPage
            movie={selectedMovie}
            onBack={handleBackFromDetail}
            onSelectMovie={handleSelectMovie}
            onPlayTrailer={handlePlayTrailer}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomePage
                onSelectMovie={handleSelectMovie}
                onPlayTrailer={handlePlayTrailer}
                onNavigateToAiStudio={() => navigateTo('ai-studio')}
              />
            )}

            {currentTab === 'explore' && (
              <ExplorePage
                onSelectMovie={handleSelectMovie}
                initialMediaType="movie"
              />
            )}

            {currentTab === 'movies' && (
              <ExplorePage
                onSelectMovie={handleSelectMovie}
                initialMediaType="movie"
              />
            )}

            {currentTab === 'series' && (
              <ExplorePage
                onSelectMovie={handleSelectMovie}
                initialMediaType="tv"
              />
            )}

            {currentTab === 'ai-studio' && (
              <AiStudioPage
                onSelectMovie={handleSelectMovie}
              />
            )}

            {currentTab === 'search' && (
              <SearchPage
                onSelectMovie={handleSelectMovie}
              />
            )}

            {currentTab === 'my-list' && (
              <MyListPage
                onSelectMovie={handleSelectMovie}
                onNavigateHome={() => navigateTo('home')}
                onNavigateAiStudio={() => navigateTo('ai-studio')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onNavigate={navigateTo}
        onOpenSearch={() => navigateTo('search')}
      />

      {/* Official Trailer Modal */}
      <TrailerModal
        isOpen={Boolean(trailerMovie)}
        onClose={() => setTrailerMovie(null)}
        title={trailerMovie?.title || trailerMovie?.name || ''}
        videos={trailerVideos}
      />

      {/* TMDB Key Settings Modal */}
      <TmdbKeyModal
        isOpen={isTmdbModalOpen}
        onClose={() => setIsTmdbModalOpen(false)}
        isConfigured={Boolean(systemHealth?.tmdb_configured)}
        onKeyUpdated={checkHealth}
      />
    </div>
  );
};

export default App;
