package main

import (
	"fmt"
	"net/http"

	"recipes-api/internal/db"
	"recipes-api/internal/handlers"
)

func main() {
	db.Init()
	defer db.DB.Close()

	mux := http.NewServeMux()
	handlers.Register(mux)

	fmt.Println("Server running on :8080")
	http.ListenAndServe("127.0.0.1:8080", mux)
}
