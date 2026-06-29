package middleware

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		file, err := c.FormFile("image_proof")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Foto bukti fisik wajib diunggah"})
			c.Abort()
			return
		}

		// Validasi ukuran (maks 5MB)
		if file.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Ukuran file maksimal 5MB"})
			c.Abort()
			return
		}

		// Validasi ekstensi
		ext := strings.ToLower(filepath.Ext(file.Filename))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Format file tidak diizinkan. Hanya jpg, jpeg, dan png"})
			c.Abort()
			return
		}

		// Generate nama file baru dengan UUID
		newFilename := uuid.New().String() + ext
		c.Set("uploadFilename", newFilename)
		c.Set("uploadFileHeader", file)
		c.Next()
	}
}
