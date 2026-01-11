import os
import httpx
import numpy as np
import pandas as pd
import asyncio
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

# --- CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_TOKEN = os.getenv("TMDB_TOKEN")
HEADERS = {
    "Authorization": f"Bearer {TMDB_TOKEN}",
    "accept": "application/json"
}

# --- GLOBAL VARIABLES ---
movies_df = None
tfidf_matrix = None
vectorizer = None
GENRE_MAP = {}  # Kamus ID -> Nama Genre (ex: 28 -> "Action")

# --- MODELS ---
class UserTasteProfile(BaseModel):
    titles: List[str]

# --- HELPER: FETCH GENRES ---
async def fetch_genre_mapping(client):
    """Ambil kamus Genre resmi dari TMDB"""
    global GENRE_MAP
    url = "https://api.themoviedb.org/3/genre/movie/list?language=en-US"
    try:
        response = await client.get(url, headers=HEADERS)
        data = response.json()
        GENRE_MAP = {g['id']: g['name'] for g in data.get('genres', [])}
        print(f"✅ Loaded {len(GENRE_MAP)} genres from TMDB")
    except Exception as e:
        print(f"❌ Error loading genres: {e}")

# --- HELPER: REAL-TIME FETCHING ---
async def fetch_tmdb_movie_details(client, title: str):
    """Cari film di TMDB secara live jika tidak ada di DB lokal"""
    print(f"🕵️ Searching TMDB for missing movie: {title}")
    
    # 1. Cari ID Film
    search_url = f"https://api.themoviedb.org/3/search/movie?query={title}&language=en-US&page=1"
    try:
        resp = await client.get(search_url, headers=HEADERS, timeout=10.0)
        data = resp.json()
        if not data.get('results'):
            return None
        
        movie = data['results'][0]
        movie_id = movie['id']
        
        # 2. Ambil Detail
        detail_url = f"https://api.themoviedb.org/3/movie/{movie_id}?language=en-US"
        detail_resp = await client.get(detail_url, headers=HEADERS, timeout=10.0)
        detail_data = detail_resp.json()
        
        genres_list = [g['name'] for g in detail_data.get('genres', [])]
        genres_str = ' '.join(genres_list)
        overview = detail_data.get('overview', '')
        
        return {
            'id': movie_id,
            'title': detail_data.get('title', title),
            'genres': genres_list, # Simpan list genre asli
            'features': f"{genres_str} {overview}"
        }
    except Exception as e:
        print(f"⚠️ Error fetching dynamic movie {title}: {e}")
        return None

# --- INITIALIZATION ---
async def initialize_ml_model():
    global movies_df, tfidf_matrix, vectorizer
    
    print("🔄 Initializing Explainable AI Model...")
    movies_data = []
    
    async with httpx.AsyncClient() as client:
        # 1. Load Genre Map Dulu!
        await fetch_genre_mapping(client)

        # 2. Download 50 Halaman Film (~1000 Judul)
        tasks = []
        for page in range(1, 51): 
            url = f"https://api.themoviedb.org/3/movie/popular?language=en-US&page={page}"
            tasks.append(client.get(url, headers=HEADERS))
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        for response in responses:
            if isinstance(response, Exception) or response.status_code != 200:
                continue
            
            data = response.json()
            for movie in data.get('results', []):
                # Mapping ID Genre ke Nama Genre
                movie_genres = [GENRE_MAP.get(gid) for gid in movie.get('genre_ids', []) if gid in GENRE_MAP]
                genres_str = ' '.join(movie_genres)
                overview = movie.get('overview', '')
                
                movies_data.append({
                    'id': movie['id'],
                    'title': movie.get('title', ''),
                    'year': int(movie['release_date'][:4]) if movie.get('release_date') else 0,
                    'rating': movie.get('vote_average', 0),
                    'poster_path': movie.get('poster_path'),
                    'overview': overview,
                    'genres': movie_genres,  # Simpan List Genre untuk alasan
                    'features': f"{genres_str} {overview}" 
                })

    if not movies_data:
        print("❌ CRITICAL: Failed to fetch movies.")
        return

    # Buat DataFrame
    movies_df = pd.DataFrame(movies_data)
    movies_df.drop_duplicates(subset=['id'], inplace=True)
    
    # Train AI
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(movies_df['features'])
    
    print(f"✅ AI Ready: Loaded {len(movies_df)} movies with genres.")

@app.on_event("startup")
async def startup_event():
    await initialize_ml_model()

# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Explainable AI Movie Recommender Ready"}

@app.get("/search")
async def search_movies(query: str):
    # (Sama seperti sebelumnya)
    async with httpx.AsyncClient() as client:
        url = f"https://api.themoviedb.org/3/search/movie?query={query}&language=en-US&page=1"
        r = await client.get(url, headers=HEADERS)
        data = r.json()
        return {"results": data.get('results', [])[:5]}

@app.post("/recommend/v2")
async def get_multi_movie_recommendations(profile: UserTasteProfile):
    if movies_df is None or vectorizer is None:
        raise HTTPException(status_code=503, detail="Server starting up...")

    input_vectors = []
    found_titles = []
    user_genres_pool = set() # Kumpulan semua genre dari film favorit user
    
    async with httpx.AsyncClient() as client:
        for title in profile.titles:
            # Cari di DB Lokal
            match = movies_df[movies_df['title'].str.lower() == title.lower()]
            
            if not match.empty:
                idx = match.index[0]
                input_vectors.append(tfidf_matrix[idx].toarray())
                found_titles.append(match.iloc[0]['title'])
                # Kumpulkan genre
                for g in match.iloc[0]['genres']:
                    user_genres_pool.add(g)
            else:
                # Cari di TMDB Live
                details = await fetch_tmdb_movie_details(client, title)
                if details:
                    vector = vectorizer.transform([details['features']]).toarray()
                    input_vectors.append(vector)
                    found_titles.append(details['title'])
                    for g in details['genres']:
                        user_genres_pool.add(g)

    if not input_vectors:
        raise HTTPException(status_code=404, detail="No movies found.")

    # Hitung Centroid
    input_matrix = np.vstack(input_vectors)
    user_centroid = np.mean(input_matrix, axis=0).reshape(1, -1)
    
    # Hitung Similarity
    similarity_scores = cosine_similarity(user_centroid, tfidf_matrix)[0]
    top_indices = similarity_scores.argsort()[::-1]
    
    recommendations = []
    for idx in top_indices:
        candidate = movies_df.iloc[idx]
        if candidate['title'] in found_titles:
            continue
            
        if len(recommendations) >= 10:
            break
            
        # --- LOGIC "THOUGHT PROCESS" (EXPLAINABILITY) ---
        # Cari irisan genre antara user profile dan kandidat
        candidate_genres = set(candidate['genres'])
        common_genres = list(user_genres_pool.intersection(candidate_genres))
        
        reason = "Recommended based on overall plot similarity."
        if common_genres:
            # Ambil maksimal 3 genre yang sama biar gak kepanjangan
            top_common = common_genres[:3] 
            reason = f"Matches your taste in {', '.join(top_common)}."
        elif float(similarity_scores[idx]) > 0.4:
            reason = "High plot similarity with your selected movies."
            
        recommendations.append({
            "title": candidate['title'],
            "year": int(candidate['year']),
            "rating": float(candidate['rating']),
            "genres": candidate['genres'], # Kirim list genre ke frontend
            "poster_path": candidate.get('poster_path'),
            "reason": reason, # <--- INI ALASANNYA
            "match_score": f"{int(similarity_scores[idx] * 100)}%" 
        })

    return {
        "user_profile": found_titles,
        "recommendations": recommendations
    }