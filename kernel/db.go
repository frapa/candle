package kernel

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func initDatabase(file string) {
	db_, err := sql.Open("sqlite3", file)
	if err != nil {
		panic(err.Error())
	}
	db = db_
}

func GetDb() *sql.DB {
	return db
}
