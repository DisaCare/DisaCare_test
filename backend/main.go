package main

import (
	"backend/config"
	"backend/router"
	"bufio"
	"log"
	"os"
	"strings"
)

func loadEnv() {
	file, err := os.Open(".env")
	if err != nil {
		log.Println(".env file not found, using system environment variables and default values")
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		// Remove quotes if present
		if (strings.HasPrefix(val, "\"") && strings.HasSuffix(val, "\"")) ||
			(strings.HasPrefix(val, "'") && strings.HasSuffix(val, "'")) {
			val = val[1 : len(val)-1]
		}

		os.Setenv(key, val)
	}

	if err := scanner.Err(); err != nil {
		log.Printf("Error reading .env file: %v", err)
	}
}

func main() {
	loadEnv()

	// Initialize Database
	db := config.InitDB()
	defer db.Close()

	driver := os.Getenv("DB_DRIVER")
	if driver == "" {
		driver = "sqlite"
	}

	// Migrate and seed database
	config.MigrateAndSeed(db, driver)

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "disacare-secret-key-12345678"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := router.SetupRouter(jwtSecret)

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
