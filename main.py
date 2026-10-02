import os
import sys
import logging
from typing import List, Optional
from fastapi import FastAPI, Query, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv, set_key

# Load environment
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(env_path)

from backend.model_engine import RecommendationEngine
from backend.tmdb_client import TMDBClient
from backend.fallback_catalog import FallbackCatalog

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("cinenova.app")

app = FastAPI(
    title="CineNOVA API",
    description="CineNOVA AI-Powered Movie Discovery & Recommendation Backend",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
model_engine = RecommendationEngine.get_instance()
tmdb_client = TMDBClient.get_instance()
fallback_catalog = FallbackCatalog.get_instance(model_engine.df) if model_engine.df is not None else None


class PersonalizedRequest(BaseModel):
    titles: List[str]
    top_n: int = 12


class KeyUpdateRequest(BaseModel):
    api_key: str


# -------------------------------------------------------------
# System & Configuration Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "product": "CineNOVA",
        "tagline": "Discover Beyond the Screen",
        "model_loaded": model_engine.is_loaded,
        "total_model_movies": len(model_engine.df) if model_engine.df is not None else 0,
        "tmdb_configured": tmdb_client.has_api_key()
    }


@app.get("/api/diagnostics/tmdb")
async def tmdb_diagnostics():
    diag = tmdb_client.get_diagnostics()
    sample_call_ok = False
    sample_poster = None
    sample_backdrop = None
    if tmdb_client.has_api_key():
        trending = await tmdb_client.get_trending("movie", "day", 1)
        results = trending.get("results", [])
        if results:
            sample_call_ok = True
            sample_poster = results[0].get("poster_path")
            sample_backdrop = results[0].get("backdrop_path")
    return {
        **diag,
        "live_api_call_ok": sample_call_ok,
        "sample_poster_path": sample_poster,
        "sample_backdrop_path": sample_backdrop,
        "sample_poster_url": f"https://image.tmdb.org/t/p/w500{sample_poster}" if sample_poster else None,
        "sample_backdrop_url": f"https://image.tmdb.org/t/p/original{sample_backdrop}" if sample_backdrop else None
    }


@app.post("/api/config/tmdb-key")
def update_tmdb_key(req: KeyUpdateRequest):
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    tmdb_client.set_api_key(key)
    try:
        set_key(env_path, "TMDB_API_KEY", key)
    except Exception as e:
        logger.warning("Could not persist key to .env: %s", e)
    return {"message": "TMDB API key successfully updated", "configured": True}


# -------------------------------------------------------------
# Pretrained Model Recommendation Endpoints
# -------------------------------------------------------------
@app.get("/api/model/search")
def search_model_titles(query: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)):
    """Search titles directly inside the 45,447 pretrained dataset for instant autocomplete"""
    results = model_engine.search_titles(query, limit=limit)
    return {"results": results, "count": len(results)}


@app.get("/api/recommend/movie")
async def recommend_by_movie(title: str = Query(..., min_length=1), top_n: int = Query(12, ge=1, le=30)):
    """Core AI Recommendation: Computes cosine similarity via linear_kernel on pretrained tfidf_matrix"""
    if not model_engine.is_loaded:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded")

    raw_recs = model_engine.recommend_by_movie(title, top_n=top_n)
    if not raw_recs:
        # If no direct match, attempt query tags
        raw_recs = model_engine.recommend_by_tags(title, top_n=top_n)

    if not raw_recs:
        return {"query": title, "recommendations": [], "count": 0, "message": "No recommendations found for this title"}

    # Enrich recommendations with TMDB images/ids if TMDB is configured
    enriched_recs = await tmdb_client.enrich_recommendations(raw_recs)
    return {
        "query": title,
        "source": "pretrained_tfidf_cosine_similarity",
        "recommendations": enriched_recs,
        "count": len(enriched_recs)
    }


@app.get("/api/recommend/tags")
async def recommend_by_tags(query: str = Query(..., min_length=1), top_n: int = Query(12, ge=1, le=30)):
    """AI Recommendation by Mood, Genres, or Prompt themes via TF-IDF vectorization"""
    if not model_engine.is_loaded:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded")

    raw_recs = model_engine.recommend_by_tags(query, top_n=top_n)
    enriched_recs = await tmdb_client.enrich_recommendations(raw_recs)
    return {
        "query": query,
        "source": "pretrained_tfidf_vector_query",
        "recommendations": enriched_recs,
        "count": len(enriched_recs)
    }


@app.post("/api/recommend/personalized")
async def recommend_personalized(req: PersonalizedRequest):
    """AI Personalized Recommendation from User Watchlist / Favorites: composite user taste profile vector"""
    if not model_engine.is_loaded:
        raise HTTPException(status_code=503, detail="Recommendation model not loaded")

    raw_recs = model_engine.recommend_personalized_from_watchlist(req.titles, top_n=req.top_n)
    enriched_recs = await tmdb_client.enrich_recommendations(raw_recs)
    return {
        "watchlist_titles": req.titles,
        "source": "composite_user_taste_vector",
        "recommendations": enriched_recs,
        "count": len(enriched_recs)
    }


