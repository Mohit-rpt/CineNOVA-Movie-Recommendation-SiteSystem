import React, { useState, useEffect } from 'react';
import { Home, Compass, Sparkles, Search, Bookmark } from 'lucide-react';
import { watchlistService } from '../services/watchlist';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenSearch
}) => {
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(watchlistService.getWatchlist().length);
    };
    updateCount();
    const unsubscribe = watchlistService.subscribe(updateCount);
    return unsubscribe;
  }, []);

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'ai-studio', label: 'AI Studio', icon: Sparkles, isAi: true },
    { id: 'search', label: 'Search', icon: Search, isAction: true },
    { id: 'my-list', label: 'My List', icon: Bookmark, count: watchlistCount },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D17]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={onOpenSearch}
                className="flex flex-col items-center justify-center py-1 px-2.5 text-gray-400 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5 mb-0.5 text-cyan-400" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition-colors ${
                isActive
                  ? item.isAi
                    ? 'text-cyan-300 font-bold'
                    : 'text-violet-400 font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? (item.isAi ? 'text-cyan-400' : 'text-violet-400') : ''}`} />
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-bold bg-cyan-400 text-black">
                    {item.count}
                  </span>
                )}
                {item.isAi && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
