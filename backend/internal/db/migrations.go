package db

import "database/sql"

func runMigrations(db *sql.DB) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS recipes (
			id       INTEGER PRIMARY KEY AUTOINCREMENT,
			name     TEXT    NOT NULL,
			notes    TEXT,
			url      TEXT,
			picture  BLOB,
			mime     TEXT,
			position INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS screenshots (
			id        INTEGER PRIMARY KEY AUTOINCREMENT,
			recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
			data      BLOB    NOT NULL,
			mime      TEXT    NOT NULL,
			position  INTEGER NOT NULL DEFAULT 0
		);
	`)
	if err != nil {
		panic(err)
	}
}
