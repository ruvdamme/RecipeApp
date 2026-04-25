package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"recipes-api/internal/db"
	"recipes-api/internal/repository"
)

// POST /recipes/{id}/screenshots
func screenshotsHandler(w http.ResponseWriter, r *http.Request, recipeID int) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	file, header, err := r.FormFile("screenshot")
	if err != nil {
		writeError(w, http.StatusBadRequest, "No screenshot provided")
		return
	}
	defer file.Close()

	data, _ := io.ReadAll(file)
	mime := header.Header.Get("Content-Type")

	id, err := repository.CreateScreenshot(db.DB, recipeID, data, mime)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"id":  id,
		"url": screenshotURL(r, recipeID, int(id)),
	})
}

// GET /recipes/{id}/screenshots/{sid}    DELETE /recipes/{id}/screenshots/{sid}
func screenshotHandler(w http.ResponseWriter, r *http.Request, recipeID, screenshotID int) {
	switch r.Method {
	case http.MethodGet:
		data, mime, err := repository.GetScreenshotData(db.DB, screenshotID, recipeID)
		if err != nil || data == nil {
			writeError(w, http.StatusNotFound, "Screenshot not found")
			return
		}
		w.Header().Set("Content-Type", mime)
		w.Write(data)

	case http.MethodDelete:
		found, err := repository.DeleteScreenshot(db.DB, screenshotID, recipeID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "DB error")
			return
		}
		if !found {
			writeError(w, http.StatusNotFound, "Screenshot not found")
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// POST /recipes/{id}/screenshots/reorder
func reorderScreenshotsHandler(w http.ResponseWriter, r *http.Request, recipeID int) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var body struct {
		IDs []int `json:"ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.IDs) == 0 {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if err := repository.ReorderScreenshots(db.DB, recipeID, body.IDs); err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
