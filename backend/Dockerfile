# 1. Pakai Image dasar Python yang ringan (slim)
FROM python:3.11-slim

# 2. Bikin folder kerja di dalam container
WORKDIR /app

# 3. Copy daftar requirement library yang harus ada
COPY requirements.txt .

# 4. Install requirement 
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy sisa kode (main.py) ke dalam container
COPY . .

# 6. Jalankan server (PENTING: host 0.0.0.0 biar bisa diakses dari luar container)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]