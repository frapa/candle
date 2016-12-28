package kernel

import (
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
)

const (
	SQLITE = 101
)

var db *sql.DB

func init() {
	initDatabase("db.sqlite")
}

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

func GetDriver() int {
	return SQLITE
}

// Some extra goodies which speed up execution of
// import where you have lots of queries.
// Use: simply wrap the code making many writes
// between begin and commit.
// Expect a speedup of more than 100x !!!

func BeginTransaction() {
	GetDb().Exec("BEGIN TRANSACTION;")
}

func CommitTransaction() {
	GetDb().Exec("COMMIT TRANSACTION;")
}
