package model

import "time"

type Place struct {
	ID                 string               `json:"id"`
	Name               string               `json:"name"`
	Category           string               `json:"category"`
	Address            string               `json:"address"`
	Latitude           float64              `json:"latitude"`
	Longitude          float64              `json:"longitude"`
	Description        *string              `json:"description,omitempty"`
	DataSource         string               `json:"data_source"`
	IsVerified         bool                 `json:"is_verified"`
	VerifiedAt         *time.Time           `json:"verified_at,omitempty"`
	VerifiedBy         *string              `json:"verified_by,omitempty"`
	ContributedBy      *string              `json:"contributed_by,omitempty"`
	CreatedAt          time.Time            `json:"created_at"`
	UpdatedAt          time.Time            `json:"updated_at"`
	AccessibilityScore float64              `json:"accessibility_score"`
	PrimaryPhoto       string               `json:"primary_photo,omitempty"`
	Checklist          *Checklist           `json:"checklist,omitempty"`
	Photos             []PhotoProof         `json:"photos,omitempty"`
	ContributorName    string               `json:"contributor_name,omitempty"`
	ContributorEmail   string               `json:"contributor_email,omitempty"`
}
