import pytest
from httpx import AsyncClient, ASGITransport 
from main import app
from unittest.mock import patch

# --- SKENARIO 1: TES HALAMAN UTAMA ---
@pytest.mark.asyncio
async def test_read_root():
    # CARA BARU: Bungkus app pakai ASGITransport
    transport = ASGITransport(app=app)
    
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/")
    
    assert response.status_code == 200
    # Pastikan pesan ini SAMA PERSIS dengan yang ada di main.py kamu
    assert response.json() == {"message": "Movie Recommender API (TMDB) is Ready!"}

# --- SKENARIO 2: TES SEARCH (MOCKING) ---
@pytest.mark.asyncio
async def test_recommend_inception():
    
    with patch("main.search_movie_id") as mock_search, \
         patch("main.get_tmdb_recommendations") as mock_recs:
        
        # MOCK DATA (Pura-pura)
        mock_search.return_value = 12345
        mock_recs.return_value = [
            {
                "title": "Interstellar Dummy",
                "genre_ids": [18, 878],
                "release_date": "2014-11-05",
                "vote_average": 9.0,
                "poster_path": "/gambar_palsu.jpg"
            }
        ]

        # REQUEST
        transport = ASGITransport(app=app) # <--- Pasang adapter lagi disini
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/recommend?title=Inception")

        # ASSERTIONS (Pengecekan)
        assert response.status_code == 200
        data = response.json()
        
        assert data["input_movie"] == "Inception"
        assert len(data["recommendations"]) == 1
        assert data["recommendations"][0]["title"] == "Interstellar Dummy"