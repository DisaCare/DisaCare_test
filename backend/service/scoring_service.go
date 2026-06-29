package service

import "backend/model"

func CalculateScore(checklist model.Checklist) float64 {
	totalFields := 6.0
	fulfilled := 0.0

	if checklist.HasRamp {
		fulfilled++
	}
	if checklist.HasDisabilityToilet {
		fulfilled++
	}
	if checklist.HasGuidingBlock {
		fulfilled++
	}
	if checklist.HasParking {
		fulfilled++
	}
	if checklist.HasWideDoor {
		fulfilled++
	}
	if checklist.HasElevator {
		fulfilled++
	}

	score := (fulfilled / totalFields) * 100.0
	return score
}

func GetScoreLabel(score float64) string {
	if score >= 80.0 {
		return "Sangat Aksesibel"
	}
	if score >= 50.0 {
		return "Cukup Aksesibel"
	}
	return "Perlu Perbaikan"
}
