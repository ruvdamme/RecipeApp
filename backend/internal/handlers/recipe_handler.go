package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"recipes-api/internal/db"
	"recipes-api/internal/repository"
)

// GET /recipes          POST /recipes
func recipesHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getAllRecipes(w, r)
	case http.MethodPost:
		createRecipe(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// GET /recipes/{id}     DELETE /recipes/{id}
func recipeHandler(w http.ResponseWriter, r *http.Request, id int) {
	switch r.Method {
	case http.MethodGet:
		getRecipe(w, r, id)
	case http.MethodDelete:
		deleteRecipe(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getAllRecipes(w http.ResponseWriter, r *http.Request) {
	list, err := repository.GetAll(db.DB)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	for i, recipe := range list {
		if recipe.PictureURL != "" {
			list[i].PictureURL = pictureURL(r, recipe.ID)
		}
	}
	writeJSON(w, http.StatusOK, list)
}

func getRecipe(w http.ResponseWriter, r *http.Request, id int) {
	recipe, hasPicture, err := repository.GetByID(db.DB, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	if recipe == nil {
		writeError(w, http.StatusNotFound, "Recipe not found")
		return
	}
	if hasPicture {
		recipe.PictureURL = pictureURL(r, id)
	}
	screenshots, _ := repository.GetAllForRecipe(db.DB, id)
	for i, s := range screenshots {
		screenshots[i].URL = screenshotURL(r, id, s.ID)
	}
	recipe.Screenshots = screenshots
	writeJSON(w, http.StatusOK, recipe)
}

func createRecipe(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		writeError(w, http.StatusBadRequest, "Failed to parse form")
		return
	}

	name := r.FormValue("name")
	notes := r.FormValue("notes")
	url := r.FormValue("url")
	var pictureData []byte
	var mime string

	file, header, err := r.FormFile("picture")
	if err == nil {
		defer file.Close()
		pictureData, _ = io.ReadAll(file)
		mime = header.Header.Get("Content-Type")
	}

	id, err := repository.Create(db.DB, name, notes, url, pictureData, mime)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}

	recipe, hasPicture, _ := repository.GetByID(db.DB, int(id))
	if hasPicture {
		recipe.PictureURL = pictureURL(r, int(id))
	}
	writeJSON(w, http.StatusCreated, recipe)
}

func deleteRecipe(w http.ResponseWriter, r *http.Request, id int) {
	found, err := repository.Delete(db.DB, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "Recipe not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PATCH /recipes/{id}/name
func nameHandler(w http.ResponseWriter, r *http.Request, id int) {
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if err := repository.UpdateName(db.DB, id, body.Name); err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PATCH /recipes/{id}/notes
func notesHandler(w http.ResponseWriter, r *http.Request, id int) {
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var body struct {
		Notes string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if err := repository.UpdateNotes(db.DB, id, body.Notes); err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PATCH /recipes/{id}/url
func urlHandler(w http.ResponseWriter, r *http.Request, id int) {
	if r.Method != http.MethodPatch {
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}
	var body struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid body")
		return
	}
	if err := repository.UpdateURL(db.DB, id, body.URL); err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PUT /recipes/{id}/picture    DELETE /recipes/{id}/picture
func pictureHandler(w http.ResponseWriter, r *http.Request, id int) {
	switch r.Method {
	case http.MethodGet:
		data, mime, err := repository.GetPicture(db.DB, id)
		if err != nil || data == nil {
			writeError(w, http.StatusNotFound, "No picture found")
			return
		}
		w.Header().Set("Content-Type", mime)
		w.Write(data)

	case http.MethodPut:
		if err := r.ParseMultipartForm(10 << 20); err != nil {
			writeError(w, http.StatusBadRequest, "Failed to parse form")
			return
		}
		file, header, err := r.FormFile("picture")
		if err != nil {
			writeError(w, http.StatusBadRequest, "No picture provided")
			return
		}
		defer file.Close()
		data, _ := io.ReadAll(file)
		mime := header.Header.Get("Content-Type")
		if err := repository.UpdatePicture(db.DB, id, data, mime); err != nil {
			writeError(w, http.StatusInternalServerError, "DB error")
			return
		}
		w.WriteHeader(http.StatusNoContent)

	case http.MethodDelete:
		if err := repository.DeletePicture(db.DB, id); err != nil {
			writeError(w, http.StatusInternalServerError, "DB error")
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		writeError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

// POST /recipes/reorder
func reorderRecipeHandler(w http.ResponseWriter, r *http.Request) {
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
	if err := repository.Reorder(db.DB, body.IDs); err != nil {
		writeError(w, http.StatusInternalServerError, "DB error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
