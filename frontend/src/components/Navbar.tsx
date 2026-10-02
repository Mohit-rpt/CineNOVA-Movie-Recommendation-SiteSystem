import React, { useState, useEffect } from 'react';
import { Film, Search, Bookmark, Sparkles, SlidersHorizontal, Key } from 'lucide-react';
import { watchlistService } from '../services/watchlist';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenTmdbModal: () => void;
  isTmdbConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch,
  onOpenTmdbModal,
  isTmdbConfigured,
}) => {
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(watchlistService.getWatchlist().length);
    };
    updateCount();
    const unsubscribe = watchlistService.subscribe(updateCount);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'explore', label: 'Explore', icon: SlidersHorizontal },
    { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, badge: 'AI' },
    { id: 'movies', label: 'Movies' },
    { id: 'series', label: 'Series' },
    { id: 'my-list', label: 'My List', count: watchlistCount },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled ? 'glass-nav shadow-lg shadow-black/40 py-3' : 'bg-gradient-to-b from-[#0B0D17]/95 via-[#0B0D17]/80 to-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer group focus:outline-none select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-900/40 group-hover:shadow-cyan-500/30 transition-all">
            <div className="w-full h-full bg-[#0B0D17] rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-cyan-400 group-hover:text-violet-400 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                Cine<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">NOVA</span>
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-gray-400 font-mono -mt-1 hidden sm:block">
              Discover Beyond
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`relative px-3.5 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border border-violet-500/50 shadow-sm shadow-violet-900/50'
                    : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />}
                <span>{link.label}</span>

                {link.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-gradient-to-r from-violet-500 to-cyan-400 text-black">
                    {link.badge}
                  </span>
                )}

                {typeof link.count === 'number' && link.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Trigger */}
          <button
            onClick={onOpenSearch}
            aria-label="Search movies"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#191D30]/90 hover:bg-[#222742] border border-white/10 hover:border-violet-500/40 text-gray-300 hover:text-white text-xs transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline text-xs text-gray-400">Search titles...</span>
            <kbd className="hidden lg:inline text-[10px] font-mono bg-black/40 px-1.5 py-0.5 rounded text-gray-400 border border-white/5">
              ⌘K
            </kbd>
          </button>

          {/* TMDB Connection Button */}
          <button
            onClick={onOpenTmdbModal}
            aria-label="TMDB Configuration"
            title={isTmdbConfigured ? 'TMDB API Connected' : 'Click to connect TMDB API Key'}
            className={`p-2 rounded-full border transition-all ${
              isTmdbConfigured
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse-subtle'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Watchlist Link button */}
          <button
            onClick={() => onNavigate('my-list')}
            aria-label="View My List"
            className="md:hidden relative p-2 rounded-full bg-[#191D30] border border-white/10 text-gray-300"
          >
            <Bookmark className="w-4 h-4 text-cyan-400" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-black text-[9px] font-bold flex items-center justify-center">
                {watchlistCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
