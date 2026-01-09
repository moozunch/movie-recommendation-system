from fastapi.testclient import TestClient
from main import app

# Ini robot yang bakal pura-pura akses API
client = TestClient(app)

# Test 1: Cek apakah halaman utama jalan?
def test_read_root():
    response = client.get("/")
    # Pastikan statusnya 200 (OK/Berhasil)
    assert response.status_code == 200
    # Pastikan pesannya sesuai
    assert response.json() == {"message": "Halo, ini Backend Python yang ngomong!"}

# Test 2: Cek fitur rekomendasi
def test_get_recommendation():
    # Pura-pura minta rekomendasi film "Avengers"
    response = client.get("/recommend?movie_title=Avengers")
    
    # Cek status OK
    assert response.status_code == 200
    
    # Ambil datanya
    data = response.json()
    
    # Pastikan sistem membalas input yang benar
    assert data["input_movie"] == "Avengers"
    
    # Pastikan ada daftar rekomendasinya (list tidak boleh kosong)
    assert len(data["recommendations"]) > 0