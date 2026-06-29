package model

import "time"

type Checklist struct {
	ID                  string    `json:"id"`
	PlaceID             string    `json:"place_id"`
	HasRamp             bool      `json:"has_ramp"`
	HasDisabilityToilet bool      `json:"has_disability_toilet"`
	HasGuidingBlock     bool      `json:"has_guiding_block"`
	HasParking          bool      `json:"has_parking"`
	HasWideDoor         bool      `json:"has_wide_door"`
	HasElevator         bool      `json:"has_elevator"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
