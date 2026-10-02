import logging
from typing import Dict, Any, List
import pandas as pd

logger = logging.getLogger("cinenova.fallback")

class FallbackCatalog:
    _instance = None

    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()
        # Clean numeric columns for safe sorting and filtering
        self.df["popularity_num"] = pd.to_numeric(self.df["popularity"], errors="coerce").fillna(0.0)
        self.df["vote_average_num"] = pd.to_numeric(self.df["vote_average"], errors="coerce").fillna(0.0)

    @classmethod
    def get_instance(cls, df: pd.DataFrame = None) -> "FallbackCatalog":
        if cls._instance is None and df is not None:
            cls._instance = cls(df)
        return cls._instance

    def _format_row(self, row: pd.Series, idx: int) -> Dict[str, Any]:
        return {
            "id": int(idx),
            "tmdb_id": int(idx),
            "title": str(row.get("title", "")),
            "name": str(row.get("title", "")),
            "overview": str(row.get("overview", "")),
            "genres": str(row.get("genres", "")),
            "vote_average": float(row.get("vote_average_num", 0.0)),
            "vote_count": 500,
            "popularity": float(row.get("popularity_num", 0.0)),
            "release_date": "2015-01-01",
            "poster_path": None,
            "backdrop_path": None,
            "media_type": "movie"
        }

    def get_category_movies(self, genre_keyword: str = "", limit: int = 20, min_rating: float = 6.0) -> List[Dict[str, Any]]:
        if self.df is None or len(self.df) == 0:
            return []

        subset = self.df
        if genre_keyword:
            mask = subset["genres"].str.contains(genre_keyword, case=False, na=False)
            filtered = subset[mask]
            if len(filtered) > 0:
                subset = filtered

        # Filter by vote_average_num
        voted = subset[subset["vote_average_num"] >= min_rating]
        if len(voted) >= limit:
            subset = voted

        # Sort by popularity_num descending
        sorted_df = subset.sort_values(by="popularity_num", ascending=False).head(limit)
        results = []
        for idx, row in sorted_df.iterrows():
            results.append(self._format_row(row, idx))
        return results
