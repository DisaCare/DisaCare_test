-- ============================================================
-- DisaCare Bandung — Database Schema
-- Engine: MySQL 8.x
-- Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS disacare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE disacare_db;

-- ------------------------------------------------------------
-- Tabel: users
-- Menyimpan data akun kontributor dan admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  name          VARCHAR(100)    NOT NULL,
  email         VARCHAR(150)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('admin', 'contributor') NOT NULL DEFAULT 'contributor',
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_users_email (email),
  INDEX idx_users_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- Tabel: places
-- Menyimpan data tempat resmi maupun kontribusi komunitas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  name          VARCHAR(200)    NOT NULL,
  category      ENUM(
                  'mall',
                  'kampus',
                  'rumah_sakit',
                  'kantor_pemerintah',
                  'taman',
                  'stasiun',
                  'lainnya'
                ) NOT NULL DEFAULT 'lainnya',
  address       TEXT            NOT NULL,
  latitude      DECIMAL(10, 8)  NOT NULL,
  longitude     DECIMAL(11, 8)  NOT NULL,
  description   TEXT            NULL,
  data_source   ENUM('official', 'user_contributed') NOT NULL DEFAULT 'user_contributed',
  is_verified   TINYINT(1)      NOT NULL DEFAULT 0,
  verified_at   TIMESTAMP       NULL DEFAULT NULL,
  verified_by   CHAR(36)        NULL DEFAULT NULL,
  contributed_by CHAR(36)       NULL DEFAULT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_places_category    (category),
  INDEX idx_places_is_verified (is_verified),
  INDEX idx_places_data_source (data_source),
  FULLTEXT INDEX ft_places_name_address (name, address),

  CONSTRAINT fk_places_verified_by
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_places_contributed_by
    FOREIGN KEY (contributed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- Tabel: accessibility_checklists
-- Menyimpan detail checklist fasilitas per tempat (one-to-one)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accessibility_checklists (
  id                  CHAR(36)    NOT NULL DEFAULT (UUID()),
  place_id            CHAR(36)    NOT NULL UNIQUE,
  has_ramp            TINYINT(1)  NOT NULL DEFAULT 0  COMMENT 'Ramp / jalur landai kursi roda',
  has_disability_toilet TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Toilet ramah disabilitas',
  has_guiding_block   TINYINT(1)  NOT NULL DEFAULT 0  COMMENT 'Jalur pemandu tunanetra',
  has_parking         TINYINT(1)  NOT NULL DEFAULT 0  COMMENT 'Area parkir khusus disabilitas',
  has_wide_door       TINYINT(1)  NOT NULL DEFAULT 0  COMMENT 'Pintu otomatis atau lebar',
  has_elevator        TINYINT(1)  NOT NULL DEFAULT 0  COMMENT 'Lift atau akses vertikal',
  created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_checklist_place_id (place_id),

  CONSTRAINT fk_checklist_place
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- Tabel: photo_proofs
-- Menyimpan metadata foto bukti fisik per tempat (one-to-many)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photo_proofs (
  id            CHAR(36)        NOT NULL DEFAULT (UUID()),
  place_id      CHAR(36)        NOT NULL,
  uploaded_by   CHAR(36)        NULL,
  file_name     VARCHAR(255)    NOT NULL,
  file_path     VARCHAR(500)    NOT NULL,
  file_size     INT UNSIGNED    NOT NULL COMMENT 'Ukuran file dalam bytes',
  mime_type     VARCHAR(50)     NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX idx_photo_place_id (place_id),

  CONSTRAINT fk_photo_place
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
  CONSTRAINT fk_photo_uploader
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
