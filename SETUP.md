# 🚀 Panduan Menjalankan DisaCare Bandung

## ✅ Requirements
Sebelum memulai, pastikan sudah install:
- **Node.js** (v18+) - untuk frontend
- **Go** (v1.20+) - untuk backend
- **npm/yarn** - package manager

## 📋 Cara Menjalankan

### Opsi 1: Jalankan Satu Per Satu (Termudah untuk Pemula)

#### 1️⃣ **Terminal 1 - Frontend (Next.js)**
```bash
cd frontend
npm install    # hanya sekali
npm run dev
```
📍 Buka: http://localhost:3000

#### 2️⃣ **Terminal 2 - Backend (Golang)**
```bash
cd backend
go mod download  # hanya sekali
go run main.go
```
📍 Backend berjalan di: http://localhost:8080

#### 3️⃣ **Terminal 3 - Mock Server (JSON Server)**
```bash
cd mock-server
npm install    # hanya sekali
npm start
```
📍 Mock data di: http://localhost:3001

---

### Opsi 2: Gunakan Script Windows PowerShell

#### Start Semua Sekaligus:
```powershell
.\start-all.ps1
```
Ini akan membuka 3 terminal terpisah otomatis.

#### Stop Semua:
```powershell
.\stop-all.ps1
```

---

## 🔧 Setup Database (Backend)

Jika belum ada database:

```bash
cd backend
go run main.go
```

Backend akan otomatis membuat file `disacare.db` (SQLite) pada run pertama.

---

## 🌐 Testing

Setelah ketiga service berjalan, coba akses:

- ✅ Frontend: http://localhost:3000
- ✅ Backend Health Check: http://localhost:8080/api/places
- ✅ Mock Server: http://localhost:3001

---

## ⚠️ Troubleshooting

### "Port sudah digunakan"
```bash
# Ganti port di .env (jika ada) atau code
# Frontend: buka next.config.ts → ubah port
# Backend: set PORT=8081 (environment variable)
# Mock: edit mock-server/package.json → --port 3002
```

### "Cannot find module"
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && go mod download && go mod tidy

# Mock Server
cd mock-server && npm install
```

### Backend tidak connect ke database
- Pastikan folder `backend/` punya permission write
- Cek file `.env` untuk konfigurasi database

---

## 📝 Catatan Penting

- **Jangan close terminal** saat service masih dibutuhkan
- Setiap service perlu **terminal terpisah**
- Frontend butuh backend online untuk fitur login/contribute
- Mock server optional (untuk testing tanpa backend)
