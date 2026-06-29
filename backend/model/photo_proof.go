package model

import "time"

type PhotoProof struct {
	ID        string    `json:"id"`
	PlaceID   string    `json:"place_id"`
	UploadedBy *string   `json:"uploaded_by,omitempty"`
	FileName  string    `json:"file_name"`
	FilePath  string    `json:"file_path"`
	FileSize  int64     `json:"file_size"`
	MimeType  string    `json:"mime_type"`
	CreatedAt time.Time `json:"created_at"`
}
