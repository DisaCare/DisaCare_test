package controller

import (
	"backend/model"
	"backend/service"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateOfficialRequest struct {
	Name        string          `json:"name" binding:"required"`
	Category    string          `json:"category" binding:"required"`
	Address     string          `json:"address" binding:"required"`
	Latitude    float64         `json:"latitude" binding:"required"`
	Longitude   float64         `json:"longitude" binding:"required"`
	Description string          `json:"description"`
	Checklist   model.Checklist `json:"checklist" binding:"required"`
}

func GetPlaces(c *gin.Context) {
	searchQuery := c.Query("search_query")
	categoryFilter := c.Query("category_filter")

	places, err := service.GetAllPlaces(searchQuery, categoryFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil data tempat: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   places,
		"meta": gin.H{
			"total":           len(places),
			"search_query":    searchQuery,
			"category_filter": categoryFilter,
		},
	})
}

func GetPlaceDetail(c *gin.Context) {
	id := c.Param("id")

	place, err := service.GetPlaceByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil detail tempat: " + err.Error()})
		return
	}

	if place == nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Tempat tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   place,
	})
}

func AddOfficialPlace(c *gin.Context) {
	var req CreateOfficialRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Validasi gagal: " + err.Error()})
		return
	}

	place := model.Place{
		Name:      req.Name,
		Category:  req.Category,
		Address:   req.Address,
		Latitude:  req.Latitude,
		Longitude: req.Longitude,
	}
	if req.Description != "" {
		place.Description = &req.Description
	}

	placeID, err := service.CreateOfficialPlace(place, req.Checklist)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menyimpan tempat resmi: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Data tempat resmi berhasil ditambahkan",
		"data": gin.H{
			"id":                  placeID,
			"name":                req.Name,
			"accessibility_score": service.CalculateScore(req.Checklist),
			"is_verified":         true,
			"data_source":         "official",
		},
	})
}

func ReportPlace(c *gin.Context) {
	// Parse fields
	placeName := c.PostForm("place_name")
	category := c.PostForm("category")
	address := c.PostForm("address")
	desc := c.PostForm("description")
	latStr := c.PostForm("latitude")
	lngStr := c.PostForm("longitude")

	if placeName == "" || category == "" || address == "" || latStr == "" || lngStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Field nama, kategori, alamat, latitude, dan longitude wajib diisi"})
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Format latitude tidak valid"})
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Format longitude tidak valid"})
		return
	}

	// Parse checklists
	hasRamp := c.PostForm("has_ramp") == "true"
	hasToilet := c.PostForm("has_disability_toilet") == "true"
	hasGuidingBlock := c.PostForm("has_guiding_block") == "true"
	hasParking := c.PostForm("has_parking") == "true"
	hasWideDoor := c.PostForm("has_wide_door") == "true"
	hasElevator := c.PostForm("has_elevator") == "true"

	// Fetch file from context (injected by UploadMiddleware)
	filenameVal, existsName := c.Get("uploadFilename")
	headerVal, existsHeader := c.Get("uploadFileHeader")

	if !existsName || !existsHeader {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "File bukti wajib diunggah"})
		return
	}

	filename := filenameVal.(string)
	fileHeader := headerVal.(*multipart.FileHeader)

	// Save file to disk
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membuat folder unggahan"})
		return
	}

	localFilePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(fileHeader, localFilePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menyimpan file: " + err.Error()})
		return
	}

	// Web-accessible file path
	webFilePath := fmt.Sprintf("/uploads/%s", filename)

	// Uploader info
	userID := c.GetString("userID")

	place := model.Place{
		Name:          placeName,
		Category:      category,
		Address:       address,
		Latitude:      lat,
		Longitude:     lng,
		ContributedBy: &userID,
	}
	if desc != "" {
		place.Description = &desc
	}

	checklist := model.Checklist{
		HasRamp:             hasRamp,
		HasDisabilityToilet: hasToilet,
		HasGuidingBlock:     hasGuidingBlock,
		HasParking:          hasParking,
		HasWideDoor:         hasWideDoor,
		HasElevator:         hasElevator,
	}

	photo := model.PhotoProof{
		UploadedBy: &userID,
		FileName:   filename,
		FilePath:   webFilePath,
		FileSize:   fileHeader.Size,
		MimeType:   fileHeader.Header.Get("Content-Type"),
	}

	placeID, err := service.CreateReportPlace(place, checklist, photo)
	if err != nil {
		// Cleanup saved file on database transaction failure
		_ = os.Remove(localFilePath)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal menyimpan laporan ke basis data: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Laporan tempat berhasil disimpan, menunggu validasi foto oleh admin",
		"data": gin.H{
			"id":          placeID,
			"name":        placeName,
			"is_verified": false,
			"data_source": "user_contributed",
		},
	})
}
