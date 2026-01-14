import os
import httpx
from fastapi import FastAPI
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
        response = await client.get(url, headers=HEADERS)
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
        "user_profile": found_titles,
        "recommendations": recommendations
    }


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