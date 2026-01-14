import os
import asyncio
import httpx
import numpy as np
import pandas as pd
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import smtplib
from email.message import EmailMessage
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize ML model on startup (replaces deprecated on_event)
    await initialize_ml_model()
    yield

app = FastAPI(lifespan=lifespan)

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

# --- GLOBAL VARIABLES ---
movies_df = None
tfidf_matrix = None
vectorizer = None
GENRE_MAP = {}  # Kamus ID -> Nama Genre (ex: 28 -> "Action")
FEEDBACK_RECIPIENT = os.getenv("FEEDBACK_RECIPIENT", "annisaputriaprilia12@gmail.com")

# --- MODELS ---
class UserTasteProfile(BaseModel):
    titles: List[str]

class FeedbackPayload(BaseModel):
    email: EmailStr
    message: str

# --- HELPER: FETCH GENRES ---
async def fetch_genre_mapping(client):
    """Ambil kamus Genre resmi dari TMDB"""
    global GENRE_MAP
    url = "https://api.themoviedb.org/3/genre/movie/list?language=en-US"
    try:
        response = await client.get(url, headers=HEADERS)
        data = response.json()
        GENRE_MAP = {g['id']: g['name'] for g in data.get('genres', [])}
        print(f"Loaded {len(GENRE_MAP)} genres from TMDB")
    except Exception as e:
        print(f"Error loading genres: {e}")

# --- HELPER: REAL-TIME FETCHING ---
async def fetch_tmdb_movie_details(client, title: str):
    """Cari film di TMDB secara live jika tidak ada di DB lokal"""
    print(f"Searching TMDB for missing movie: {title}")
    
    # 1. Cari ID Film
    search_url = f"https://api.themoviedb.org/3/search/movie?query={title}&language=en-US&page=1"
    try:
        response = await client.get(search_url, headers=HEADERS)
        data = response.json()
        return data.get('results', [])
    except Exception as e:
        print(f"Error fetching dynamic movie {title}: {e}")
        return None

# --- INITIALIZATION ---
async def initialize_ml_model():
    global movies_df, tfidf_matrix, vectorizer
    
    print("Initializing Explainable AI Model...")
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
        print("CRITICAL: Failed to fetch movies.")
        return

    # Buat DataFrame
    movies_df = pd.DataFrame(movies_data)
    movies_df.drop_duplicates(subset=['id'], inplace=True)
    
    # Train AI
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = vectorizer.fit_transform(movies_df['features'])
    
    print(f"AI Ready: Loaded {len(movies_df)} movies with genres.")

# Lifespan handles initialization; remove deprecated on_event usage

# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Explainable AI Movie Recommender Ready"}


@app.get("/search")
async def search_movies(query: str):
    """Proxy simple search to TMDB and limit results to 5."""
    async with httpx.AsyncClient() as client:
        try:
            url = f"https://api.themoviedb.org/3/search/movie?query={query}&language=en-US&page=1"
            resp = await client.get(url, headers=HEADERS, timeout=10.0)
            data = resp.json()
            results = data.get("results", [])[:5]
            return {"results": results}
        except Exception as e:
            print(f"Search error: {e}")
            return {"results": []}

@app.post("/recommend/v2")
async def recommend_v2(payload: UserTasteProfile):
    """Recommend similar movies using local TF–IDF vectors.
    Falls back to TMDB search if local titles are not found.
    """
    global movies_df, tfidf_matrix, vectorizer

    if movies_df is None or tfidf_matrix is None or vectorizer is None:
        raise HTTPException(status_code=503, detail="Model not initialized.")

    titles = [t for t in payload.titles if t and t.strip()]
    if not titles:
        raise HTTPException(status_code=404, detail="No movies found.")

    # Find indices for provided titles in local dataset
    mask = movies_df["title"].isin(titles)
    selected_indices = list(np.where(mask)[0])

    input_genres: List[str] = []
    if not selected_indices:
        # Attempt dynamic fetch to build a synthetic vector from TMDB details
        async with httpx.AsyncClient() as client:
            details = await fetch_tmdb_movie_details(client, titles[0])
        if not details:
            raise HTTPException(status_code=404, detail="No movies found.")
        candidate = details[0]
        movie_genres = [GENRE_MAP.get(gid) for gid in candidate.get('genre_ids', []) if gid in GENRE_MAP]
        genres_str = ' '.join([g for g in movie_genres if g])
        overview = candidate.get('overview', '')
        features_text = f"{genres_str} {overview}".strip()
        if not features_text:
            raise HTTPException(status_code=404, detail="No movies found.")
        user_vector = vectorizer.transform([features_text])  # csr matrix
        input_genres = [g for g in movie_genres if g]
    else:
        # Mean on sparse returns np.matrix; convert to 2D ndarray
        user_vector = tfidf_matrix[selected_indices].mean(axis=0)
        user_vector = np.asarray(user_vector).reshape(1, -1)
        # Collect input genres from local dataset
        try:
            input_genres = sorted({g for idx in selected_indices for g in (movies_df.iloc[idx]["genres"] or []) if g})
        except Exception:
            input_genres = []
    sims = cosine_similarity(user_vector, tfidf_matrix).ravel()

    # Rank and prepare recommendations (exclude input titles)
    ranked = np.argsort(-sims)
    recs = []
    for idx in ranked:
        title = movies_df.iloc[idx]["title"]
        if title in titles:
            continue
        row = movies_df.iloc[idx]
        # similarity score to percentage (0-100)
        score_pct = max(0.0, min(1.0, float(sims[idx]))) * 100.0
        # overlap genres reasoning
        row_genres = [g for g in (row["genres"] if "genres" in row else []) if g]
        overlap = sorted(list(set(row_genres) & set(input_genres)))
        reason_text = (
            f"Similar genres: {', '.join(overlap)}" if overlap else 
            "High content similarity based on genres and overview"
        )
        recs.append({
            "id": int(row["id"]) if "id" in row else idx,
            "title": title,
            "year": int(row["year"]) if "year" in row and row["year"] else 0,
            "rating": float(row["rating"]) if "rating" in row else 0.0,
            "poster_path": row.get("poster_path"),
            "genres": row_genres,
            "reason": reason_text,
            "match_score": f"{int(round(score_pct))}%",
        })
        if len(recs) >= 10:
            break

    return {"user_profile": titles, "recommendations": recs}


