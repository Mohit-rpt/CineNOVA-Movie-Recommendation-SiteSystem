import type { Movie } from '../types';

const WATCHLIST_STORAGE_KEY = 'cinenova_watchlist_v1';

export const watchlistService = {
  getWatchlist(): Movie[] {
    try {
      const data = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  addToWatchlist(movie: Movie): boolean {
    const list = this.getWatchlist();
    const movieKey = movie.id || movie.tmdb_id;
    if (!movieKey) return false;

    const exists = list.some(item => (item.id || item.tmdb_id) === movieKey);
    if (!exists) {
      const updated = [movie, ...list];
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('cinenova_watchlist_updated'));
      return true;
    }
    return false;
  },

  removeFromWatchlist(id: number): boolean {
    const list = this.getWatchlist();
    const updated = list.filter(item => (item.id || item.tmdb_id) !== id);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cinenova_watchlist_updated'));
    return true;
  },

  toggleWatchlist(movie: Movie): boolean {
    const movieKey = movie.id || movie.tmdb_id;
    if (!movieKey) return false;
    if (this.isInWatchlist(movieKey)) {
      this.removeFromWatchlist(movieKey);
      return false; // Removed
    } else {
      this.addToWatchlist(movie);
      return true; // Added
    }
  },

  isInWatchlist(id: number): boolean {
    const list = this.getWatchlist();
    return list.some(item => (item.id || item.tmdb_id) === id);
  },

  subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener('cinenova_watchlist_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('cinenova_watchlist_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }
};
