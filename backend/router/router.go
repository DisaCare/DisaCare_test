package router

import (
	"backend/controller"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func SetupRouter(jwtSecret string) *gin.Engine {
	r := gin.Default()

	// Enable CORS
	r.Use(CORSMiddleware())

	// Serve static upload photos
	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		// Auth Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", controller.Register)
			auth.POST("/login", controller.Login)
		}

		// Places Routes
		places := api.Group("/places")
		{
			places.GET("", controller.GetPlaces)
			places.GET("/:id", controller.GetPlaceDetail)

			// Protected routes
			protected := places.Group("")
			protected.Use(middleware.AuthMiddleware(jwtSecret))
			{
				protected.POST("/report", middleware.UploadMiddleware(), controller.ReportPlace)
				
				// Admin only routes
				adminOnly := protected.Group("")
				adminOnly.Use(middleware.RequireAdmin())
				{
					adminOnly.POST("/official", controller.AddOfficialPlace)
					adminOnly.PATCH("/verify/:id", controller.VerifyPlace)
					adminOnly.GET("/pending", controller.GetPendingReports)
				}
			}
		}
	}

	return r
}
