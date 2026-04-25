package repository

import (
	"database/sql"
	"recipes-api/internal/models"
)

// GetAll returns all recipes ordered by position, no screenshots
func GetAll(db *sql.DB) ([]models.RecipeSummary, error) {
	rows, err := db.Query(`
		SELECT id, name, picture IS NOT NULL, position
		FROM recipes
		ORDER BY position ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.RecipeSummary{}
	for rows.Next() {
		var r models.RecipeSummary
		var hasPicture bool
		rows.Scan(&r.ID, &r.Name, &hasPicture, &r.Position)
		if hasPicture {
			r.PictureURL = "__picture__" // replaced by handler with full URL
		}
		list = append(list, r)
	}
	return list, nil
}

// GetByID returns a single recipe without screenshots (handler fetches those separately)
func GetByID(db *sql.DB, id int) (*models.Recipe, bool, error) {
	var r models.Recipe
	var hasPicture bool
	err := db.QueryRow(`
		SELECT id, name, COALESCE(notes,''), COALESCE(url,''), picture IS NOT NULL, position
		FROM recipes WHERE id = ?
	`, id).Scan(&r.ID, &r.Name, &r.Notes, &r.URL, &hasPicture, &r.Position)
	if err == sql.ErrNoRows {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	return &r, hasPicture, nil
}

// Create inserts a new recipe and returns the new ID
func Create(db *sql.DB, name, notes, url string, picture []byte, mime string) (int64, error) {
	var maxPos int
	db.QueryRow("SELECT COALESCE(MAX(position), 0) FROM recipes").Scan(&maxPos)

	result, err := db.Exec(`
		INSERT INTO recipes (name, notes, url, picture, mime, position)
		VALUES (?, ?, ?, ?, ?, ?)
	`, name, notes, url, picture, mime, maxPos+1)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

// UpdateName updates only the name
func UpdateName(db *sql.DB, id int, name string) error {
	_, err := db.Exec("UPDATE recipes SET name = ? WHERE id = ?", name, id)
	return err
}

// UpdateNotes updates only the notes
func UpdateNotes(db *sql.DB, id int, notes string) error {
	_, err := db.Exec("UPDATE recipes SET notes = ? WHERE id = ?", notes, id)
	return err
}

// UpdateURL updates only the url
func UpdateURL(db *sql.DB, id int, url string) error {
	_, err := db.Exec("UPDATE recipes SET url = ? WHERE id = ?", url, id)
	return err
}

// UpdatePicture updates the picture BLOB
func UpdatePicture(db *sql.DB, id int, picture []byte, mime string) error {
	_, err := db.Exec("UPDATE recipes SET picture = ?, mime = ? WHERE id = ?", picture, mime, id)
	return err
}

// DeletePicture removes the picture from a recipe
func DeletePicture(db *sql.DB, id int) error {
	_, err := db.Exec("UPDATE recipes SET picture = NULL, mime = NULL WHERE id = ?", id)
	return err
}

// Delete removes a recipe (screenshots cascade)
func Delete(db *sql.DB, id int) (bool, error) {
	result, err := db.Exec("DELETE FROM recipes WHERE id = ?", id)
	if err != nil {
		return false, err
	}
	rows, _ := result.RowsAffected()
	return rows > 0, nil
}

// Reorder updates position for each id in the given order
func Reorder(db *sql.DB, ids []int) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	for pos, id := range ids {
		if _, err := tx.Exec("UPDATE recipes SET position = ? WHERE id = ?", pos, id); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

// GetPicture returns the raw picture bytes and mime type
func GetPicture(db *sql.DB, id int) ([]byte, string, error) {
	var data []byte
	var mime string
	err := db.QueryRow(
		"SELECT picture, COALESCE(mime, 'image/jpeg') FROM recipes WHERE id = ?", id,
	).Scan(&data, &mime)
	return data, mime, err
}
