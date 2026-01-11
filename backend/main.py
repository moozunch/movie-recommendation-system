import os
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

if not TMDB_TOKEN:
    print("⚠️  WARNING: TMDB_TOKEN not found in .env file!")

HEADERS = {
    "Authorization": f"Bearer {TMDB_TOKEN}",
    "accept": "application/json"
}

# --- HELPER FUNCTIONS ---

async def search_movie_id(client, title):
    """Search for movie ID by title on TMDB"""
    url = f"https://api.themoviedb.org/3/search/movie?query={title}&language=en-US&page=1"
    try:
        response = await client.get(url, headers=HEADERS)
        data = response.json()
        if data['results']:
            return data['results'][0]['id']
    except Exception as e:
        print(f"Error searching {title}: {e}")
    return None

async def get_tmdb_recommendations(client, movie_id):
    """Get recommendations based on movie ID"""
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations?language=en-US&page=1"
    try:
        response = await client.get(url, headers=HEADERS)
        data = response.json()
        return data.get('results', [])
    except Exception as e:
        print(f"Error getting recs: {e}")
        return []

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Movie Recommender API (TMDB) is Ready!"}

@app.get("/recommend")
async def get_recommendation(title: str):
    recommendations = []
    
    async with httpx.AsyncClient() as client:
        # 1. Find the Movie ID
        movie_id = await search_movie_id(client, title)
        
        if not movie_id:
            return {
                "input_movie": title,
                "message": "Movie not found",
                "recommendations": []
            }
        
        # 2. Get Recommendations
        tmdb_recs = await get_tmdb_recommendations(client, movie_id)

        # 3. Format Data
        for movie in tmdb_recs:
            if movie.get('poster_path'): # Filter movies without posters
                recommendations.append({
                    "title": movie['title'],
                    "genre": "Movie", # Simplified
                    "year": int(movie['release_date'][:4]) if movie.get('release_date') else 0,
                    "rating": movie['vote_average']
                })
    
    # Sort by rating
    recommendations = sorted(recommendations, key=lambda x: x['rating'], reverse=True)
    
    return {
        "input_movie": title,
        "recommendations": recommendations[:10]
    }