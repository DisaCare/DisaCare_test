package config

import (
	"database/sql"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func MigrateAndSeed(db *sql.DB, driver string) {
	if driver == "sqlite" {
		createSQLiteTables(db)
	}
	// Note: For MySQL, the user can initialize using config/schema.sql as standard procedure

	// Seed users if empty
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		log.Fatalf("Failed to check users count: %v", err)
	}

	if count == 0 {
		seedData(db)
	}
}

func createSQLiteTables(db *sql.DB) {
	log.Println("Initializing SQLite tables...")

	schemas := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id            TEXT PRIMARY KEY,
			name          TEXT NOT NULL,
			email         TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			role          TEXT NOT NULL DEFAULT 'contributor',
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
		);`,

		`CREATE TABLE IF NOT EXISTS places (
			id            TEXT PRIMARY KEY,
			name          TEXT NOT NULL,
			category      TEXT NOT NULL DEFAULT 'lainnya',
			address       TEXT NOT NULL,
			latitude      REAL NOT NULL,
			longitude     REAL NOT NULL,
			description   TEXT,
			data_source   TEXT NOT NULL DEFAULT 'user_contributed',
			is_verified   INTEGER NOT NULL DEFAULT 0,
			verified_at   DATETIME,
			verified_by   TEXT,
			contributed_by TEXT,
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
			FOREIGN KEY (contributed_by) REFERENCES users(id) ON DELETE SET NULL
		);`,

		`CREATE TABLE IF NOT EXISTS accessibility_checklists (
			id                  TEXT PRIMARY KEY,
			place_id            TEXT NOT NULL UNIQUE,
			has_ramp            INTEGER NOT NULL DEFAULT 0,
			has_disability_toilet INTEGER NOT NULL DEFAULT 0,
			has_guiding_block   INTEGER NOT NULL DEFAULT 0,
			has_parking         INTEGER NOT NULL DEFAULT 0,
			has_wide_door       INTEGER NOT NULL DEFAULT 0,
			has_elevator        INTEGER NOT NULL DEFAULT 0,
			created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS photo_proofs (
			id            TEXT PRIMARY KEY,
			place_id      TEXT NOT NULL,
			uploaded_by   TEXT,
			file_name     TEXT NOT NULL,
			file_path     TEXT NOT NULL,
			file_size     INTEGER NOT NULL,
			mime_type     TEXT NOT NULL,
			created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
			FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
		);`,
	}

	for _, schema := range schemas {
		_, err := db.Exec(schema)
		if err != nil {
			log.Fatalf("Failed to execute SQLite DDL schema: %v", err)
		}
	}
	log.Println("SQLite tables initialized.")
}

func seedData(db *sql.DB) {
	log.Println("Seeding demo data...")

	// Hash passwords
	adminHash, _ := bcrypt.GenerateFromPassword([]byte("adminpassword123"), 12)
	contribHash, _ := bcrypt.GenerateFromPassword([]byte("contributorpassword123"), 12)

	now := time.Now()

	// 1. Seed Users
	users := []struct {
		ID   string
		Name string
		Email string
		Hash string
		Role string
	}{
		{"user-admin-001", "Admin DisaCare", "admin@disacare.id", string(adminHash), "admin"},
		{"user-contrib-001", "Budi Santoso", "contributor@disacare.id", string(contribHash), "contributor"},
	}

	for _, u := range users {
		_, err := db.Exec(
			"INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			u.ID, u.Name, u.Email, u.Hash, u.Role, now, now,
		)
		if err != nil {
			log.Fatalf("Failed to seed user %s: %v", u.Email, err)
		}
	}

	// 2. Seed Places, Checklists, and Photo Proofs
	placesData := []struct {
		ID          string
		Name        string
		Category    string
		Address     string
		Lat         float64
		Lng         float64
		Description string
		Source      string
		Verified    int
		Ramp        int
		Toilet      int
		Guiding     int
		Parking     int
		WideDoor    int
		Elevator    int
		PhotoPath   string
	}{
		{
			"place-001", "Paris Van Java Mall", "mall",
			"Jl. Sukajadi No.131-139, Cipedes, Kec. Sukajadi, Kota Bandung, Jawa Barat 40162",
			-6.8893, 107.5959,
			"Paris Van Java (PVJ) dikenal sebagai salah satu pusat perbelanjaan di Bandung yang sangat memperhatikan kenyamanan pengunjung difabel. Mall ini menerapkan konsep open-air dengan jalur pedestrian yang lebar, landai, dan dilengkapi dengan pemandu arah yang jelas.",
			"official", 1, 1, 1, 1, 1, 1, 1,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuCTH7z_5ulfLii4SGwYXArKHZ8YVVuHiW8eIhRNAWYShxTiuRgBBxDR8SO5QXiaS5MgDU5tH72k_63X4Iy9DehNPpogNvmJwnJzSPBACYu552beQEL09P4btHkrV3OJWX1JSk0_j2iV04abqpL0ZNyVHx1Zm7Oz9Lu5ZTZU5tVH5OIB22FtaqwL82zZ5XWcFmSNhIz0G-SVrw6rfCW76Qq0fu8AA2KkjackRWxcjXyqlsRYbVIgqO6-YrrMttFvAeX2e0b559eQJA",
		},
		{
			"place-002", "RS Hasan Sadikin Bandung", "rumah_sakit",
			"Jl. Pasteur No.38, Pasteur, Kec. Sukajadi, Kota Bandung, Jawa Barat 40161",
			-6.8976, 107.5875,
			"Rumah sakit rujukan utama Jawa Barat dengan fasilitas aksesibilitas yang cukup lengkap.",
			"official", 1, 1, 1, 0, 1, 1, 1,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuCindIsDhY1eSFg8ZGiHUi09t_TCOnD2yQ8WXF0npKa7WTGrNYWSup7AeIiHCt0vW9iCMzknM0muTTqfRquDN8bae8eL4-1LTth2t_BPlsGQq4Dnph8H_wCTyNMhzhrZpuXWX70jorc-oACvPq838w8vhzzgSZ_TRU0djS0P2oJTYZMvSpk6t5NWyyT2PHlzsfLRnsQeCNu31fNr471v2l_zRj8-syimMFSDpsVhoMG_OM0UI6WrbuQ8AjLrW7JTv0mmAiENcl5bg",
		},
		{
			"place-003", "Institut Teknologi Bandung", "kampus",
			"Jl. Ganesa No.10, Lb. Siliwangi, Kec. Coblong, Kota Bandung, Jawa Barat 40132",
			-6.8915, 107.6107,
			"Kampus utama ITB yang memiliki ramp di beberapa gedung utama namun masih perlu peningkatan akses guiding block.",
			"official", 1, 1, 1, 0, 1, 0, 0,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuDTZFUI9Y9nrFDZxr6nBNQNi-zzU_Qv5D6VANmkID8LzejzwUPuuC-OrE8WWncC9RaPbHWB0Dv2swTLt2cu4g_1BLAEw3_y6eBvDQRNTcCEF6TUFEMF7tQAJn96Hjwcxxq23ZAmxeOpJBorONGbVQ935s91Usy1idEWlFupcK8b1P4aPjTGf8WV_W0A9KPQtdkz0yOTNya8A-aZFWj1i8APsBpFREAfHjeHDuOcHPCY2JfESqORo1E9N7SyrPd8-A2bRMBt-z0q1g",
		},
		{
			"place-004", "Taman Balai Kota", "taman",
			"Jl. Wastukencana No.2, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40252",
			-6.9147, 107.6098,
			"Taman kota dengan area terbuka hijau. Beberapa spot sudah dilengkapi ramp besi portable dan toilet umum.",
			"official", 1, 1, 0, 0, 0, 1, 0,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuD-lvFY0Qq9rxwEa-GqKnIvDVUOD_wFY5isQH24vDFfnvUgbHxElZlYOGGreIzL-wa1fefobwKaJ-EpsQVUqndgioceqRacBP2WGKEEhM655hKHL0OPOPptbMrP-j8zE_fQGbhziKqfqvw5EXNw542Q2vh-fIeiT_Vp1SoLTOFll7dJKDECntsKDQN9jZqRVaIx4pVuxwkfp-iatbDU3tYx3p7_-GSYPJg1cAPvhSjwGLCqLwYRYUqIUoU4AUUZ66GetWPn0PxCow",
		},
		{
			"place-005", "Gedung Sate", "kantor_pemerintah",
			"Jl. Diponegoro No.22, Citarum, Kec. Bandung Wetan, Kota Bandung, Jawa Barat 40115",
			-6.9020, 107.6186,
			"Gedung bersejarah yang berfungsi sebagai Kantor Gubernur Jawa Barat. Telah dilengkapi ramp dan toilet disabilitas.",
			"official", 1, 1, 1, 1, 1, 1, 0,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuC5AgQHV_yo8_LdqFwqZarkXc_VZ5y3LyRaBM4xUWPHSr373ReUjSrEMxGYBmW_Hxi2LVKvQpW8625-BBYuANb-NMT7Bb-sBoeLm8GDrWQjehe2wTNloXzU2ts7oiGk7DFgRCJ3bTvq5KKUmux15Rz8OfJVwiZoXN9pkmvchyyVUGcWOFJF33qDXd6Qbkb3HRFZFoqxBRFoxS55RGqTOM7z1hclKUAn3YEW-SFXpNr9iPQUHYo5gHsyMLmssvWUoPlhwsys3et8kw",
		},
		{
			"place-006", "Stasiun Bandung", "stasiun",
			"Jl. Stasiun Barat, Kb. Jeruk, Kec. Andir, Kota Bandung, Jawa Barat 40181",
			-6.9131, 107.6015,
			"Stasiun kereta api utama Bandung. Telah memiliki ramp dan jalur guiding block di area peron serta bantuan staf disabilitas.",
			"official", 1, 1, 1, 1, 0, 1, 0,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuDCZRv7vr60GnoG0o6V9_VrdtBjlifP56CavhZEXCUP0KMg8yOUxGh5u4ei7lWpiV2wD57R-dgXNnu6VoT0mRm47pLe9e4BWoH6YkJqGHWS7RaQxobhRxOJdrT1XXQdyvhDj7QMBIcMwmLRTIoYYiEMlGiviJJ6y-sOGm7m6CfofK1JBbmobYuznc7jUcmf-_lS8U2edwg3AptKudwBgqI490keheWQNHc_CesXedpkUG2ntb51U-hn_xaiSaCut5gEqXk_x9EcGg",
		},
		{
			"place-007-pending", "Kedai Kopi Semesta", "lainnya",
			"Jl. Trunojoyo No.10, Bandung",
			-6.9032, 107.6128,
			"Kedai kopi dengan pintu lebar dan tempat duduk ramah kursi roda. Sedang menunggu persetujuan admin.",
			"user_contributed", 0, 1, 0, 1, 1, 0, 0,
			"https://lh3.googleusercontent.com/aida-public/AB6AXuDMosikvaJl4dEKtXK9eUHKefJwSoHZMvcLYXfJypDCmERQROCntAaJO6E61v4EWcj9NZLuqnJ-dw-nPAGwdSlqFEpROuCNdrxZrRqo61R2t45XobrhcX13GiylUIJv0cPBStFezmJn6iSo7sSAQ7sLf_xfESyuEEJNYT05dvf4SNi0_K4cHDJfWkpHUjrU5GtbGsFfFd4iV4LWy32aD8mwvtzFfeHDoJk6ImXKsKJZCbcfuUNUJySF9AFJsltpAwTOgNG2W6btPA",
		},
	}

	for _, p := range placesData {
		// Insert Place
		placeQuery := `
			INSERT INTO places (id, name, category, address, latitude, longitude, description, data_source, is_verified, contributed_by, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		var contribBy *string
		if p.Source == "user_contributed" {
			val := "user-contrib-001"
			contribBy = &val
		}

		_, err := db.Exec(placeQuery, p.ID, p.Name, p.Category, p.Address, p.Lat, p.Lng, p.Description, p.Source, p.Verified, contribBy, now, now)
		if err != nil {
			log.Fatalf("Failed to seed place %s: %v", p.Name, err)
		}

		// Insert Checklist
		checklistID := "chk-" + p.ID
		checklistQuery := `
			INSERT INTO accessibility_checklists (id, place_id, has_ramp, has_disability_toilet, has_guiding_block, has_parking, has_wide_door, has_elevator, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		_, err = db.Exec(checklistQuery, checklistID, p.ID, p.Ramp, p.Toilet, p.Guiding, p.Parking, p.WideDoor, p.Elevator, now, now)
		if err != nil {
			log.Fatalf("Failed to seed checklist for %s: %v", p.Name, err)
		}

		// Insert Photo Proof
		photoID := "photo-" + p.ID
		photoQuery := `
			INSERT INTO photo_proofs (id, place_id, uploaded_by, file_name, file_path, file_size, mime_type, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`
		var uploaderID *string = nil
		if p.Source == "user_contributed" {
			val := "user-contrib-001"
			uploaderID = &val
		}
		_, err = db.Exec(photoQuery, photoID, p.ID, uploaderID, p.Name+".jpg", p.PhotoPath, 102400, "image/jpeg", now)
		if err != nil {
			log.Fatalf("Failed to seed photo proof for %s: %v", p.Name, err)
		}
	}

	log.Println("Demo data seeded successfully.")
}
