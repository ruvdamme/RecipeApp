package db

import (
	"database/sql"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init() {
	home, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	dbPath := filepath.Join(home, "recipes.db") + "?_foreign_keys=on"

	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		panic(err)
	}
	if err = DB.Ping(); err != nil {
		panic(err)
	}
	runMigrations(DB)
}