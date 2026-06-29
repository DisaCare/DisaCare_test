package service

import (
	"backend/config"
	"backend/model"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
)

func GetAllPlaces(searchQuery, categoryFilter string) ([]model.Place, error) {
	query := `
		SELECT p.id, p.name, p.category, p.address, p.latitude, p.longitude, p.description, 
		       p.data_source, p.is_verified, p.verified_at, p.verified_by, p.contributed_by, 
		       p.created_at, p.updated_at,
		       c.has_ramp, c.has_disability_toilet, c.has_guiding_block, c.has_parking, c.has_wide_door, c.has_elevator,
		       (SELECT file_path FROM photo_proofs WHERE place_id = p.id LIMIT 1) AS primary_photo
		FROM places p
		LEFT JOIN accessibility_checklists c ON p.id = c.place_id
		WHERE p.is_verified = 1
	`

	var args []interface{}
	argCount := 1

	if categoryFilter != "" && categoryFilter != "Semua" && categoryFilter != "all" {
		query += fmt.Sprintf(" AND p.category = ?")
		args = append(args, categoryFilter)
		argCount++
	}

	if searchQuery != "" {
		query += fmt.Sprintf(" AND (p.name LIKE ? OR p.address LIKE ?)")
		likeTerm := "%" + searchQuery + "%"
		args = append(args, likeTerm, likeTerm)
	}

	query += " ORDER BY p.created_at DESC"

	rows, err := config.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var places []model.Place
	for rows.Next() {
		var p model.Place
		var c model.Checklist
		var description sql.NullString
		var verifiedAt sql.NullTime
		var verifiedBy sql.NullString
		var contributedBy sql.NullString
		var primaryPhoto sql.NullString

		err := rows.Scan(
			&p.ID, &p.Name, &p.Category, &p.Address, &p.Latitude, &p.Longitude, &description,
			&p.DataSource, &p.IsVerified, &verifiedAt, &verifiedBy, &contributedBy,
			&p.CreatedAt, &p.UpdatedAt,
			&c.HasRamp, &c.HasDisabilityToilet, &c.HasGuidingBlock, &c.HasParking, &c.HasWideDoor, &c.HasElevator,
			&primaryPhoto,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			p.Description = &description.String
		}
		if verifiedAt.Valid {
			p.VerifiedAt = &verifiedAt.Time
		}
		if verifiedBy.Valid {
			p.VerifiedBy = &verifiedBy.String
		}
		if contributedBy.Valid {
			p.ContributedBy = &contributedBy.String
		}
		if primaryPhoto.Valid {
			p.PrimaryPhoto = primaryPhoto.String
		}

		p.Checklist = &c
		p.AccessibilityScore = CalculateScore(c)
		places = append(places, p)
	}

	return places, nil
}

