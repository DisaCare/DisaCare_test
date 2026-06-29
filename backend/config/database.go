package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func InitDB() *sql.DB {
	var err error
	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite"
	}

	if driver == "sqlite" {
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "disacare.db"
		}
		log.Printf("Connecting to SQLite database: %s", dbPath)
		DB, err = sql.Open("sqlite", dbPath)
		if err != nil {
			log.Fatalf("Failed to open SQLite database: %v", err)
		}
	} else if driver == "mysql" {
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_NAME"),
		)
		log.Printf("Connecting to MySQL database...")
		DB, err = sql.Open("mysql", dsn)
		if err != nil {
			log.Fatalf("Failed to open MySQL database: %v", err)
		}
	} else {
		log.Fatalf("Unsupported database driver: %s", driver)
	}

	if err = DB.Ping(); err != nil {
		log.Fatalf("Database connection check failed: %v", err)
	}

	log.Println("Database connected successfully!")
	return DB
}
