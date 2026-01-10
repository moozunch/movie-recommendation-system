from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 2. Konfigurasi Izin Satpam
# Kita izinkan localhost:3000 (Frontend) buat akses backend corsm, tapi karena ini pakai codespace dan alamat nggak pas di localhost dan berubah terus, jd di allow dulu semuanya
# origins = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins, # Daftar siapa yang boleh masuk
#     allow_credentials=True,
#     allow_methods=["*"],   # Boleh ngapain aja (GET, POST, dll)
#     allow_headers=["*"],
# )
# IZINKAN SEMUA (WILDCARD)
# Tanda "*" artinya: Siapa saja boleh masuk.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ini endpoint untuk tes
@app.get("/")
def read_root():
    return {"message": "Halo, ini Backend Python yang ngomong!"}

# Ini endpoint pura-pura rekomendasi 
@app.get("/recommend")
def get_recommendation(movie_title: str):
    title_lower = movie_title.lower()
    
    # Data dummy tapi lebih kaya (List of Objects)
    if "avengers" in title_lower or "marvel" in title_lower:
        recs = [
            {"title": "Iron Man", "genre": "Action", "rating": 8.5, "year": 2008},
            {"title": "Thor: Ragnarok", "genre": "Action/Comedy", "rating": 7.9, "year": 2017},
            {"title": "Spider-Man: No Way Home", "genre": "Action", "rating": 8.2, "year": 2021},
        ]
    elif "horror" in title_lower or "conjuring" in title_lower:
        recs = [
            {"title": "Hereditary", "genre": "Horror", "rating": 7.3, "year": 2018},
            {"title": "The Conjuring", "genre": "Horror", "rating": 7.5, "year": 2013},
            {"title": "Midsommar", "genre": "Horror", "rating": 7.1, "year": 2019},
        ]
    elif "love" in title_lower or "romance" in title_lower:
        recs = [
            {"title": "La La Land", "genre": "Romance/Musical", "rating": 8.0, "year": 2016},
            {"title": "About Time", "genre": "Romance/Sci-Fi", "rating": 7.8, "year": 2013},
        ]
    else:
        recs = [
            {"title": "Inception", "genre": "Sci-Fi", "rating": 8.8, "year": 2010},
            {"title": "Parasite", "genre": "Thriller", "rating": 8.6, "year": 2019},
        ]

    return {
        "input_movie": movie_title,
        "recommendations": recs
    }