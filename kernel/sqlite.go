package kernel

// SQLite specific functions

func GetSqliteDbTables() []string {
	rows, err := GetDb().Query("SELECT name FROM sqlite_master WHERE type='table'")
	if err != nil {
		panic(err)
	}

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			panic(err)
		}

		tables = append(tables, name)
	}

	return tables
}

func GetSqliteDbTableAttribs(table string) map[string]string {
	rows, err := GetDb().Query("PRAGMA table_info(" + table + ")")
	if err != nil {
		panic(err)
	}

	attribs := make(map[string]string)
	for rows.Next() {
		var trash string
		var attr string
		var type_ string
		if err := rows.Scan(&trash, &attr, &type_,
			&trash, &trash, &trash); err != nil {
			panic(err)
		}

		attribs[attr] = type_
	}

	return attribs
}
