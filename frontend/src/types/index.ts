export interface Movie {
  id: number;
  tmdb_id?: number;
  title: string;
  name?: string; // For TV shows
  overview: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genres?: string | Array<{ id?: number; name: string }>;
  tagline?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  popularity?: number;
  
  // AI Recommendation properties
  similarity_score?: number;
  match_percentage?: number;
  ai_explanation?: string;
  is_ai_pick?: boolean;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface MovieDetail extends Movie {
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: VideoItem[];
  };
  similar?: {
    results: Movie[];
  };
  recommendations?: {
    results: Movie[];
  };
}

export interface ModelSearchResult {
  title: string;
  genres: string;
  vote_average: number;
  popularity: number;
  overview: string;
  index: number;
}

export interface SystemHealth {
  status: string;
  product: string;
  tagline: string;
  model_loaded: boolean;
  total_model_movies: number;
  tmdb_configured: boolean;
}
