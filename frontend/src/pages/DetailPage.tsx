import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Calendar, Play, Plus, Check, Tv, Film, User } from 'lucide-react';
import type { Movie, MovieDetail } from '../types';
import { api } from '../services/api';
import { watchlistService } from '../services/watchlist';
import { PosterImage } from '../components/PosterImage';
import { MovieRow } from '../components/MovieRow';
import { getTmdbImageUrl } from '../utils/image';

interface DetailPageProps {
  movie: Movie;
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
}

export const DetailPage: React.FC<DetailPageProps> = ({
  movie,
  onBack,
  onSelectMovie,
  onPlayTrailer
}) => {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [aiRecs, setAiRecs] = useState<Movie[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const movieId = movie.id || movie.tmdb_id || 0;
  const isTv = movie.media_type === 'tv' || Boolean(movie.first_air_date);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setInWatchlist(watchlistService.isInWatchlist(movieId));
    const unsubscribe = watchlistService.subscribe(() => {
      setInWatchlist(watchlistService.isInWatchlist(movieId));
    });

    let isMounted = true;
    async function fetchDetails() {
      try {
        let data: MovieDetail | null = null;
        if (isTv) {
          data = await api.getTVDetail(movieId);
        } else {
          data = await api.getMovieDetail(movieId);
        }
        if (isMounted) {
          setDetail(data || (movie as MovieDetail));
        }
      } catch (err) {
        console.error('Failed to fetch details', err);
        if (isMounted) setDetail(movie as MovieDetail);
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [movieId, isTv]);

  // Load Pretrained AI recommendations for this movie
  useEffect(() => {
    let isMounted = true;
    async function fetchAiRecs() {
      const titleToQuery = movie.title || movie.name || '';
      if (!titleToQuery) return;
      setAiLoading(true);
      try {
        const recs = await api.recommendByMovie(titleToQuery, 10);
        if (isMounted) setAiRecs(recs);
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setAiLoading(false);
      }
    }
    fetchAiRecs();
    return () => { isMounted = false; };
  }, [movie]);

  const [backdropError, setBackdropError] = useState(false);

  useEffect(() => {
    setBackdropError(false);
  }, [movie]);

  const handleWatchlist = () => {
    const added = watchlistService.toggleWatchlist(detail || movie);
    setInWatchlist(added);
  };

  const title = detail?.title || detail?.name || movie.title || movie.name || 'Untitled';
  const backdropUrl = !backdropError
    ? getTmdbImageUrl(detail?.backdrop_path || movie.backdrop_path, 'original')
    : null;

  const releaseDate = detail?.release_date || detail?.first_air_date || movie.release_date || movie.first_air_date || '';
  const releaseYear = releaseDate.substring(0, 4);
  const rating = (detail?.vote_average || movie.vote_average) ? Number(detail?.vote_average || movie.vote_average).toFixed(1) : null;
  const runtime = detail?.runtime ? `${Math.floor(detail.runtime / 60)}h ${detail.runtime % 60}m` : null;

  const cast = detail?.credits?.cast?.slice(0, 10) || [];
  const director = detail?.credits?.crew?.find((c) => c.job === 'Director')?.name;

  return (
    <div className="min-h-screen bg-[#0B0D17] pb-24">
      {/* Top Back Navigation Bar */}
      <div className="fixed top-18 left-4 sm:left-8 z-30">
        <button
          onClick={onBack}
          aria-label="Back to previous screen"
          className="p-2.5 rounded-full bg-[#121525]/80 hover:bg-violet-600 border border-white/10 text-white backdrop-blur-md transition-all shadow-lg shadow-black/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop Banner */}
      <div className="relative w-full h-[55vh] min-h-[400px] max-h-[600px] overflow-hidden bg-[#121525]">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={`${title} backdrop`}
            onError={() => setBackdropError(true)}
            className="w-full h-full object-cover object-top filter brightness-90 animate-fadeIn"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-[#191D30] via-[#121525] to-[#0B0D17]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D17] via-[#0B0D17]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0D17] via-[#0B0D17]/50 to-transparent max-w-3xl" />
      </div>

      {/* Main Content Info Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 -mt-36 sm:-mt-48 z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster Card */}
          <div className="w-48 sm:w-60 md:w-72 flex-none rounded-2xl overflow-hidden shadow-2xl shadow-violet-950/40 border border-white/10 bg-[#191D30]">
            <PosterImage path={detail?.poster_path || movie.poster_path} title={title} size="w500" />
          </div>

          {/* Details Column */}
          <div className="flex-1 pt-2">
            {/* Tagline */}
            {detail?.tagline && (
              <p className="text-cyan-300 font-mono text-xs sm:text-sm tracking-wide uppercase mb-2">
                "{detail.tagline}"
              </p>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              {title}
            </h1>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-300 mb-6">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-semibold bg-black/60 border border-white/10 uppercase">
                {isTv ? <Tv className="w-3.5 h-3.5 text-cyan-400" /> : <Film className="w-3.5 h-3.5 text-violet-400" />}
                {isTv ? 'TV Series' : 'Movie'}
              </span>

              {rating && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {rating} / 10
                </span>
              )}

              {releaseYear && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {releaseDate}
                </span>
              )}

              {runtime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  {runtime}
                </span>
              )}

              {director && (
                <span className="text-gray-400">
                  Directed by <strong className="text-gray-200">{director}</strong>
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.isArray(detail?.genres)
                ? detail.genres.map((g: any, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#191D30] text-gray-200 border border-white/5"
                    >
                      {typeof g === 'string' ? g : g.name}
                    </span>
                  ))
                : typeof movie.genres === 'string'
                ? movie.genres.split(' ').map((g, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-[#191D30] text-gray-200 border border-white/5"
                    >
                      {g}
                    </span>
                  ))
                : null}
            </div>

            {/* Actions: Watch Trailer / Watchlist */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => onPlayTrailer(detail || movie)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-xl shadow-violet-900/40 hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Trailer
              </button>

              <button
                onClick={handleWatchlist}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl border text-sm font-semibold transition-all backdrop-blur-md ${
                  inWatchlist
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-[#191D30] border-white/10 text-gray-200 hover:bg-[#222742]'
                }`}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inWatchlist ? 'In My List' : 'Add to My List'}
              </button>
            </div>

            {/* Overview */}
            <div className="mb-8">
              <h3 className="text-base font-bold text-white mb-2">Synopsis</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
                {detail?.overview || movie.overview || 'No synopsis available for this title.'}
              </p>
            </div>

            {/* Top Cast */}
            {cast.length > 0 && (
              <div className="mb-10">
                <h3 className="text-base font-bold text-white mb-4">Top Billed Cast</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                  {cast.map((actor) => (
                    <div key={actor.id} className="flex-none w-24 text-center">
                      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-[#191D30] border border-white/10 mb-2">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-200 line-clamp-1">{actor.name}</p>
                      {actor.character && (
                        <p className="text-[10px] text-gray-400 line-clamp-1">{actor.character}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Recommendations Section */}
        {aiRecs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <MovieRow
              title="CineNOVA AI Recommends Based on This Title"
              subtitle={`Pretrained TF-IDF Cosine-Similarity Analysis for ${title}`}
              movies={aiRecs}
              isLoading={aiLoading}
              onSelectMovie={onSelectMovie}
              isAiRow={true}
            />
          </div>
        )}

        {/* TMDB Similar Movies */}
        {detail?.similar?.results && detail.similar.results.length > 0 && (
          <div className="mt-6">
            <MovieRow
              title="More Like This (TMDB Catalog)"
              movies={detail.similar.results}
              onSelectMovie={onSelectMovie}
            />
          </div>
        )}
      </div>
    </div>
  );
};
