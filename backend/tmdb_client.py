import os
import time
import socket
import logging
import asyncio
import urllib.request
import json
from typing import Dict, Any, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("cinenova.tmdb")

# ---------------------------------------------------------------------
# Resilient DNS Resolver for TMDB
# In certain regions (e.g. India / Reliance Jio), local ISP DNS poisons
# api.themoviedb.org to a dead IP (49.44.79.236), causing TCP timeouts.
# We resolve api.themoviedb.org via Google DoH / Cloudflare DoH,
# with a fallback list of verified CloudFront Anycast IPs.
# ---------------------------------------------------------------------
FALLBACK_CLOUDFRONT_IPS = [
    "99.84.152.85",
    "99.84.152.32",
    "99.84.152.53",
    "99.84.152.8",
    "3.175.86.37",
    "3.175.86.50",
    "3.175.86.67",
    "3.175.86.103"
]

_active_tmdb_ips = list(FALLBACK_CLOUDFRONT_IPS)
_doh_resolved = False

def _resolve_tmdb_ips():
    global _active_tmdb_ips, _doh_resolved
    if _doh_resolved:
        return _active_tmdb_ips
    
    # Try Google DoH
    try:
        req = urllib.request.Request(
            "https://dns.google/resolve?name=api.themoviedb.org&type=A",
            headers={"User-Agent": "CineNOVA/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode())
            answers = [ans["data"] for ans in data.get("Answer", []) if ans.get("type") == 1]
            if answers:
                _active_tmdb_ips = answers
                _doh_resolved = True
                logger.info("Successfully resolved api.themoviedb.org via Google DoH: %s", _active_tmdb_ips[:2])
                return _active_tmdb_ips
    except Exception as e:
        logger.debug("Google DoH resolution failed: %s", e)

    # Try Cloudflare DoH
    try:
        req = urllib.request.Request(
            "https://cloudflare-dns.com/dns-query?name=api.themoviedb.org&type=A",
            headers={"Accept": "application/dns-json", "User-Agent": "CineNOVA/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode())
            answers = [ans["data"] for ans in data.get("Answer", []) if ans.get("type") == 1]
            if answers:
                _active_tmdb_ips = answers
                _doh_resolved = True
                logger.info("Successfully resolved api.themoviedb.org via Cloudflare DoH: %s", _active_tmdb_ips[:2])
                return _active_tmdb_ips
    except Exception as e:
        logger.debug("Cloudflare DoH resolution failed: %s", e)

    logger.info("Using verified CloudFront Anycast IPs for api.themoviedb.org")
    _doh_resolved = True
    return _active_tmdb_ips

# Initialize DNS resolution
_resolve_tmdb_ips()

# Monkeypatch socket.getaddrinfo specifically for api.themoviedb.org to enforce valid IPv4 Anycast IPs
_orig_getaddrinfo = socket.getaddrinfo

def _custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if host == "api.themoviedb.org":
        target_ip = _active_tmdb_ips[0] if _active_tmdb_ips else FALLBACK_CLOUDFRONT_IPS[0]
        # Force AF_INET so IPv6 timeout never blocks the connection
        return _orig_getaddrinfo(target_ip, port, socket.AF_INET, type, proto, flags)
    return _orig_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = _custom_getaddrinfo

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

class TMDBClient:
    _instance: Optional["TMDBClient"] = None

    def __init__(self):
        self.api_key = os.getenv("TMDB_API_KEY", "").strip()
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 600  # 10 minutes cache
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "CineNOVA/1.0"})
        self.last_status: Optional[int] = None
        self.last_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "TMDBClient":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def set_api_key(self, key: str):
        self.api_key = key.strip()

    def has_api_key(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5 and self.api_key != "your_tmdb_api_key_here")

    def _get_cache(self, key: str) -> Optional[Any]:
        if key in self.cache:
            item = self.cache[key]
            if time.time() - item["timestamp"] < self.cache_ttl:
                return item["data"]
            del self.cache[key]
        return None

    def _set_cache(self, key: str, data: Any):
        self.cache[key] = {
            "timestamp": time.time(),
            "data": data
        }

    def _sync_request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        if not self.has_api_key():
            self.last_error = "TMDB API key is not configured"
            return None

        if params is None:
            params = {}
        params["api_key"] = self.api_key

        cache_key = f"{endpoint}:{sorted(params.items())}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        try:
            url = f"{TMDB_BASE_URL}{endpoint}"
            response = self.session.get(url, params=params, timeout=8.0)
            self.last_status = response.status_code
            if response.status_code == 200:
                data = response.json()
                self._set_cache(cache_key, data)
                self.last_error = None
                return data
            else:
                masked_endpoint = endpoint
                self.last_error = f"TMDB returned HTTP {response.status_code}"
                logger.warning("TMDB API error %d for %s (body: %s)", response.status_code, masked_endpoint, response.text[:150])
                return None
        except Exception as e:
            self.last_error = f"Connection error: {type(e).__name__}"
            logger.error("TMDB request exception for %s: %s", endpoint, e)
            return None

    async def _request(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        return await asyncio.to_thread(self._sync_request, endpoint, params)

    async def get_trending(self, media_type: str = "all", time_window: str = "day", page: int = 1) -> Dict[str, Any]:
        res = await self._request(f"/trending/{media_type}/{time_window}", {"page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_popular_movies(self, page: int = 1) -> Dict[str, Any]:
        res = await self._request("/movie/popular", {"page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_popular_tv(self, page: int = 1) -> Dict[str, Any]:
        res = await self._request("/tv/popular", {"page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_top_rated_movies(self, page: int = 1) -> Dict[str, Any]:
        res = await self._request("/movie/top_rated", {"page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_upcoming_movies(self, page: int = 1) -> Dict[str, Any]:
        res = await self._request("/movie/upcoming", {"page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_bollywood_hits(self, page: int = 1) -> Dict[str, Any]:
        params = {
            "page": page,
            "with_original_language": "hi",
            "region": "IN",
            "sort_by": "popularity.desc",
            "vote_count.gte": 15
        }
        res = await self._request("/discover/movie", params)
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_korean_dramas(self, page: int = 1) -> Dict[str, Any]:
        params = {
            "page": page,
            "with_original_language": "ko",
            "sort_by": "popularity.desc",
            "vote_count.gte": 10
        }
        res = await self._request("/discover/tv", params)
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_korean_movies(self, page: int = 1) -> Dict[str, Any]:
        params = {
            "page": page,
            "with_original_language": "ko",
            "sort_by": "popularity.desc",
            "vote_count.gte": 20
        }
        res = await self._request("/discover/movie", params)
        return res or {"results": [], "page": page, "total_pages": 1}

    async def discover(self, media_type: str = "movie", page: int = 1, genre_id: Optional[int] = None,
                       year: Optional[int] = None, sort_by: str = "popularity.desc",
                       min_rating: Optional[float] = None, language: Optional[str] = None) -> Dict[str, Any]:
        endpoint = f"/discover/{media_type}"
        params: Dict[str, Any] = {
            "page": page,
            "sort_by": sort_by
        }
        if genre_id:
            params["with_genres"] = genre_id
        if year:
            if media_type == "movie":
                params["primary_release_year"] = year
            else:
                params["first_air_date_year"] = year
        if min_rating:
            params["vote_average.gte"] = min_rating
            params["vote_count.gte"] = 15
        if language:
            params["with_original_language"] = language

        res = await self._request(endpoint, params)
        return res or {"results": [], "page": page, "total_pages": 1}

    async def search(self, query: str, media_type: str = "multi", page: int = 1) -> Dict[str, Any]:
        endpoint = f"/search/{media_type}"
        res = await self._request(endpoint, {"query": query, "page": page})
        return res or {"results": [], "page": page, "total_pages": 1}

    async def get_movie_details(self, movie_id: int) -> Optional[Dict[str, Any]]:
        return await self._request(f"/movie/{movie_id}", {"append_to_response": "credits,videos,similar,recommendations"})

    async def get_tv_details(self, tv_id: int) -> Optional[Dict[str, Any]]:
        return await self._request(f"/tv/{tv_id}", {"append_to_response": "credits,videos,similar,recommendations"})

    async def search_movie_by_title(self, title: str) -> Optional[Dict[str, Any]]:
        cache_key = f"title_lookup:{title.lower()}"
        cached = self._get_cache(cache_key)
        if cached is not None:
            return cached

        res = await self._request("/search/movie", {"query": title, "page": 1})
        if res and res.get("results"):
            top = res["results"][0]
            self._set_cache(cache_key, top)
            return top
        return None

    async def enrich_recommendations(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Takes recommendation objects from the pretrained model and enriches them with TMDB artwork and IDs"""
        if not recommendations:
            return []

        async def _enrich_single(rec: Dict[str, Any]) -> Dict[str, Any]:
            title = rec.get("title", "")
            if not title:
                return rec

            enriched = dict(rec)
            tmdb_data = await self.search_movie_by_title(title)
            if tmdb_data:
                enriched["tmdb_id"] = tmdb_data.get("id")
                enriched["media_type"] = "movie"
                if tmdb_data.get("poster_path"):
                    enriched["poster_path"] = tmdb_data.get("poster_path")
                if tmdb_data.get("backdrop_path"):
                    enriched["backdrop_path"] = tmdb_data.get("backdrop_path")
                if tmdb_data.get("vote_average"):
                    enriched["tmdb_vote_average"] = tmdb_data.get("vote_average")
                if tmdb_data.get("release_date"):
                    enriched["release_date"] = tmdb_data.get("release_date")
                if tmdb_data.get("overview") and len(tmdb_data.get("overview")) > len(enriched.get("overview", "")):
                    enriched["overview"] = tmdb_data.get("overview")
            return enriched

        # Concurrently enrich up to 15 titles safely
        enriched_results = await asyncio.gather(*[_enrich_single(r) for r in recommendations[:15]])
        return list(enriched_results)

    def get_diagnostics(self) -> Dict[str, Any]:
        return {
            "api_key_configured": self.has_api_key(),
            "key_length": len(self.api_key) if self.api_key else 0,
            "dns_resolved_ips": _active_tmdb_ips[:3],
            "last_http_status": self.last_status,
            "last_error": self.last_error,
            "cache_entries": len(self.cache)
        }