# -------------------------------------------------------------
# TMDB Proxy Endpoints (with Graceful Fallbacks)
# -------------------------------------------------------------
@app.get("/api/tmdb/trending")
async def get_trending(media_type: str = "all", time_window: str = "day", page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_trending(media_type, time_window, page)
        if res.get("results"):
            return res
    # Fallback
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("", limit=20, min_rating=7.0)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/popular-movies")
async def get_popular_movies(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_popular_movies(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("", limit=20, min_rating=6.5)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/popular-tv")
async def get_popular_tv(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_popular_tv(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("Drama", limit=20, min_rating=7.0)
        for it in items:
            it["media_type"] = "tv"
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/top-rated")
async def get_top_rated(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_top_rated_movies(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("", limit=20, min_rating=8.0)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/upcoming")
async def get_upcoming(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_upcoming_movies(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("Action", limit=20, min_rating=6.0)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/bollywood")
async def get_bollywood(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_bollywood_hits(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("Drama", limit=20, min_rating=6.8)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/korean-dramas")
async def get_korean_dramas(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_korean_dramas(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("Romance", limit=20, min_rating=7.2)
        for it in items:
            it["media_type"] = "tv"
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/korean-movies")
async def get_korean_movies(page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_korean_movies(page)
        if res.get("results"):
            return res
    if fallback_catalog:
        items = fallback_catalog.get_category_movies("Thriller", limit=20, min_rating=7.0)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/discover")
async def discover_titles(
    media_type: str = "movie",
    genre_id: Optional[int] = None,
    genre_name: Optional[str] = None,
    year: Optional[int] = None,
    sort_by: str = "popularity.desc",
    min_rating: Optional[float] = None,
    language: Optional[str] = None,
    page: int = 1
):
    if tmdb_client.has_api_key():
        res = await tmdb_client.discover(
            media_type=media_type,
            page=page,
            genre_id=genre_id,
            year=year,
            sort_by=sort_by,
            min_rating=min_rating,
            language=language
        )
        if res.get("results"):
            return res

    if fallback_catalog:
        g = genre_name or ""
        items = fallback_catalog.get_category_movies(g, limit=20, min_rating=min_rating or 6.0)
        return {"results": items, "page": page, "total_pages": 1, "is_fallback": True}
    return {"results": []}


@app.get("/api/tmdb/search")
async def search_titles(query: str = Query(..., min_length=1), media_type: str = "multi", page: int = 1):
    if tmdb_client.has_api_key():
        res = await tmdb_client.search(query, media_type=media_type, page=page)
        if res.get("results"):
            return res

    # Fallback to model titles search
    model_matches = model_engine.search_titles(query, limit=20)
    formatted = []
    for m in model_matches:
        formatted.append({
            "id": m["index"],
            "title": m["title"],
            "name": m["title"],
            "overview": m["overview"],
            "vote_average": m["vote_average"],
            "genres": m["genres"],
            "media_type": "movie",
            "poster_path": None,
            "backdrop_path": None
        })
    return {"results": formatted, "page": page, "total_pages": 1, "is_fallback": True}


@app.get("/api/tmdb/movie/{movie_id}")
async def get_movie_detail(movie_id: int):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_movie_details(movie_id)
        if res:
            return res

    # Fallback from df if movie_id is within range
    if model_engine.is_loaded and 0 <= movie_id < len(model_engine.df):
        row = model_engine.df.iloc[movie_id]
        return {
            "id": movie_id,
            "title": str(row.get("title", "")),
            "overview": str(row.get("overview", "")),
            "tagline": str(row.get("tagline", "")),
            "vote_average": float(row.get("vote_average", 0.0) or 0.0),
            "vote_count": 500,
            "genres": [{"name": g} for g in str(row.get("genres", "")).split()],
            "release_date": "2015-01-01",
            "runtime": 120,
            "credits": {"cast": [], "crew": []},
            "videos": {"results": []},
            "similar": {"results": []},
            "is_fallback": True
        }

    raise HTTPException(status_code=404, detail="Movie not found")


@app.get("/api/tmdb/tv/{tv_id}")
async def get_tv_detail(tv_id: int):
    if tmdb_client.has_api_key():
        res = await tmdb_client.get_tv_details(tv_id)
        if res:
            return res
    raise HTTPException(status_code=404, detail="TV Series not found")


# -------------------------------------------------------------
# Static SPA Frontend Serving (Production Mode)
# -------------------------------------------------------------
frontend_dist = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))