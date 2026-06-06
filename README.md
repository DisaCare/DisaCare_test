# DisaCare Bandung

Platform portal informasi dan direktori spasial aksesibilitas fasilitas publik di Kota Bandung bagi penyandang disabilitas.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Workflow Aplikasi](#workflow-aplikasi)
- [Struktur Direktori](#struktur-direktori)
- [Tech Stack](#tech-stack)
- [Peran dan Hak Akses](#peran-dan-hak-akses)
- [Fitur Utama](#fitur-utama)
- [Cara Menjalankan](#cara-menjalankan)
- [Dokumentasi Lanjutan](#dokumentasi-lanjutan)

---

## Gambaran Umum

**DisaCare** adalah platform portal informasi berbasis web yang memetakan tingkat aksesibilitas fasilitas publik di wilayah Kota Bandung bagi penyandang disabilitas. Aplikasi ini menggunakan pendekatan data hibrida yang menggabungkan dua sumber data utama:

| Sumber Data | Keterangan |
|---|---|
| Official Data | Data terverifikasi yang dimasukkan langsung oleh Developer/Admin (contoh: Balai Kota Bandung, BIP, Gedung Sate, kampus-kampus) |
| Crowdsourced Data | Kontribusi laporan, checklist fasilitas, dan foto bukti fisik dari mahasiswa dan warga Bandung |

Platform ini juga dirancang secara inklusif dengan fitur aksesibilitas bawaan seperti Text-to-Speech, High Contrast Mode, dan Font Resizer agar dapat diakses langsung oleh penyandang disabilitas.

**Tim Pengembang**

| Nama | Peran |
|---|---|
| Affifah | ... |
| Alifya | ... |
| Al Yasmin | ... |
| Zahra | ... |

Mata Kuliah: Literasi Manusia
Lokasi Studi Kasus: Kota Bandung, Jawa Barat

---

## Arsitektur Sistem

```mermaid
graph TB
    subgraph CLIENT["Client Layer (Next.js + React)"]
        FE_MAP["Halaman Peta & Direktori"]
        FE_DETAIL["Halaman Detail Tempat + Mini-Map"]
        FE_FORM["Form Kontribusi Laporan"]
        FE_ADMIN["Panel Admin Verifikasi"]
        FE_AUTH["Halaman Login / Register"]
        FE_A11Y["Komponen Aksesibilitas\n(TTS, High Contrast, Font Resizer)"]
    end

    subgraph GATEWAY["API Gateway"]
        JWT["JWT Middleware (Auth Guard)"]
        RATE["Rate Limiter"]
        VALID["Input Validator"]
    end

    subgraph BACKEND["Backend Layer (Node.js + Express)"]
        direction TB
        ROUTE_PLACES["Routes /api/places"]
        ROUTE_AUTH["Routes /api/auth"]
        ROUTE_UPLOAD["Routes /api/upload"]

        CTRL_PLACES["Places Controller"]
        CTRL_AUTH["Auth Controller"]
        CTRL_UPLOAD["Upload Controller"]

        SVC_PLACES["Places Service"]
        SVC_AUTH["Auth Service"]
        SVC_SCORE["Scoring Service (Kalkulasi Rapor %)"]
    end

    subgraph DB["Data Layer (MySQL)"]
        TBL_PLACES["places"]
        TBL_USERS["users"]
        TBL_CHECKLISTS["accessibility_checklists"]
        TBL_PHOTOS["photo_proofs"]
    end

    subgraph STORAGE["File Storage"]
        UPLOAD_DIR["uploads/photos/"]
    end

    FE_MAP & FE_FORM & FE_ADMIN --> GATEWAY
    GATEWAY --> JWT --> ROUTE_PLACES & ROUTE_AUTH & ROUTE_UPLOAD
    ROUTE_PLACES --> CTRL_PLACES --> SVC_PLACES --> TBL_PLACES & TBL_CHECKLISTS
    ROUTE_AUTH --> CTRL_AUTH --> SVC_AUTH --> TBL_USERS
    ROUTE_UPLOAD --> CTRL_UPLOAD --> UPLOAD_DIR
    SVC_PLACES --> SVC_SCORE
    TBL_PHOTOS -.-> UPLOAD_DIR
```

---

## Workflow Aplikasi

### A. Alur Pengguna Umum (Read-Only)

```mermaid
flowchart LR
    A([Buka DisaCare]) --> B[Lihat Direktori & Peta]
    B --> C{Cari / Filter Tempat}
    C -->|Kata kunci| D[Hasil Pencarian]
    C -->|Kategori| E[Filter: Mall / Kampus / RS]
    D & E --> F[Pilih Tempat]
    F --> G[Halaman Detail Tempat]
    G --> H[Lihat Mini-Map Lokasi]
    G --> I[Lihat Rapor Aksesibilitas]
    G --> J[Gunakan Fitur TTS / Kontras Tinggi]
```

### B. Alur Kontributor

```mermaid
flowchart TD
    A([Login Akun]) --> B{JWT Valid?}
    B -->|Tidak| C[Redirect ke Login]
    B -->|Ya| D[Buka Form Kontribusi]
    D --> E[Isi Nama, Koordinat, Kategori]
    E --> F[Isi Checklist Fasilitas]
    F --> G[Upload Foto Bukti Fisik - Wajib]
    G --> H{Validasi Input}
    H -->|Gagal| I[Tampilkan Error]
    H -->|Berhasil| J[POST /api/places/report]
    J --> K[Status: is_verified = false]
    K --> L[Notifikasi: Menunggu Validasi Admin]
```

### C. Alur Admin Verifikasi

```mermaid
flowchart TD
    A([Login Admin]) --> B[Dashboard Verifikasi]
    B --> C[Lihat Antrian Laporan Masuk]
    C --> D[Tinjau Foto Bukti dan Checklist]
    D --> E{Keputusan Admin}
    E -->|Approve| F[PATCH /api/places/verify/:id\nstatus_action: approve]
    E -->|Reject| G[PATCH /api/places/verify/:id\nstatus_action: reject]
    F --> H[is_verified = true\nTempat tampil di direktori publik]
    G --> I[Laporan ditolak, tidak tayang]
```

---

## Struktur Direktori

```
disacare-bandung/
├── README.md
├── docs/
│   ├── prd-frontend.md
│   ├── prd-backend.md
│   └── prd-mock-server.md
│
├── frontend/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx               -- Halaman utama direktori + peta
│   │   │   └── place/[id]/page.tsx    -- Halaman detail + mini-map
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── contribute/page.tsx        -- Form kontribusi (protected)
│   │   └── admin/
│   │       ├── page.tsx               -- Dashboard verifikasi (protected)
│   │       └── verify/[id]/page.tsx
│   ├── components/
│   │   ├── map/                       -- Komponen Leaflet.js
│   │   ├── accessibility/             -- TTS, High Contrast, Font Resizer
│   │   ├── ui/                        -- Reusable UI
│   │   └── forms/
│   ├── lib/
│   │   ├── api.ts
│   │   └── auth.ts
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── places.routes.js
│   │   │   ├── auth.routes.js
│   │   │   └── upload.routes.js
│   │   ├── controllers/
│   │   │   ├── places.controller.js
│   │   │   ├── auth.controller.js
│   │   │   └── upload.controller.js
│   │   ├── services/
│   │   │   ├── places.service.js
│   │   │   ├── auth.service.js
│   │   │   └── scoring.service.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── upload.middleware.js
│   │   └── config/
│   │       ├── db.js
│   │       └── schema.sql
│   └── app.js
│
└── mock-server/
    ├── db.json
    └── routes.json
```

---

## Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | SSR dan routing berbasis file |
| UI Styling | Tailwind CSS | Utility-first CSS framework |
| Peta | Leaflet.js + OpenStreetMap | Library peta ringan, gratis, client-side |
| Backend | Node.js + Express.js | REST API server modular |
| Database | MySQL | Relational database |
| DB Driver | mysql2 | Koneksi MySQL tanpa ORM, query manual |
| Autentikasi | JWT (jsonwebtoken) | Stateless auth berbasis token |
| File Upload | Multer | Middleware penanganan foto bukti fisik |
| Aksesibilitas | Web Speech API (browser native) | Text-to-Speech tanpa dependency tambahan |
| Mock Server | json-server | Placeholder API untuk tahap development |

---

## Peran dan Hak Akses

```mermaid
graph LR
    subgraph ROLES["Aktor Sistem"]
        ADMIN["Developer / Admin\nFull Privileges"]
        CONTRIB["Kontributor\nJWT Required"]
        USER["Pengguna Umum\nRead-Only"]
    end

    subgraph ENDPOINTS["Endpoint"]
        E1["GET /api/places"]
        E2["POST /api/places/report"]
        E3["PATCH /api/places/verify/:id"]
        E4["POST /api/auth/register"]
        E5["POST /api/auth/login"]
    end

    ADMIN --> E1 & E2 & E3
    CONTRIB --> E1 & E2
    USER --> E1 & E4 & E5
```

| Role | Tanggung Jawab | Hak Akses |
|---|---|---|
| Developer / Admin | Input data resmi, validasi laporan foto | Full (semua endpoint) |
| Kontributor | Laporan tempat baru + foto bukti | Baca + kirim laporan (JWT) |
| Pengguna Umum | Cari tempat, baca rapor, gunakan fitur TTS | Read-Only, tanpa login |

---

## Fitur Utama

**1. Direktori Tempat + Mini-Map**
Pencarian dan filter tempat di Bandung berdasarkan kata kunci atau kategori (mall, kampus, rumah sakit, perkantoran). Setiap halaman detail tempat menyertakan mini-map Leaflet.js yang menampilkan satu titik koordinat lokasi.

**2. Rapor Aksesibilitas**
Setiap tempat memiliki persentase rapor yang dikalkulasi dari checklist fasilitas: ramp kursi roda, toilet ramah disabilitas, jalur guiding block, parkir khusus, pintu lebar/otomatis, dan akses lift.

**3. Fitur Aksesibilitas UI**
Dirancang untuk dapat diakses langsung oleh penyandang disabilitas:
- Text-to-Speech menggunakan Web Speech API untuk membacakan deskripsi tempat
- High Contrast Mode (tampilan hitam-kuning) untuk pengguna low vision
- Font Resizer untuk memperbesar ukuran teks

**4. Form Kontribusi Laporan**
Kontributor dapat mendaftarkan tempat baru dengan mengisi nama, koordinat, kategori, checklist fasilitas, dan foto bukti fisik (wajib).

**5. Panel Verifikasi Admin**
Admin meninjau foto bukti yang diunggah dan memutuskan approve atau reject. Hanya tempat yang disetujui yang tampil di direktori publik.

---

## Cara Menjalankan

### Prasyarat

- Node.js >= 18.x
- MySQL >= 8.x
- npm

### Langkah Instalasi

```bash
# 1. Clone repository
git clone https://github.com/your-org/disacare-bandung.git
cd disacare-bandung

# 2. Install dependensi backend
cd backend && npm install

# 3. Install dependensi frontend
cd ../frontend && npm install
```

### Konfigurasi Environment

```bash
# backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=disacare_db
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
UPLOAD_PATH=./uploads

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_MAP_CENTER_LAT=-6.914744
NEXT_PUBLIC_MAP_CENTER_LNG=107.609810
```

### Inisialisasi Database

```bash
cd backend
mysql -u root -p < src/config/schema.sql
```

### Menjalankan Aplikasi

```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3 (opsional): Mock Server untuk development
cd mock-server && npx json-server db.json --port 3001
```

### URL Akses

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Mock Server | http://localhost:3001 |

---

## Batasan Scope

DisaCare **tidak** menyediakan navigasi rute jalan (turn-by-turn navigation). Fokus aplikasi adalah sebagai direktori informasi kelayakan fasilitas di lokasi tujuan, bukan penunjuk arah.

---

## Dokumentasi Lanjutan

| Dokumen | Deskripsi |
|---|---|
| `docs/prd-frontend.md` | PRD Frontend: halaman, komponen, state management, aksesibilitas UI |
| `docs/prd-backend.md` | PRD Backend: API contract lengkap, SQL schema, service logic |
| `docs/prd-mock-server.md` | PRD Mock Server: struktur db.json, endpoint simulasi |

---

*DisaCare Bandung — Tugas Besar Mata Kuliah Literasi Manusia dan Teknologi*
*Tim: Affifah, Alifya, Al Yasmin, Zahra*
