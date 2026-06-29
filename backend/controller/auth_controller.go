package controller

import (
	"backend/config"
	"backend/model"
	"backend/service"
	"database/sql"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Validasi gagal: " + err.Error()})
		return
	}

	// Check if email already registered
	var existingID string
	err := config.DB.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existingID)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Email sudah terdaftar"})
		return
	} else if !errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Kesalahan basis data: " + err.Error()})
		return
	}

	// Hash password
	hashedPass, err := service.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal memproses kata sandi"})
		return
	}

	userID := uuid.New().String()
	now := time.Now()

	// Insert into DB
	_, err = config.DB.Exec(
		"INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, 'contributor', ?, ?)",
		userID, req.Name, req.Email, hashedPass, now, now,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membuat pengguna: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Akun berhasil dibuat",
		"data": gin.H{
			"id":    userID,
			"name":  req.Name,
			"email": req.Email,
			"role":  "contributor",
		},
	})
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Validasi gagal: " + err.Error()})
		return
	}

	// Fetch user from DB
	var u model.User
	err := config.DB.QueryRow(
		"SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
		req.Email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.PasswordHash, &u.Role)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Email atau password salah"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Kesalahan basis data: " + err.Error()})
		return
	}

	// Check password
	if !service.CheckPasswordHash(req.Password, u.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"status": "error", "message": "Email atau password salah"})
		return
	}

	// Generate JWT Token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "disacare-secret-key-12345678"
	}

	token, err := service.GenerateToken(u.ID, u.Name, u.Email, u.Role, jwtSecret, 24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membuat sesi token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Login berhasil",
		"data": gin.H{
			"token": token,
			"user": gin.H{
				"id":    u.ID,
				"name":  u.Name,
				"email": u.Email,
				"role":  u.Role,
			},
		},
	})
}