func GetPlaceByID(id string) (*model.Place, error) {
	query := `
		SELECT p.id, p.name, p.category, p.address, p.latitude, p.longitude, p.description, 
		       p.data_source, p.is_verified, p.verified_at, p.verified_by, p.contributed_by, 
		       p.created_at, p.updated_at,
		       c.has_ramp, c.has_disability_toilet, c.has_guiding_block, c.has_parking, c.has_wide_door, c.has_elevator
		FROM places p
		LEFT JOIN accessibility_checklists c ON p.id = c.place_id
		WHERE p.id = ?
	`
	row := config.DB.QueryRow(query, id)

	var p model.Place
	var c model.Checklist
	var description sql.NullString
	var verifiedAt sql.NullTime
	var verifiedBy sql.NullString
	var contributedBy sql.NullString

	err := row.Scan(
		&p.ID, &p.Name, &p.Category, &p.Address, &p.Latitude, &p.Longitude, &description,
		&p.DataSource, &p.IsVerified, &verifiedAt, &verifiedBy, &contributedBy,
		&p.CreatedAt, &p.UpdatedAt,
		&c.HasRamp, &c.HasDisabilityToilet, &c.HasGuidingBlock, &c.HasParking, &c.HasWideDoor, &c.HasElevator,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if description.Valid {
		p.Description = &description.String
	}
	if verifiedAt.Valid {
		p.VerifiedAt = &verifiedAt.Time
	}
	if verifiedBy.Valid {
		p.VerifiedBy = &verifiedBy.String
	}
	if contributedBy.Valid {
		p.ContributedBy = &contributedBy.String
	}
	p.Checklist = &c
	p.AccessibilityScore = CalculateScore(c)

	// Fetch photos
	photoQuery := `SELECT id, place_id, uploaded_by, file_name, file_path, file_size, mime_type, created_at FROM photo_proofs WHERE place_id = ?`
	pRows, err := config.DB.Query(photoQuery, p.ID)
	if err != nil {
		return nil, err
	}
	defer pRows.Close()

	var photos []model.PhotoProof
	for pRows.Next() {
		var ph model.PhotoProof
		var uploader sql.NullString
		err := pRows.Scan(&ph.ID, &ph.PlaceID, &uploader, &ph.FileName, &ph.FilePath, &ph.FileSize, &ph.MimeType, &ph.CreatedAt)
		if err != nil {
			return nil, err
		}
		if uploader.Valid {
			ph.UploadedBy = &uploader.String
		}
		photos = append(photos, ph)
	}
	p.Photos = photos
	if len(photos) > 0 {
		p.PrimaryPhoto = photos[0].FilePath
	}

	return &p, nil
}

func CreateOfficialPlace(p model.Place, c model.Checklist) (string, error) {
	tx, err := config.DB.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	placeID := uuid.New().String()
	now := time.Now()

	placeQuery := `
		INSERT INTO places (id, name, category, address, latitude, longitude, description, data_source, is_verified, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'official', 1, ?, ?)
	`
	_, err = tx.Exec(placeQuery, placeID, p.Name, p.Category, p.Address, p.Latitude, p.Longitude, p.Description, now, now)
	if err != nil {
		return "", err
	}

	checklistID := uuid.New().String()
	checklistQuery := `
		INSERT INTO accessibility_checklists (id, place_id, has_ramp, has_disability_toilet, has_guiding_block, has_parking, has_wide_door, has_elevator, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(checklistQuery, checklistID, placeID, c.HasRamp, c.HasDisabilityToilet, c.HasGuidingBlock, c.HasParking, c.HasWideDoor, c.HasElevator, now, now)
	if err != nil {
		return "", err
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return placeID, nil
}

func CreateReportPlace(p model.Place, c model.Checklist, ph model.PhotoProof) (string, error) {
	tx, err := config.DB.Begin()
	if err != nil {
		return "", err
	}
	defer tx.Rollback()

	placeID := uuid.New().String()
	now := time.Now()

	placeQuery := `
		INSERT INTO places (id, name, category, address, latitude, longitude, description, data_source, is_verified, contributed_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'user_contributed', 0, ?, ?, ?)
	`
	_, err = tx.Exec(placeQuery, placeID, p.Name, p.Category, p.Address, p.Latitude, p.Longitude, p.Description, p.ContributedBy, now, now)
	if err != nil {
		return "", err
	}

	checklistID := uuid.New().String()
	checklistQuery := `
		INSERT INTO accessibility_checklists (id, place_id, has_ramp, has_disability_toilet, has_guiding_block, has_parking, has_wide_door, has_elevator, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(checklistQuery, checklistID, placeID, c.HasRamp, c.HasDisabilityToilet, c.HasGuidingBlock, c.HasParking, c.HasWideDoor, c.HasElevator, now, now)
	if err != nil {
		return "", err
	}

	photoID := uuid.New().String()
	photoQuery := `
		INSERT INTO photo_proofs (id, place_id, uploaded_by, file_name, file_path, file_size, mime_type, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(photoQuery, photoID, placeID, ph.UploadedBy, ph.FileName, ph.FilePath, ph.FileSize, ph.MimeType, now)
	if err != nil {
		return "", err
	}

	err = tx.Commit()
	if err != nil {
		return "", err
	}

	return placeID, nil
}

func VerifyPlace(id string, action string, adminID string) error {
	tx, err := config.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if action == "approve" {
		now := time.Now()
		query := `UPDATE places SET is_verified = 1, verified_at = ?, verified_by = ? WHERE id = ?`
		_, err = tx.Exec(query, now, adminID, id)
		if err != nil {
			return err
		}
	} else if action == "reject" {
		// Fetch file path to delete file from disk
		var filePath string
		err = tx.QueryRow(`SELECT file_path FROM photo_proofs WHERE place_id = ?`, id).Scan(&filePath)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return err
		}

		// Delete from DB (cascade handles photo_proofs & checklists)
		_, err = tx.Exec(`DELETE FROM places WHERE id = ?`, id)
		if err != nil {
			return err
		}

		// Try to delete physical file if path exists
		if filePath != "" {
			// File path is usually /uploads/xxx
			localPath := "." + filePath
			_ = os.Remove(localPath)
		}
	} else {
		return errors.New("invalid status_action")
	}

	return tx.Commit()
}

func GetPendingPlaces() ([]model.Place, error) {
	query := `
		SELECT p.id, p.name, p.category, p.address, p.created_at, u.name, u.email, ph.file_path
		FROM places p
		LEFT JOIN users u ON p.contributed_by = u.id
		LEFT JOIN photo_proofs ph ON p.id = ph.place_id
		WHERE p.is_verified = 0
		ORDER BY p.created_at ASC
	`
	rows, err := config.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var places []model.Place
	for rows.Next() {
		var p model.Place
		var contribName sql.NullString
		var contribEmail sql.NullString
		var photoPath sql.NullString

		err := rows.Scan(&p.ID, &p.Name, &p.Category, &p.Address, &p.CreatedAt, &contribName, &contribEmail, &photoPath)
		if err != nil {
			return nil, err
		}

		if contribName.Valid {
			p.ContributorName = contribName.String
		}
		if contribEmail.Valid {
			p.ContributorEmail = contribEmail.String
		}
		if photoPath.Valid {
			p.PrimaryPhoto = photoPath.String
		}

		places = append(places, p)
	}

	return places, nil
}
