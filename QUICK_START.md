# 🎯 Quick Start (Mulai dari sini)

## ⚡ Cara Tercepat (3 langkah)

### 1. Buka 3 Terminal
Buka 3 command prompt/PowerShell terpisah

### 2. Jalankan Services (di masing-masing terminal)

**Terminal 1 - Frontend:**
```
cd frontend
npm install
npm run dev
```
✅ Terbuka di http://localhost:3000

---

**Terminal 2 - Backend:**
```
cd backend
go mod download
go run main.go
```
✅ Running di http://localhost:8080

---

**Terminal 3 - Mock Server:**
```
cd mock-server
npm install
npm start
```
✅ Data mock di http://localhost:3001

---

## 🚀 Atau Gunakan Script Instant

**Windows CMD:**
```
start-all.bat
```

**Windows PowerShell:**
```
.\start-all.ps1
```

Ini akan membuka 3 window otomatis!

---

## 🔍 Cara Tahu Semuanya Jalan

1. Buka browser → http://localhost:3000 (Frontend muncul)
2. Di browser console F12, tidak ada error merah besar
3. Buka http://localhost:8080/api/places (JSON response muncul)
4. Lihat 3 terminal tidak ada error (hijau/info)

---

## ❌ Kalau Ada Masalah

**"Port 3000 sudah dipakai"**
```
Matikan aplikasi lain, atau:
cd frontend
npm run dev -- -p 3001
```

**"Cannot find module"**
```
# Di folder masing-masing, jalankan:
npm install     (untuk frontend/mock-server)
go mod tidy     (untuk backend)
```

**"Backend tidak bisa connect database"**
```
# Pastikan di folder backend ada permission write
# File disacare.db akan otomatis dibuat
```

---

## 📱 Struktur Ports

```
Frontend    → :3000
Backend     → :8080
Mock Server → :3001
```

**Jangan tutup terminal!** Service akan berhenti.

---

Selesai! Sekarang explore code dan develop 🎉
