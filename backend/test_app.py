import pytest
import numpy as np
import pandas as pd
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from main import app


# --- SKENARIO 1: TES HALAMAN UTAMA ---
@pytest.mark.asyncio
async def test_read_root():
    async def fake_init_model():
        import main
        # Minimal setup to avoid real startup doing network
        main.movies_df = pd.DataFrame([
            {"id": 1, "title": "Dummy", "year": 2000, "rating": 5.0, "overview": "", "genres": ["Drama"], "features": "Drama"}
        ])
        main.vectorizer = TfidfVectorizer(stop_words="english")
        main.tfidf_matrix = main.vectorizer.fit_transform(main.movies_df["features"]) 

    with patch("main.initialize_ml_model", side_effect=fake_init_model):
        transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Explainable AI Movie Recommender Ready"}


# --- SKENARIO 2: TES SEARCH LIMIT (MOCK HTTP) ---
@pytest.mark.asyncio
async def test_search_movies_limit_5():
    class FakeResponse:
        def __init__(self, results):
            self.status_code = 200
            self._results = results

        def json(self):
            return {"results": self._results}

    class FakeClient:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            return False
        async def get(self, url, headers=None, timeout=None, **kwargs):
            results = [{"id": i, "title": f"Film {i}"} for i in range(1, 8)]
            return FakeResponse(results)

    with patch("main.httpx.AsyncClient", new=FakeClient):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/search", params={"query": "Inception"})

    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) == 5  # dibatasi 5


# --- SKENARIO 3: RECOMMEND V2 – TITTLE DITEMUKAN LOKAL ---
@pytest.mark.asyncio
async def test_recommend_v2_known_titles():
    # Siapkan model minimal tanpa network di startup
    async def fake_init_model():
        import main
        movies = [
            {
                "id": 1,
                "title": "Inception",
                "year": 2010,
                "rating": 8.7,
                "poster_path": None,
                "overview": "dream within a dream",
                "genres": ["Science Fiction", "Action"],
                "features": "Science Fiction Action dream"
            },
            {
                "id": 2,
                "title": "Interstellar",
                "year": 2014,
                "rating": 8.6,
                "poster_path": None,
                "overview": "space exploration and love",
                "genres": ["Science Fiction", "Drama"],
                "features": "Science Fiction Drama space"
            },
            {
                "id": 3,
                "title": "The Dark Knight",
                "year": 2008,
                "rating": 9.0,
                "poster_path": None,
                "overview": "batman vs joker",
                "genres": ["Action", "Crime"],
                "features": "Action Crime batman joker"
            },
        ]
        main.movies_df = pd.DataFrame(movies)
        main.vectorizer = TfidfVectorizer(stop_words="english")
        main.tfidf_matrix = main.vectorizer.fit_transform(main.movies_df["features"])

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Setelah startup, set dataset minimal langsung ke modul
        import main
        await fake_init_model()
        payload = {"titles": ["Inception"]}
        resp = await ac.post("/recommend/v2", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert "user_profile" in data and "recommendations" in data
    # Inception adalah input, jangan muncul di rekomendasi
    assert all(rec["title"] != "Inception" for rec in data["recommendations"])
    # Harus ada setidaknya 1 rekomendasi dari dataset kecil kita
    assert len(data["recommendations"]) >= 1


# --- SKENARIO 4: RECOMMEND V2 – JIKA TIDAK ADA FILM DITEMUKAN ---
@pytest.mark.asyncio
async def test_recommend_v2_no_movies_found():
    # Siapkan model minimal kosong agar input_vectors kosong
    async def fake_init_model_empty():
        import main
        main.movies_df = pd.DataFrame([], columns=[
            "id", "title", "year", "rating", "poster_path", "overview", "genres", "features"
        ])
        main.vectorizer = TfidfVectorizer(stop_words="english")
        # Fit dengan satu dokumen placeholder agar vectorizer terinisialisasi
        main.tfidf_matrix = main.vectorizer.fit_transform(["placeholder text"])

    # Pastikan fetch_tmdb_movie_details tidak menambahkan apapun
    async def fake_fetch_details(client, title: str):
        return None

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        import main
        await fake_init_model_empty()
        with patch("main.fetch_tmdb_movie_details", side_effect=fake_fetch_details):
            payload = {"titles": ["Unknown Title"]}
            resp = await ac.post("/recommend/v2", json=payload)

    assert resp.status_code == 404
    assert resp.json()["detail"] == "No movies found."


# --- SKENARIO 5: RECOMMEND V2 – LIST TITLES KOSONG -> 404 ---
@pytest.mark.asyncio
async def test_recommend_v2_empty_titles_returns_404():
    # Model minimal agar lolos 503
    async def fake_init_model():
        import main
        movies = [{
            "id": 1,
            "title": "Interstellar",
            "year": 2014,
            "rating": 8.6,
            "poster_path": None,
            "overview": "space",
            "genres": ["Science Fiction"],
            "features": "Science Fiction space"
        }]
        main.movies_df = pd.DataFrame(movies)
        main.vectorizer = TfidfVectorizer(stop_words="english")
        main.tfidf_matrix = main.vectorizer.fit_transform(main.movies_df["features"]) 

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        import main
        await fake_init_model()
        payload = {"titles": []}
        resp = await ac.post("/recommend/v2", json=payload)

    assert resp.status_code == 404
    assert resp.json()["detail"] == "No movies found."


# --- SKENARIO 5: Validasi feedback API (message kosong) ---
@pytest.mark.asyncio
async def test_feedback_invalid_empty_message():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/feedback", json={"email": "user@example.com", "message": "   "})

    assert response.status_code == 422
    assert response.json()["detail"] == "Message cannot be empty."


# --- SKENARIO 6: Feedback API – gunakan hasil helper (resend/smtp/file) ---
@pytest.mark.asyncio
async def test_feedback_endpoint_resend_success():
    def fake_sender(email: str, msg: str):
        return {"delivered": True, "stored": False, "mode": "resend"}

    with patch("main._send_feedback_email", side_effect=fake_sender):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/api/feedback", json={"email": "user@example.com", "message": "Hello"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"]["mode"] == "resend"
    assert data["status"]["delivered"] is True


@pytest.mark.asyncio
async def test_feedback_endpoint_smtp_success():
    def fake_sender(email: str, msg: str):
        return {"delivered": True, "stored": False, "mode": "smtp"}

    with patch("main._send_feedback_email", side_effect=fake_sender):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/api/feedback", json={"email": "user@example.com", "message": "Hello"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"]["mode"] == "smtp"
    assert data["status"]["delivered"] is True


@pytest.mark.asyncio
async def test_feedback_endpoint_file_fallback():
    def fake_sender(email: str, msg: str):
        return {"delivered": False, "stored": True, "mode": "file"}

    with patch("main._send_feedback_email", side_effect=fake_sender):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/api/feedback", json={"email": "user@example.com", "message": "Hello"})

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"]["mode"] == "file"
    assert data["status"]["stored"] is True


# --- SKENARIO 7: Feedback status endpoint flags ---
@pytest.mark.asyncio
async def test_feedback_status_flags(monkeypatch):
    # Configure environment variables for resend and smtp
    monkeypatch.setenv("RESEND_API_KEY", "dummy_key")
    monkeypatch.setenv("RESEND_FROM", "noreply@example.com")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_USERNAME", "user")
    monkeypatch.setenv("SMTP_PASSWORD", "pass")
    monkeypatch.setenv("SMTP_USE_TLS", "true")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/feedback/status")

    assert resp.status_code == 200
    data = resp.json()
    assert data["resend_configured"] is True
    assert data["smtp_configured"] is True