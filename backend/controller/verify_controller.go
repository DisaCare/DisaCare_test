package controller

import (
	"backend/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type VerifyRequest struct {
	StatusAction string `json:"status_action" binding:"required"`
}

func VerifyPlace(c *gin.Context) {
	id := c.Param("id")
	var req VerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Validasi gagal: status_action harus 'approve' atau 'reject'"})
		return
	}

	if req.StatusAction != "approve" && req.StatusAction != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "status_action harus bernilai 'approve' atau 'reject'"})
		return
	}

	adminID := c.GetString("userID")

	err := service.VerifyPlace(id, req.StatusAction, adminID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal memproses verifikasi tempat: " + err.Error()})
		return
	}

	if req.StatusAction == "approve" {
		c.JSON(http.StatusOK, gin.H{
			"status":  "updated",
			"message": "Laporan berhasil disetujui dan kini tampil di direktori publik",
			"data": gin.H{
				"id":                         id,
				"is_verified":                true,
				"verified_at":                time.Now(),
				"current_verification_state": "approved",
			},
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"status":  "updated",
			"message": "Laporan ditolak dan dihapus dari sistem",
			"data": gin.H{
				"id":                         id,
				"current_verification_state": "rejected",
			},
		})
	}
}

func GetPendingReports(c *gin.Context) {
	places, err := service.GetPendingPlaces()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil data laporan tertunda: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   places,
		"meta": gin.H{
			"total_pending": len(places),
		},
	})
}