def _send_feedback_email(sender_email: str, message: str) -> dict:
    """Send feedback: try Resend first (HTTPS), then SMTP, else store locally.
    Returns a dict describing the delivery status.
    """
    # 1) Resend (HTTPS) — works on Hugging Face Spaces
    resend_key = os.getenv("RESEND_API_KEY")
    resend_from = os.getenv("RESEND_FROM")
    if resend_key:
        try:
            resp = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": resend_from or sender_email,
                    "to": FEEDBACK_RECIPIENT,
                    "subject": "New Feedback",
                    "text": f"From: {sender_email}\n\n{message}",
                },
                timeout=10.0,
            )
            if resp.status_code in (200, 201):
                return {"delivered": True, "stored": False, "mode": "resend"}
            else:
                print(f"Resend failed: {resp.status_code} {resp.text}")
        except Exception as e:
            print(f"Resend error: {e}")

    # 2) SMTP — often blocked on Spaces
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"}
    from_addr_env = os.getenv("SMTP_FROM")
    from_addr = from_addr_env if from_addr_env else (smtp_user or sender_email)

    if smtp_host and smtp_user and smtp_pass:
        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                if use_tls:
                    server.starttls()
                server.login(smtp_user, smtp_pass)

                msg = EmailMessage()
                msg["Subject"] = "New Feedback"
                msg["From"] = from_addr
                msg["Reply-To"] = sender_email
                msg["To"] = FEEDBACK_RECIPIENT
                msg.set_content(f"From: {sender_email}\n\n{message}")

                server.send_message(msg)
            return {"delivered": True, "stored": False, "mode": "smtp"}
        except Exception as e:
            print(f"SMTP send failed: {e}")

    # 3) Fallback: store locally
    try:
        clean_message = message.replace('\n', ' ')
        log_line = f"FROM={sender_email} MESSAGE={clean_message}\n"
        with open("feedback.log", "a", encoding="utf-8") as f:
            f.write(log_line)
        return {"delivered": False, "stored": True, "mode": "file"}
    except Exception as e:
        print(f"Failed to store feedback: {e}")
        return {"delivered": False, "stored": False, "mode": "error", "error": str(e)}


@app.post("/api/feedback")
async def submit_feedback(payload: FeedbackPayload):
    """Accept feedback and attempt to send it to the maintainer's email.
    If SMTP is not configured, the feedback is stored in feedback.log.
    """
    if not payload.message.strip():
        raise HTTPException(status_code=422, detail="Message cannot be empty.")

    status = _send_feedback_email(payload.email, payload.message.strip())
    return {
        "recipient": FEEDBACK_RECIPIENT,
        "status": status,
        "message": "Feedback processed",
    }

@app.get("/api/feedback/status")
def feedback_status():
    """Minimal transport status for diagnostics."""
    configured_resend = bool(os.getenv("RESEND_API_KEY"))
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() in {"1", "true", "yes"}
    configured_smtp = bool(smtp_host and smtp_user and smtp_pass)
    return {
        "recipient": FEEDBACK_RECIPIENT,
        "resend_configured": configured_resend,
        "resend_from": os.getenv("RESEND_FROM") or None,
        "smtp_configured": configured_smtp,
        "smtp": {
            "host": smtp_host or None,
            "port": smtp_port,
            "use_tls": use_tls,
            "username_present": bool(smtp_user),
            "password_present": bool(smtp_pass),
        },
    }