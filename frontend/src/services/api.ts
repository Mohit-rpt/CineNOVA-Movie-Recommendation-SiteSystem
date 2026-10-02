import type { Movie, MovieDetail, ModelSearchResult, SystemHealth } from '../types';

/**
 * Resolves the backend API base URL:
 * - In Production (e.g. Vercel): Reads `import.meta.env.VITE_API_BASE_URL`.
 * - In Local Development: Falls back to `/api` (proxied by Vite to http://localhost:8000).
 * Handles trailing slashes and ensures no duplicate `/api/api` paths.
 */
export const getApiBase = (): string => {
  const rawBase = import.meta.env.VITE_API_BASE_URL;
  if (!rawBase || typeof rawBase !== 'string') {
    return '/api';
  }
  const trimmed = rawBase.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE = getApiBase();

/**
 * Resilient fetch helper that handles non-200 responses, network failures,
 * and JSON parse errors gracefully without crashing the UI.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit, fallback: T = null as unknown as T): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`[CineNOVA API] HTTP ${res.status} on ${url}`);
      return fallback;
    }
    return await res.json();
  } catch (err) {
    console.error(`[CineNOVA API] Network error on ${url}:`, err);
    return fallback;
  }
}

export const api = {
  async getHealth(): Promise<SystemHealth> {
    const data = await safeFetchJson<SystemHealth | null>(`${API_BASE}/health`, undefined, null);
    if (!data) throw new Error('Failed to fetch system health');
    return data;
  },

  async updateTmdbKey(apiKey: string): Promise<{ configured: boolean; message: string }> {
    const data = await safeFetchJson<{ configured: boolean; message: string } | null>(
      `${API_BASE}/config/tmdb-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      },
      null
    );
    if (!data) throw new Error('Failed to update TMDB key');
    return data;
  },

  // TMDB proxy methods
  async getTrending(mediaType: 'all' | 'movie' | 'tv' = 'all', timeWindow: 'day' | 'week' = 'day', page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: Movie[] }>(
      `${API_BASE}/tmdb/trending?media_type=${mediaType}&time_window=${timeWindow}&page=${page}`,
      undefined,
      { results: [] }
    );
    return data.results || [];
  },

  async getPopularMovies(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/popular-movies?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getPopularTV(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/popular-tv?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' }));
  },

  async getTopRated(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/top-rated?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getUpcoming(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/upcoming?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getBollywood(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/bollywood?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
  },

  async getKoreanDramas(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/korean-dramas?page=${page}`,
      undefined,
      { results: [] }
    );
    return (data.results || []).map((m: any) => ({ ...m, media_type: 'tv' }));
  },

  async getKoreanMovies(page = 1): Promise<Movie[]> {
    const data = await safeFetchJson<{ results?: any[] }>(
      `${API_BASE}/tmdb/korean-movies?page=${page}`,
      undefined,
      { results: [] }
    );
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

    const data = await safeFetchJson<{ results?: any[]; total_pages?: number }>(
      `${API_BASE}/tmdb/discover?${query.toString()}`,
      undefined,
      { results: [], total_pages: 1 }
    );
    const mediaType = params.mediaType || 'movie';
    const formatted = (data.results || []).map((m: any) => ({
      ...m,
      media_type: m.media_type || mediaType,
    }));
    return { results: formatted, total_pages: data.total_pages || 1 };
  },

  async search(query: string, mediaType: 'multi' | 'movie' | 'tv' = 'multi', page = 1): Promise<Movie[]> {
    if (!query.trim()) return [];
    const data = await safeFetchJson<{ results?: Movie[] }>(
      `${API_BASE}/tmdb/search?query=${encodeURIComponent(query)}&media_type=${mediaType}&page=${page}`,
      undefined,
      { results: [] }
    );
    return data.results || [];
  },

  async getMovieDetail(id: number): Promise<MovieDetail | null> {
    return safeFetchJson<MovieDetail | null>(`${API_BASE}/tmdb/movie/${id}`, undefined, null);
  },

  async getTVDetail(id: number): Promise<MovieDetail | null> {
    return safeFetchJson<MovieDetail | null>(`${API_BASE}/tmdb/tv/${id}`, undefined, null);
  },

  // Pretrained AI Recommendation methods
  async recommendByMovie(title: string, topN = 12): Promise<Movie[]> {
    const data = await safeFetchJson<{ recommendations?: Movie[] }>(
      `${API_BASE}/recommend/movie?title=${encodeURIComponent(title)}&top_n=${topN}`,
      undefined,
      { recommendations: [] }
    );
    return data.recommendations || [];
  },

  async recommendByTags(query: string, topN = 12): Promise<Movie[]> {
    const data = await safeFetchJson<{ recommendations?: Movie[] }>(
      `${API_BASE}/recommend/tags?query=${encodeURIComponent(query)}&top_n=${topN}`,
      undefined,
      { recommendations: [] }
    );
    return data.recommendations || [];
  },

  async recommendPersonalized(titles: string[], topN = 12): Promise<Movie[]> {
    if (!titles.length) return [];
    const data = await safeFetchJson<{ recommendations?: Movie[] }>(
      `${API_BASE}/recommend/personalized`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titles, top_n: topN }),
      },
      { recommendations: [] }
    );
    return data.recommendations || [];
  },

  async searchModelTitles(query: string, limit = 10): Promise<ModelSearchResult[]> {
    if (!query.trim()) return [];
    const data = await safeFetchJson<{ results?: ModelSearchResult[] }>(
      `${API_BASE}/model/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      undefined,
      { results: [] }
    );
    return data.results || [];
  },
};
