# 1. Pakai Image Node.js
FROM node:20-alpine

# 2. Bikin folder kerja
WORKDIR /app

# 3. Copy file package.json (daftar library js)
COPY package*.json ./

# 4. Install librarynya
RUN npm install

# 5. Copy semua kode project
COPY . .

# 6. Jalankan mode development
CMD ["npm", "run", "dev"]