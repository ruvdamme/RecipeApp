package models

type Screenshot struct {
	ID       int    `json:"id"`
	URL      string `json:"url"`
	Position int    `json:"position"`
}

type Recipe struct {
	ID          int          `json:"id"`
	Name        string       `json:"name"`
	Notes       string       `json:"notes,omitempty"`
	URL         string       `json:"url,omitempty"`
	PictureURL  string       `json:"picture,omitempty"`
	Position    int          `json:"position"`
	Screenshots []Screenshot `json:"screenshots,omitempty"`
}

// RecipeSummary is used for getAll — no screenshots
type RecipeSummary struct {
	ID         int    `json:"id"`
	Name       string `json:"name"`
	PictureURL string `json:"picture,omitempty"`
	Position   int    `json:"position"`
}
