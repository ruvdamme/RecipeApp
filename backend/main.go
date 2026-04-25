package main

import (
	"fmt"
	"net/http"

	"recipes-api/internal/db"
	"recipes-api/internal/handlers"
)

func enableCors(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Allow your frontend's address
        w.Header().Set("Access-Control-Allow-Origin", "*") 
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        // Handle preflight requests
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        next.ServeHTTP(w, r)
    })
}

func main() {
	db.Init()
	defer db.DB.Close()

	mux := http.NewServeMux()
	handlers.Register(mux)

	fmt.Println("Server running on :8080")
	http.ListenAndServe("127.0.0.1:8080", enableCors(mux))
}
