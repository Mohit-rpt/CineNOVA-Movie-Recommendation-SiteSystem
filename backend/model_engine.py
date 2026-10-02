import os
import pickle
import time
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.metrics.pairwise import linear_kernel

logger = logging.getLogger("cinenova.model")
logging.basicConfig(level=logging.INFO)

class RecommendationEngine:
    _instance: Optional["RecommendationEngine"] = None

    def __init__(self, base_dir: Optional[str] = None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.base_dir = base_dir
        self.df = None
        self.indices = None
        self.tfidf = None
        self.tfidf_matrix = None
        self.title_lower_map = {}
        self.all_titles = []
        self.is_loaded = False
        self._load_artifacts()

    @classmethod
    def get_instance(cls, base_dir: Optional[str] = None) -> "RecommendationEngine":
        if cls._instance is None:
            cls._instance = cls(base_dir)
        return cls._instance

    def _load_artifacts(self):
        t0 = time.time()
        logger.info("Loading CineNOVA pretrained recommendation artifacts...")
        
        df_path = os.path.join(self.base_dir, "df.pkl")
        indices_path = os.path.join(self.base_dir, "indices.pkl")
        tfidf_path = os.path.join(self.base_dir, "tfidf.pkl")
        matrix_path = os.path.join(self.base_dir, "tfidf_matrix.pkl")

        if not all(os.path.exists(p) for p in [df_path, indices_path, tfidf_path, matrix_path]):
            logger.error("One or more model pickle files missing in %s", self.base_dir)
            return

        try:
            with open(df_path, "rb") as f:
                self.df = pickle.load(f)
            with open(indices_path, "rb") as f:
                self.indices = pickle.load(f)
            with open(tfidf_path, "rb") as f:
                self.tfidf = pickle.load(f)
            with open(matrix_path, "rb") as f:
                self.tfidf_matrix = pickle.load(f)

            # Build case-insensitive lookup
            self.title_lower_map = {}
            for title in self.df["title"].dropna().unique():
                t_str = str(title).strip()
                self.title_lower_map[t_str.lower()] = t_str
            self.all_titles = list(self.title_lower_map.values())

            self.is_loaded = True
            logger.info("Successfully loaded model in %.2fs. Total movies: %d", time.time() - t0, len(self.df))
        except Exception as e:
            logger.exception("Failed to load model artifacts: %s", e)

    def _resolve_index(self, title: str) -> Optional[int]:
        if not self.is_loaded or not title:
            return None
        title = title.strip()
        # Direct lookup
        if title in self.indices:
            idx = self.indices[title]
            if hasattr(idx, "__iter__") and not isinstance(idx, (int, float)):
                return int(idx.iloc[0] if hasattr(idx, "iloc") else list(idx)[0])
            return int(idx)
        
        # Case-insensitive lookup
        lower = title.lower()
        if lower in self.title_lower_map:
            actual_title = self.title_lower_map[lower]
            idx = self.indices[actual_title]
            if hasattr(idx, "__iter__") and not isinstance(idx, (int, float)):
                return int(idx.iloc[0] if hasattr(idx, "iloc") else list(idx)[0])
            return int(idx)

        # Substring search
        for t_lower, actual_title in self.title_lower_map.items():
            if lower in t_lower or t_lower in lower:
                idx = self.indices[actual_title]
                if hasattr(idx, "__iter__") and not isinstance(idx, (int, float)):
                    return int(idx.iloc[0] if hasattr(idx, "iloc") else list(idx)[0])
                return int(idx)

        return None

    def search_titles(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.is_loaded or not query:
            return []
        q = query.strip().lower()
        results = []
        # Exact prefix first, then substring
        exact_prefix = []
        substrings = []
        for t in self.all_titles:
            t_lower = t.lower()
            if t_lower.startswith(q):
                exact_prefix.append(t)
            elif q in t_lower:
                substrings.append(t)
            if len(exact_prefix) >= limit:
                break

        ordered = (exact_prefix + substrings)[:limit]
        for title in ordered:
            idx = self._resolve_index(title)
            if idx is not None and idx < len(self.df):
                row = self.df.iloc[idx]
                results.append({
                    "title": str(row.get("title", "")),
                    "genres": str(row.get("genres", "")),
                    "vote_average": float(row.get("vote_average", 0.0) or 0.0),
                    "popularity": float(row.get("popularity", 0.0) or 0.0),
                    "overview": str(row.get("overview", "")),
                    "index": idx
                })
        return results

    def recommend_by_movie(self, title: str, top_n: int = 12) -> List[Dict[str, Any]]:
        if not self.is_loaded:
            return []
        idx = self._resolve_index(title)
        if idx is None:
            return []

        source_movie = self.df.iloc[idx]
        source_genres = set(str(source_movie.get("genres", "")).split())

        # Cosine similarity via linear_kernel on tfidf_matrix
        sim_scores = linear_kernel(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        # Sort indices in descending similarity
        ranked_indices = sim_scores.argsort()[::-1]

        recommendations = []
        seen_titles = {str(source_movie.get("title", "")).lower()}

        for i in ranked_indices:
            if i == idx:
                continue
            rec_row = self.df.iloc[i]
            rec_title = str(rec_row.get("title", "")).strip()
            if not rec_title or rec_title.lower() in seen_titles:
                continue
            seen_titles.add(rec_title.lower())

            score = float(sim_scores[i])
            if score <= 0.01:
                break

            # Truthful match explanation
            rec_genres = set(str(rec_row.get("genres", "")).split())
            common_genres = list(source_genres.intersection(rec_genres))
            explanation_parts = []
            if common_genres:
                explanation_parts.append(f"Shares genre: {', '.join(common_genres[:2])}")
            explanation_parts.append(f"{round(score * 100)}% thematic correlation")
            explanation = " • ".join(explanation_parts)

            recommendations.append({
                "model_index": int(i),
                "title": rec_title,
                "genres": str(rec_row.get("genres", "")),
                "vote_average": float(rec_row.get("vote_average", 0.0) or 0.0),
                "popularity": float(rec_row.get("popularity", 0.0) or 0.0),
                "overview": str(rec_row.get("overview", "")),
                "similarity_score": round(score, 4),
                "match_percentage": min(99, max(50, int(score * 100 + 40))),
                "ai_explanation": explanation,
                "is_ai_pick": True
            })

            if len(recommendations) >= top_n:
                break

        return recommendations

    def recommend_by_tags(self, query: str, top_n: int = 12) -> List[Dict[str, Any]]:
        if not self.is_loaded or not query:
            return []

        try:
            vec = self.tfidf.transform([query])
            sim_scores = linear_kernel(vec, self.tfidf_matrix).flatten()
            ranked_indices = sim_scores.argsort()[::-1]

            recommendations = []
            seen_titles = set()

            for i in ranked_indices:
                score = float(sim_scores[i])
                if score <= 0.01:
                    break
                rec_row = self.df.iloc[i]
                rec_title = str(rec_row.get("title", "")).strip()
                if not rec_title or rec_title.lower() in seen_titles:
                    continue
                seen_titles.add(rec_title.lower())

                recommendations.append({
                    "model_index": int(i),
                    "title": rec_title,
                    "genres": str(rec_row.get("genres", "")),
                    "vote_average": float(rec_row.get("vote_average", 0.0) or 0.0),
                    "popularity": float(rec_row.get("popularity", 0.0) or 0.0),
                    "overview": str(rec_row.get("overview", "")),
                    "similarity_score": round(score, 4),
                    "match_percentage": min(99, max(50, int(score * 100 + 45))),
                    "ai_explanation": f"Matched themes: {query[:40]}",
                    "is_ai_pick": True
                })

                if len(recommendations) >= top_n:
                    break

            return recommendations
        except Exception as e:
            logger.error("Error in recommend_by_tags: %s", e)
            return []

    def recommend_personalized_from_watchlist(self, titles: List[str], top_n: int = 12) -> List[Dict[str, Any]]:
        if not self.is_loaded or not titles:
            return []

        indices = []
        for t in titles:
            idx = self._resolve_index(t)
            if idx is not None:
                indices.append(idx)

        if not indices:
            return []

        # Average sparse vectors of the user's liked movies
        user_vectors = self.tfidf_matrix[indices]
        mean_vector = user_vectors.mean(axis=0)
        # Convert to numpy matrix for linear_kernel
        mean_vector = np.asarray(mean_vector)

        sim_scores = linear_kernel(mean_vector, self.tfidf_matrix).flatten()
        ranked_indices = sim_scores.argsort()[::-1]

        recommendations = []
        seen_titles = {str(self.df.iloc[idx]["title"]).lower() for idx in indices}

        for i in ranked_indices:
            if i in indices:
                continue
            rec_row = self.df.iloc[i]
            rec_title = str(rec_row.get("title", "")).strip()
            if not rec_title or rec_title.lower() in seen_titles:
                continue
            seen_titles.add(rec_title.lower())

            score = float(sim_scores[i])
            if score <= 0.01:
                break

            recommendations.append({
                "model_index": int(i),
                "title": rec_title,
                "genres": str(rec_row.get("genres", "")),
                "vote_average": float(rec_row.get("vote_average", 0.0) or 0.0),
                "popularity": float(rec_row.get("popularity", 0.0) or 0.0),
                "overview": str(rec_row.get("overview", "")),
                "similarity_score": round(score, 4),
                "match_percentage": min(99, max(55, int(score * 100 + 45))),
                "ai_explanation": f"Personalized composite match from {len(indices)} saved titles",
                "is_ai_pick": True
            })

            if len(recommendations) >= top_n:
                break

        return recommendations
