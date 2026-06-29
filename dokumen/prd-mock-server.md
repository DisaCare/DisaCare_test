# PRD Mock Server — DisaCare Bandung

**Dokumen:** Product Requirements Document — Mock Server  
**Aplikasi:** DisaCare Bandung  
**Tool:** json-server  
**Port:** 3001  
**Versi:** 1.0.0  
**Tim:** Affifah, Alifya, Al Yasmin, Zahra

---

## Daftar Isi

- [Tujuan Dokumen](#tujuan-dokumen)
- [Kapan Menggunakan Mock Server](#kapan-menggunakan-mock-server)
- [Arsitektur Mock Server](#arsitektur-mock-server)
- [Struktur File](#struktur-file)
- [db.json — Data Placeholder Lengkap](#dbjson--data-placeholder-lengkap)
- [routes.json — Pemetaan Endpoint](#routesjson--pemetaan-endpoint)
- [Cara Menjalankan](#cara-menjalankan)
- [Endpoint yang Tersedia](#endpoint-yang-tersedia)
- [Workflow Development dengan Mock Server](#workflow-development-dengan-mock-server)
- [Skenario Test Frontend](#skenario-test-frontend)

---

## Tujuan Dokumen

Mock Server berfungsi sebagai pengganti sementara backend asli selama pengembangan frontend. Dengan mock server, tim frontend dapat mengembangkan dan menguji tampilan antarmuka secara mandiri tanpa harus menunggu backend selesai dibangun.

---

## Kapan Menggunakan Mock Server

```mermaid
flowchart TD
    A[Tim Frontend mulai pengembangan] --> B{Backend sudah selesai?}
    B -->|Ya| C[Gunakan backend asli\nport 8080]
    B -->|Tidak| D[Gunakan Mock Server\nport 3001]
    D --> E[Ganti NEXT_PUBLIC_API_URL\nke http://localhost:3001]
    E --> F[Develop UI dengan data placeholder]
    F --> G{Backend siap?}
    G -->|Ya| H[Ganti kembali ke port 8080]
    G -->|Tidak| F
```

| Kondisi | Gunakan |
|---|---|
| Backend belum dibuat | Mock Server (port 3001) |
| Backend sedang dikembangkan | Mock Server untuk UI, backend untuk API logic |
| Integrasi frontend-backend | Backend asli (port 8080) |
| Demo atau presentasi tanpa backend | Mock Server |

---

## Arsitektur Mock Server

```mermaid
graph LR
    subgraph FRONTEND["Frontend (Next.js :3000)"]
        FE["Halaman & Komponen"]
    end

    subgraph MOCK["Mock Server (json-server :3001)"]
        ROUTER["routes.json\n(URL mapping)"]
        DATA["db.json\n(Data in-memory)"]
        ROUTER --> DATA
    end

    FE -->|"GET/POST/PATCH"| MOCK
    MOCK -->|"JSON Response"| FE
```

json-server membaca `db.json` sebagai database in-memory dan secara otomatis menyediakan endpoint REST CRUD. Kustomisasi URL dilakukan melalui `routes.json`.

---

## Struktur File

```
mock-server/
├── db.json          -- Data placeholder (places, users, checklists, photos)
├── routes.json      -- Pemetaan URL custom ke resource json-server
└── README.md        -- Instruksi singkat penggunaan mock server
```

---

## db.json — Data Placeholder Lengkap

```json
{
  "places": [
    {
      "id": "place-001",
      "name": "Gedung Sate",
      "category": "kantor_pemerintah",
      "address": "Jl. Diponegoro No.22, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115",
      "latitude": -6.9020,
      "longitude": 107.6186,
      "description": "Gedung bersejarah yang berfungsi sebagai Kantor Gubernur Jawa Barat. Telah dilengkapi ramp, parkir khusus, dan toilet disabilitas.",
      "data_source": "official",
      "is_verified": true,
      "accessibility_score": 83.33,
      "verified_at": "2024-01-10T08:00:00Z",
      "primary_photo": "/mock-photos/gedung-sate.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": true,
        "has_guiding_block": true,
        "has_parking": true,
        "has_wide_door": true,
        "has_elevator": false
      }
    },
    {
      "id": "place-002",
      "name": "Bandung Indah Plaza (BIP)",
      "category": "mall",
      "address": "Jl. Merdeka No.56, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111",
      "latitude": -6.9126,
      "longitude": 107.6100,
      "description": "Pusat perbelanjaan di pusat kota Bandung yang telah menyediakan fasilitas lengkap untuk penyandang disabilitas termasuk lift di setiap lantai.",
      "data_source": "official",
      "is_verified": true,
      "accessibility_score": 100.0,
      "verified_at": "2024-01-12T09:30:00Z",
      "primary_photo": "/mock-photos/bip.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": true,
        "has_guiding_block": true,
        "has_parking": true,
        "has_wide_door": true,
        "has_elevator": true
      }
    },
    {
      "id": "place-003",
      "name": "Universitas Pendidikan Indonesia (UPI)",
      "category": "kampus",
      "address": "Jl. Dr. Setiabudi No.229, Isola, Kec. Sukasari, Kota Bandung, Jawa Barat 40154",
      "latitude": -6.8601,
      "longitude": 107.5930,
      "description": "Kampus utama UPI yang memiliki ramp di beberapa gedung namun masih kekurangan guiding block di beberapa area.",
      "data_source": "official",
      "is_verified": true,
      "accessibility_score": 50.0,
      "verified_at": "2024-01-15T11:00:00Z",
      "primary_photo": "/mock-photos/upi.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": true,
        "has_guiding_block": false,
        "has_parking": true,
        "has_wide_door": false,
        "has_elevator": false
      }
    },
    {
      "id": "place-004",
      "name": "RS Hasan Sadikin Bandung",
      "category": "rumah_sakit",
      "address": "Jl. Pasteur No.38, Pasteur, Kec. Sukajadi, Kota Bandung, Jawa Barat 40161",
      "latitude": -6.8976,
      "longitude": 107.5875,
      "description": "Rumah sakit rujukan utama Jawa Barat dengan fasilitas aksesibilitas yang cukup lengkap.",
      "data_source": "official",
      "is_verified": true,
      "accessibility_score": 83.33,
      "verified_at": "2024-01-20T07:00:00Z",
      "primary_photo": "/mock-photos/rshs.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": true,
        "has_guiding_block": false,
        "has_parking": true,
        "has_wide_door": true,
        "has_elevator": true
      }
    },
    {
      "id": "place-005",
      "name": "Taman Dewi Sartika",
      "category": "taman",
      "address": "Jl. Otto Iskandar Dinata, Balonggede, Kec. Regol, Kota Bandung, Jawa Barat 40252",
      "latitude": -6.9258,
      "longitude": 107.6109,
      "description": "Taman kota yang memiliki jalur pejalan kaki namun masih terbatas fasilitas disabilitasnya.",
      "data_source": "user_contributed",
      "is_verified": true,
      "accessibility_score": 33.33,
      "verified_at": "2024-02-05T14:00:00Z",
      "primary_photo": "/mock-photos/taman-dewi.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": false,
        "has_guiding_block": false,
        "has_parking": false,
        "has_wide_door": true,
        "has_elevator": false
      }
    },
    {
      "id": "place-006",
      "name": "Stasiun Bandung",
      "category": "stasiun",
      "address": "Jl. Stasiun Timur No.1, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40181",
      "latitude": -6.9131,
      "longitude": 107.6390,
      "description": "Stasiun kereta api utama Kota Bandung. Telah memiliki ramp dan jalur guiding block di area peron.",
      "data_source": "official",
      "is_verified": true,
      "accessibility_score": 66.67,
      "verified_at": "2024-02-10T09:00:00Z",
      "primary_photo": "/mock-photos/stasiun-bandung.jpg",
      "checklist": {
        "has_ramp": true,
        "has_disability_toilet": true,
        "has_guiding_block": true,
        "has_parking": false,
        "has_wide_door": true,
        "has_elevator": false
      }
    },
    {
      "id": "place-007-pending",
      "name": "Kedai Kopi Semesta",
      "category": "lainnya",
      "address": "Jl. Trunojoyo No.10, Bandung",
      "latitude": -6.9221,
      "longitude": 107.6072,
      "description": "Kedai kopi dengan pintu lebar dan tempat duduk ramah kursi roda.",
      "data_source": "user_contributed",
      "is_verified": false,
      "accessibility_score": 50.0,
      "verified_at": null,
      "primary_photo": "/mock-photos/kedai-semesta.jpg",
      "checklist": {
        "has_ramp": false,
        "has_disability_toilet": false,
        "has_guiding_block": false,
        "has_parking": false,
        "has_wide_door": true,
        "has_elevator": false
      }
    }
  ],

  "users": [
    {
      "id": "user-admin-001",
      "name": "Admin DisaCare",
      "email": "admin@disacare.id",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": "user-contrib-001",
      "name": "Budi Santoso",
      "email": "budi@mahasiswa.id",
      "role": "contributor",
      "created_at": "2024-01-15T08:30:00Z"
    },
    {
      "id": "user-contrib-002",
      "name": "Siti Rahayu",
      "email": "siti@warga.id",
      "role": "contributor",
      "created_at": "2024-02-01T10:00:00Z"
    }
  ],

  "pending_reports": [
    {
      "id": "place-007-pending",
      "name": "Kedai Kopi Semesta",
      "category": "lainnya",
      "address": "Jl. Trunojoyo No.10, Bandung",
      "created_at": "2024-06-05T14:30:00Z",
      "contributor_name": "Budi Santoso",
      "contributor_email": "budi@mahasiswa.id",
      "proof_photo": "/mock-photos/kedai-semesta.jpg"
    }
  ],

  "auth": [
    {
      "id": "mock-login",
      "email": "contributor@disacare.id",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItY29udHJpYi0wMDEiLCJuYW1lIjoiQnVkaSBTYW50b3NvIiwiZW1haWwiOiJidWRpQG1haGFzaXN3YS5pZCIsInJvbGUiOiJjb250cmlidXRvciIsImlhdCI6MTcxNzY0ODAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.MOCK_SIGNATURE",
      "role": "contributor"
    }
  ]
}
```

---

## routes.json — Pemetaan Endpoint

```json
{
  "/api/places": "/places",
  "/api/places/:id": "/places/:id",
  "/api/places/pending": "/pending_reports",
  "/api/auth/login": "/auth/0",
  "/api/auth/register": "/users"
}
```

Catatan: json-server secara otomatis mendukung operasi GET, POST, PUT, PATCH, DELETE pada setiap resource yang ada di `db.json`.

---

## Cara Menjalankan

### Instalasi

```bash
# Dari root proyek
cd mock-server

# Instal json-server secara global (jika belum)
npm install -g json-server

# Atau sebagai dev dependency di root
npm install --save-dev json-server
```

### Menjalankan Mock Server

```bash
# Cara 1: Langsung dengan json-server
json-server --watch db.json --routes routes.json --port 3001

# Cara 2: Via npm script (tambahkan ke package.json root)
# "scripts": { "mock": "json-server --watch mock-server/db.json --routes mock-server/routes.json --port 3001" }
npm run mock
```

### Konfigurasi Frontend untuk Menggunakan Mock

```bash
# frontend/.env.local — ubah sementara saat menggunakan mock
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Endpoint yang Tersedia

Setelah mock server berjalan di port 3001, endpoint berikut tersedia:

| Method | URL | Keterangan | Respon |
|---|---|---|---|
| GET | /api/places | Semua tempat terverifikasi | Array places |
| GET | /api/places?name_like=gedung | Filter pencarian by nama | Filtered array |
| GET | /api/places?category=kampus | Filter berdasarkan kategori | Filtered array |
| GET | /api/places/:id | Detail satu tempat | Object place |
| POST | /api/places | Tambah tempat baru (simulasi report) | Object baru |
| PATCH | /api/places/:id | Update data tempat (simulasi verify) | Object terupdate |
| GET | /api/places/pending | Antrian laporan admin | Array pending |
| POST | /api/auth/login | Simulasi login | Object token |
| POST | /api/auth/register | Simulasi register | Object user baru |

### Contoh Request via cURL

```bash
# Ambil semua tempat
curl http://localhost:3001/api/places

# Filter berdasarkan kategori
curl "http://localhost:3001/api/places?category=kampus"

# Pencarian by nama
curl "http://localhost:3001/api/places?name_like=gedung"

# Detail satu tempat
curl http://localhost:3001/api/places/place-001

# Simulasi approve laporan
curl -X PATCH http://localhost:3001/api/places/place-007-pending \
  -H "Content-Type: application/json" \
  -d '{"is_verified": true}'
```

---

## Workflow Development dengan Mock Server

```mermaid
sequenceDiagram
    participant FE as Developer Frontend
    participant MOCK as Mock Server :3001
    participant BE as Developer Backend

    Note over FE,BE: Fase Development Paralel

    FE->>MOCK: GET /api/places
    MOCK-->>FE: Data placeholder dari db.json
    FE->>FE: Develop komponen PlaceCard

    FE->>MOCK: GET /api/places/place-001
    MOCK-->>FE: Detail tempat placeholder
    FE->>FE: Develop halaman detail + mini-map

    BE->>BE: Build endpoint backend asli

    Note over FE,BE: Fase Integrasi
    BE-->>FE: Backend siap di port 8080
    FE->>FE: Ganti NEXT_PUBLIC_API_URL ke :8080
    FE->>BE: Uji integrasi nyata
```

---

## Skenario Test Frontend

Gunakan data placeholder berikut untuk menguji tampilan berbagai kondisi di frontend:

### Skenario 1: Tempat Sangat Aksesibel (Score 100%)

Gunakan `place-002` (Bandung Indah Plaza). Semua checklist aktif. ScoreBadge harus menampilkan warna hijau dengan label "Sangat Aksesibel".

### Skenario 2: Tempat Cukup Aksesibel (Score 50-79%)

Gunakan `place-003` (UPI, score 50%) atau `place-006` (Stasiun Bandung, score 66.67%). ScoreBadge harus menampilkan warna kuning dengan label "Cukup Aksesibel".

### Skenario 3: Tempat Perlu Perbaikan (Score < 50%)

Gunakan `place-005` (Taman Dewi Sartika, score 33.33%). ScoreBadge harus menampilkan warna merah dengan label "Perlu Perbaikan".

### Skenario 4: Laporan Menunggu Verifikasi (is_verified: false)

Gunakan `place-007-pending`. Tempat ini tidak boleh muncul di direktori publik, hanya di dashboard admin (`/api/places/pending`).

### Skenario 5: Data Official vs Kontribusi

Bandingkan `data_source: "official"` (place-001 s/d 004, 006) dengan `data_source: "user_contributed"` (place-005, 007) untuk memastikan pembeda visual tampil dengan benar di frontend.

### Skenario 6: Filter dan Pencarian

```bash
# Test filter kategori mall
GET /api/places?category=mall
# Expected: hanya place-002 (BIP)

# Test pencarian nama
GET /api/places?name_like=stasiun
# Expected: hanya place-006

# Test kombinasi
GET /api/places?category=kampus&name_like=upi
# Expected: hanya place-003
```

### Skenario 7: Tampilan Aksesibilitas (TTS + High Contrast)

Buka `/place/place-001` di browser, klik tombol "Dengarkan Informasi". Pastikan browser membacakan:
- Nama tempat: "Gedung Sate"
- Alamat lengkap
- Persentase aksesibilitas: "83 persen"
- Fasilitas tersedia: ramp, toilet disabilitas, guiding block, parkir khusus, pintu lebar

---

## Perbedaan Mock vs Backend Asli

| Aspek | Mock Server | Backend Asli |
|---|---|---|
| Port | 3001 | 8080 |
| Autentikasi JWT | Tidak divalidasi (semua diterima) | Divalidasi ketat |
| Upload foto | Tidak didukung | Didukung |
| Kalkulasi score | Data statis dari db.json | Dikalkulasi dinamis oleh scoring_service |
| Persistensi data | In-memory, reset saat server restart | Tersimpan di MySQL/PostgreSQL |
| Filter/search | Berdasarkan query parameter json-server | Full-text search SQL |
| Role admin | Tidak ada pembedaan role | Middleware role dicek ketat |

---

*Dokumen ini adalah bagian dari DisaCare Bandung — Tugas Besar Mata Kuliah Literasi Manusia dan Teknologi*  
*Tim: Affifah, Alifya, Al Yasmin, Zahra*
