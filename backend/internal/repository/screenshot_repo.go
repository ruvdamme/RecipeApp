package repository

import (
	"database/sql"
	"recipes-api/internal/models"
)

// GetAllForRecipe returns screenshot metadata (no BLOBs) ordered by position
func GetAllForRecipe(db *sql.DB, recipeID int) ([]models.Screenshot, error) {
	rows, err := db.Query(`
		SELECT id, position FROM screenshots
		WHERE recipe_id = ? ORDER BY position ASC, id ASC
	`, recipeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.Screenshot{}
	for rows.Next() {
		var s models.Screenshot
		rows.Scan(&s.ID, &s.Position)
		list = append(list, s)
	}
	return list, nil
}

// Create adds a new screenshot for a recipe
func CreateScreenshot(db *sql.DB, recipeID int, data []byte, mime string) (int64, error) {
	var maxPos int
	db.QueryRow(
		"SELECT COALESCE(MAX(position), 0) FROM screenshots WHERE recipe_id = ?", recipeID,
	).Scan(&maxPos)

	result, err := db.Exec(`
		INSERT INTO screenshots (recipe_id, data, mime, position) VALUES (?, ?, ?, ?)
	`, recipeID, data, mime, maxPos+1)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// GetData returns the raw bytes and mime for serving
func GetScreenshotData(db *sql.DB, id, recipeID int) ([]byte, string, error) {
	var data []byte
	var mime string
	err := db.QueryRow(
		"SELECT data, mime FROM screenshots WHERE id = ? AND recipe_id = ?", id, recipeID,
	).Scan(&data, &mime)
	return data, mime, err
}

// Delete removes a screenshot
func DeleteScreenshot(db *sql.DB, id, recipeID int) (bool, error) {
	result, err := db.Exec(
		"DELETE FROM screenshots WHERE id = ? AND recipe_id = ?", id, recipeID,
	)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	return rows > 0, nil
}

// ReorderScreenshots updates position for each screenshot id
func ReorderScreenshots(db *sql.DB, recipeID int, ids []int) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	for pos, id := range ids {
		if _, err := tx.Exec(
			"UPDATE screenshots SET position = ? WHERE id = ? AND recipe_id = ?",
			pos, id, recipeID,
		); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}
