# CineNOVA — AI-Powered Movie Discovery & Recommendation Platform

> *"Discover Beyond the Screen. Your next obsession starts here."*

CineNOVA is a production-grade, cinematic movie discovery and personalized recommendation platform. It combines the visual quality and design language of premium streaming platforms with a real machine learning recommendation engine powered by a pretrained TF-IDF cosine-similarity model across **45,447 films**.

---

## 🌟 Key Features

1. **Pretrained AI Recommendation Engine (Core Feature)**:
   - **Movie-to-Movie Cosine Similarity**: Given any film (e.g. *Inception*, *Toy Story*, *Interstellar*), calculates instant linear kernel dot products against the 45k sparse TF-IDF feature matrix in ~60ms.
   - **Mood & Vibe Vectorization**: Takes freeform themes, plot concepts, or curated moods (e.g., *"Mind-Bending Psychological Sci-Fi"*, *"Dark Gritty Neo-Noir Crime"*) and transforms them through the pretrained `TfidfVectorizer` to match relevant films.
   - **Composite Taste Profile from Watchlist**: Computes the mean vector of all saved movies in your personal Watchlist to deliver tailored discovery recommendations.
   - **Truthful AI Explanations**: Displays calculated match percentage and transparent thematic correlations (shared genres and semantic tags).

2. **Cinematic Visual Design System**:
   - Palette: Deep Midnight Navy (`#0B0D17`), Secondary (`#121525`), Elevated Cards (`#191D30`), Electric Violet (`#8B5CF6`), and Cyan (`#36D9D0`).
   - Immersive hero section with backdrop rotations, 4K badges, trailers, and quick watchlist controls.
   - Smooth hover lifts, glassmorphism overlays, and mobile-responsive layout.

3. **16+ Curated Discovery Rows**:
   - Trending Now (Today & This Week toggle)
   - Popular Hollywood Blockbusters
   - Bollywood Hits (Hindi & Indian cinema)
   - Top Rated Masterpieces
   - Popular TV Series & Bingeable Shows
   - Korean Dramas (K-Dramas)
   - Korean Cinema & Thrillers
   - Sci-Fi & Cyberpunk Frontiers
   - Action & Adrenaline
   - Thriller & Suspense
   - Romance & Heartfelt
   - Horror Nights
   - Comedy Club
   - Anime & Animation

4. **Multi-Faceted Explore & Search**:
   - Advanced multi-attribute filtering (Media type, Genre, Year, Min Rating 6+/7+/8+, Language/Region, Sort order).
   - Live debounced search (300ms) with keyboard shortcuts (`Cmd/Ctrl+K`) and trending search queries.

5. **Deep Movie & Series Detail View**:
   - Cinematic backdrops, high-res posters, synopsis, genres, runtime, ratings, directors, and top cast with character avatars.
   - Official YouTube trailer player modal.
   - Pretrained AI recommendations based on the selected title.
   - TMDB similar titles.

6. **My List (Watchlist)**:
   - LocalStorage persistence with reactive event updates.
   - Dedicated filtering (All, Movies, Series).
   - One-click *"Get AI Recommendations from My List"* generating a composite taste profile.

7. **Secure TMDB Integration & Offline Resilience**:
   - Proxied server-side via FastAPI (`/api/tmdb/*`) with in-memory TTL caching.
   - Zero hardcoded API keys.
   - If a TMDB API key is not configured, CineNOVA seamlessly falls back to its 45,447 catalog dataset from `df.pkl`.
   - Users can update their TMDB API Key at any time directly through the UI or in `.env`.

---

## 🏗️ Architecture

```
CineNOVA Web App (React 19 + TypeScript + Tailwind CSS + Lucide Icons)
       │
       ▼ (HTTP /api/*)
FastAPI Backend (main.py)
   ├── RecommendationEngine (backend/model_engine.py)
   │     ├── df.pkl (45,447 movies metadata)
   │     ├── indices.pkl (title-to-index mapping)
   │     ├── tfidf.pkl (sklearn TfidfVectorizer, 50k vocabulary)
   │     └── tfidf_matrix.pkl (scipy sparse csr_matrix 45447x50000)
   ├── TMDBClient (backend/tmdb_client.py)
   │     ├── In-memory TTL cache (600s)
   │     └── Parallel recommendation TMDB metadata enrichment
   └── FallbackCatalog (backend/fallback_catalog.py)
         └── High-performance offline catalog provider
```

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10+ (with `.venv` in workspace)
- Node.js 18+ and npm

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your TMDB API Key:
```env
TMDB_API_KEY=your_tmdb_api_key_here
PORT=8000
HOST=0.0.0.0
```

### 3. Run the Application

#### Option A: Run Production Mode (FastAPI serves both API and built Frontend)
```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Start server
python app.py
```
Open **`http://localhost:8000`** in your browser.

#### Option B: Run in Development Mode (Vite Dev Server with Hot Reload)
In Terminal 1 (Backend):
```bash
python app.py
```

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

Run the automated test suite:
```bash
python -m unittest tests/test_cinenova.py
```
This tests:
- System health and model loading
- Model title autocomplete search
- Pretrained title-to-title recommendation calculation
- Freeform tag/prompt vectorization
- Multi-movie watchlist composite taste recommendations
- TMDB proxy and fallback catalog endpoints
- Static SPA delivery
