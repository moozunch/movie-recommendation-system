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
    # Logika bodoh-bodohan dulu
    return {
        "input_movie": movie_title,
        "recommendations": [
            "Film Mirip A",
            "Film Mirip B",
            "Film Mirip C"
        ]
    }