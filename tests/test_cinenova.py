import os
import unittest
from fastapi.testclient import TestClient
import main

class CineNovaTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(main.app)

    def test_01_health_check(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["product"], "CineNOVA")
        self.assertTrue(data["model_loaded"])
        self.assertGreater(data["total_model_movies"], 40000)

    def test_02_model_title_search(self):
        res = self.client.get("/api/model/search?query=toy story&limit=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["count"], 0)
        titles = [m["title"].lower() for m in data["results"]]
        self.assertTrue(any("toy story" in t for t in titles))

    def test_03_recommend_by_movie(self):
        res = self.client.get("/api/recommend/movie?title=Toy Story&top_n=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["count"], 5)
        recs = data["recommendations"]
        self.assertGreater(len(recs), 0)
        # Toy Story 2 or 3 should be in top recommendations
        rec_titles = [r["title"] for r in recs]
        self.assertTrue("Toy Story 2" in rec_titles or "Toy Story 3" in rec_titles)
        self.assertTrue(all(r["similarity_score"] > 0 for r in recs))
        self.assertTrue(all("ai_explanation" in r for r in recs))
        # Ensure TMDB artwork is enriched
        self.assertTrue(any(r.get("poster_path") for r in recs))

    def test_04_recommend_by_tags(self):
        res = self.client.get("/api/recommend/tags?query=superhero comic save world&top_n=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["count"], 5)
        self.assertTrue(all(r["similarity_score"] > 0 for r in data["recommendations"]))

    def test_05_recommend_personalized_watchlist(self):
        payload = {
            "titles": ["The Dark Knight", "Inception"],
            "top_n": 5
        }
        res = self.client.post("/api/recommend/personalized", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["count"], 5)
        recs = data["recommendations"]
        # Seed titles should not be recommended to themselves
        rec_titles = [r["title"] for r in recs]
        self.assertNotIn("The Dark Knight", rec_titles)
        self.assertNotIn("Inception", rec_titles)

    def test_06_tmdb_trending_with_images(self):
        res = self.client.get("/api/tmdb/trending")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)
        # Check poster and backdrop paths exist and are valid relative format
        first = data["results"][0]
        self.assertIsNotNone(first.get("poster_path"))
        self.assertTrue(first["poster_path"].startswith("/"))

    def test_07_tmdb_bollywood(self):
        res = self.client.get("/api/tmdb/bollywood")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)
        first = data["results"][0]
        self.assertIsNotNone(first.get("poster_path"))

    def test_08_tmdb_korean_dramas(self):
        res = self.client.get("/api/tmdb/korean-dramas")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("results", data)
        self.assertGreater(len(data["results"]), 0)

    def test_09_static_frontend_served(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("CineNOVA", res.text)
        self.assertIn("/assets/", res.text)

    def test_10_tmdb_diagnostics(self):
        res = self.client.get("/api/diagnostics/tmdb")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("api_key_configured"))
        self.assertTrue(data.get("live_api_call_ok"))
        self.assertIsNotNone(data.get("sample_poster_path"))
        self.assertIsNotNone(data.get("sample_backdrop_path"))
        self.assertTrue(data["sample_poster_url"].startswith("https://image.tmdb.org/t/p/w500/"))

if __name__ == "__main__":
    unittest.main()
