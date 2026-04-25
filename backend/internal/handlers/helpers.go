package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func pictureURL(r *http.Request, id int) string {
	return fmt.Sprintf("http://%s/recipes/%d/picture", r.Host, id)
}

func screenshotURL(r *http.Request, recipeID, screenshotID int) string {
	return fmt.Sprintf("http://%s/recipes/%d/screenshots/%d", r.Host, recipeID, screenshotID)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	http.Error(w, msg, status)
}
