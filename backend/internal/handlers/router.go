package handlers

/*
Method			Path								Description
================================================================================
GET				/recipes							All recipes (no screenshots)
POST			/recipes							Create recipe
GET				/recipes/{id}						Get recipe with screenshots
DELETE			/recipes/{id}						Delete recipe
POST			/recipes/reorder					Reorder recipes
PATCH			/recipes/{id}/name					Update name
PATCH			/recipes/{id}/notes					Update notes
PATCH			/recipes/{id}/url					Update url
GET				/recipes/{id}/picture				Get picture
PUT				/recipes/{id}/picture				Replace picture
DELETE			/recipes/{id}/picture				Delete picture
POST			/recipes/{id}/screenshots			Add screenshot
GET				/recipes/{id}/screenshots/{sid}		Get screenshot
DELETE			/recipes/{id}/screenshots/{sid}		Delete screenshot
POST			/recipes/{id}/screenshots/reorder	Reorder screenshots
===============================================================================
*/

import (
	"net/http"
	"strconv"
	"strings"
)

func Register(mux *http.ServeMux) {
	mux.HandleFunc("/recipes", recipesHandler)
	mux.HandleFunc("/recipes/", recipeRouter)
}

// recipeRouter dispatches all /recipes/* paths
func recipeRouter(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/recipes/")
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// /recipes/reorder
	if parts[0] == "reorder" {
		reorderRecipeHandler(w, r)
		return
	}

	// /recipes/{id}/...
	recipeID, err := strconv.Atoi(parts[0])
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid recipe ID")
		return
	}

	// /recipes/{id}
	if len(parts) == 1 {
		recipeHandler(w, r, recipeID)
		return
	}

	switch parts[1] {
	case "picture":
		pictureHandler(w, r, recipeID)
	case "name":
		nameHandler(w, r, recipeID)
	case "notes":
		notesHandler(w, r, recipeID)
	case "url":
		urlHandler(w, r, recipeID)
	case "screenshots":
		if len(parts) == 2 {
			screenshotsHandler(w, r, recipeID)
		} else if len(parts) == 3 && parts[2] == "reorder" {
			reorderScreenshotsHandler(w, r, recipeID)
		} else if len(parts) == 3 {
			screenshotID, err := strconv.Atoi(parts[2])
			if err != nil {
				writeError(w, http.StatusBadRequest, "Invalid screenshot ID")
				return
			}
			screenshotHandler(w, r, recipeID, screenshotID)
		}
	default:
		writeError(w, http.StatusNotFound, "Not found")
	}
}
