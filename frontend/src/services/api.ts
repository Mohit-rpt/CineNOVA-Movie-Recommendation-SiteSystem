import type { Movie, MovieDetail, ModelSearchResult, SystemHealth } from '../types';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  async updateTmdbKey(apiKey: string): Promise<{ configured: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/config/tmdb-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) throw new Error('Failed to update TMDB key');
    return res.json();
  },

  // TMDB proxy methods
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/trending?media_type=${mediaType}&time_window=${timeWindow}&page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  },

  async getPopularMovies(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/popular-movies?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getPopularTV(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/popular-tv?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' }));
  },

  async getTopRated(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/top-rated?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getUpcoming(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/upcoming?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getBollywood(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/bollywood?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getKoreanDramas(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/korean-dramas?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' }));
  },

  async getKoreanMovies(page = 1): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/tmdb/korean-movies?page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async discover(params: {
    mediaType?: 'movie' | 'tv';
    genreId?: number;
    genreName?: string;
    year?: number;
    sortBy?: string;
    minRating?: number;
    language?: string;
    page?: number;
  }): Promise<{ results: Movie[]; total_pages?: number }> {
    const query = new URLSearchParams();
    if (params.mediaType) query.set('media_type', params.mediaType);
    if (params.genreId) query.set('genre_id', String(params.genreId));
    if (params.genreName) query.set('genre_name', params.genreName);
    if (params.year) query.set('year', String(params.year));
    if (params.sortBy) query.set('sort_by', params.sortBy);
    if (params.minRating) query.set('min_rating', String(params.minRating));
    if (params.language) query.set('language', params.language);
    if (params.page) query.set('page', String(params.page));

    const res = await fetch(`${API_BASE}/tmdb/discover?${query.toString()}`);
    if (!res.ok) return { results: [] };
    const data = await res.json();
    const mediaType = params.mediaType || 'movie';
    const formatted = (data.results || []).map((m: any) => ({
      ...m,
      media_type: m.media_type || mediaType,
    }));
    return { results: formatted, total_pages: data.total_pages || 1 };
  },

  async search(query: string, mediaType: 'multi' | 'movie' | 'tv' = 'multi', page = 1): Promise<Movie[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE}/tmdb/search?query=${encodeURIComponent(query)}&media_type=${mediaType}&page=${page}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  },

  async getMovieDetail(id: number): Promise<MovieDetail | null> {
    const res = await fetch(`${API_BASE}/tmdb/movie/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  async getTVDetail(id: number): Promise<MovieDetail | null> {
    const res = await fetch(`${API_BASE}/tmdb/tv/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  // Pretrained AI Recommendation methods
  async recommendByMovie(title: string, topN = 12): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/recommend/movie?title=${encodeURIComponent(title)}&top_n=${topN}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  },

  async recommendByTags(query: string, topN = 12): Promise<Movie[]> {
    const res = await fetch(`${API_BASE}/recommend/tags?query=${encodeURIComponent(query)}&top_n=${topN}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  },

  async recommendPersonalized(titles: string[], topN = 12): Promise<Movie[]> {
    if (!titles.length) return [];
    const res = await fetch(`${API_BASE}/recommend/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titles, top_n: topN }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.recommendations || [];
  },

  async searchModelTitles(query: string, limit = 10): Promise<ModelSearchResult[]> {
    if (!query.trim()) return [];
    const res = await fetch(`${API_BASE}/model/search?query=${encodeURIComponent(query)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  },
};
