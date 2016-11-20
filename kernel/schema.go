package kernel

import (
	"fmt"
	"github.com/rs/xid"
	"reflect"
	"strings"
	"time"
)

type Schema struct {
	Tables map[string][]*table
}

var schema Schema

func RegisterModel(model AnyModel) {
	if schema.Tables == nil {
		schema.Tables = make(map[string][]*table)
	}

	name := GetModelName(model)
	schema.Tables[name] = createTableFromModel(model)
}

func GetTablesFromModelClass(class string) []*table {
	return schema.Tables[class]
}

// SCHEMA BUILDING -------------------------------------------
func GetDbType(type_ string) string {
	switch GetDriver() {
	case SQLITE:
		return GetSqliteDbType(type_)
	}

	panic("Missing database specific implementation of GetDbType()")
}

func GetDbTables() []string {
	switch GetDriver() {
	case SQLITE:
		return GetSqliteDbTables()
	}

	panic("Missing database specific implementation of GetDbTables()")
}

func GetDbTableAttribs(table string) map[string]string {
	switch GetDriver() {
	case SQLITE:
		return GetSqliteDbTableAttribs(table)
	}

	panic("Missing database specific implementation of GetDbTableAttribs()")
}

func diffTable(tableName string, tab *table) (int, string) {
	dbAttribs := GetDbTableAttribs(tableName)

	// check existing columns
	changed := 0
	var addedCols []string
	for attr, type_ := range dbAttribs {
		if actualType, ok := tab.fields[attr]; ok {
			if GetDbType(actualType) != type_ {
				// type of some column changed
				changed = 1
			}
		} else {
			// There is a column in the db without corresponding
			// struct field. It will be deleted
			changed = 1
		}
	}

	// check for new columns
	for attr, _ := range tab.fields {
		if _, ok := dbAttribs[attr]; !ok {
			changed = 2
			addedCols = append(addedCols, attr)
		}
	}

	// 0 means no change, 1 means deleted or type change, 2 column added
	return changed, strings.Join(addedCols, ",")
}

func diffTables() map[string]string {
	diff := make(map[string]string)
	dbTableMap := make(map[string]bool)

	// check existing tables for modifications
	dbTables := GetDbTables()
	for _, tableName := range dbTables {
		// leave _Links table alone
		if tableName == "_Links" {
			continue
		}

		if tabs, ok := schema.Tables[tableName]; ok {
			// Current table exists, check for column modification
			what, colStr := diffTable(tableName, tabs[0])
			if what == 1 {
				// table was updated
				diff[tableName] = "updated"
			} else if what == 2 {
				// column was added
				diff[tableName] = "columns:" + colStr
			}
		} else {
			// Table was deleted
			diff[tableName] = "deleted"
		}

		dbTableMap[tableName] = true
	}

	// check for new tables
	for tableName, _ := range schema.Tables {
		if _, ok := dbTableMap[tableName]; !ok {
			// new table
			diff[tableName] = "new"
		}
	}

	return diff
}

func createLinkTable() {
	_, err := GetDb().Exec("CREATE TABLE IF NOT EXISTS _Links" +
		"(LinkId INTEGER PRIMARY KEY, OriginClass TEXT, " +
		"OriginId TEXT, TargetClass TEXT, TargetId TEXT, " +
		"Attr TEXT, InverseAttr TEXT);")
	if err != nil {
		panic(err)
	}
}

// Returns a list of attr as comma separated string
func getAttrList(tableName string) string {
	var cols []string
	for attr, _ := range schema.Tables[tableName][0].fields {
		cols = append(cols, attr)
	}
	return strings.Join(cols, ", ")

}

func createNewTableSql(tableName string, searchTableName string) string {
	sql := "CREATE TABLE IF NOT EXISTS " + tableName + " ("

	var cols []string
	for attr, type_ := range schema.Tables[searchTableName][0].fields {
		cols = append(cols, attr+" "+GetDbType(type_))
	}
	sql += strings.Join(cols, ", ") + ");"
	return sql
}

func createNewTables(tableName string) {
	sql := createNewTableSql(tableName, tableName)
	if _, err := GetDb().Exec(sql); err != nil {
		panic(err)
	}
}

func dropTable(tableName string) {
	sql := "DROP TABLE " + tableName + ";"
	if _, err := GetDb().Exec(sql); err != nil {
		panic(err)
	}
}

func addColumnToTable(tableName string, cols []string) {
	for _, col := range cols {
		type_ := schema.Tables[tableName][0].fields[col]
		sql := "ALTER TABLE " + tableName + " ADD COLUMN " +
			col + " " + GetDbType(type_) + ";"
		if _, err := GetDb().Exec(sql); err != nil {
			panic(err)
		}
	}
}

func updateTable(tableName string) {
	tempTableName := "tab" + xid.New().String()
	attrList := getAttrList(tableName)
	sql := "BEGIN TRANSACTION; " +
		createNewTableSql(tempTableName, tableName) +
		" INSERT INTO " + tempTableName + " (" + attrList + ") " +
		" SELECT " + attrList + " FROM " + tableName +
		"; DROP TABLE " + tableName + "; ALTER TABLE " +
		tempTableName + " RENAME TO " + tableName + "; COMMIT;"

	if _, err := GetDb().Exec(sql); err != nil {
		panic(err)
	}
}

func UpdateSchema() {
	createLinkTable()

	actionsToBeTaken := diffTables()
	for tableName, action := range actionsToBeTaken {
		switch action {
		case "new":
			createNewTables(tableName)
		case "deleted":
			dropTable(tableName)
		case "updated":
			updateTable(tableName)
		default:
			colStr := strings.Split(action, ":")
			cols := strings.Split(colStr[1], ",")
			addColumnToTable(tableName, cols)
		}
	}
}

// TABLES -----------------------------------------------------
type table struct {
	name   string
	fields map[string]string // maps field with type as string
}

func newTable() *table {
	tab := new(table)
	tab.fields = make(map[string]string)
	return tab
}

func (t *table) addCol(col string, type_ string) {
	t.fields[col] = type_
}

func (t *table) hasField(col string) bool {
	if _, ok := t.fields[col]; ok {
		return true
	} else {
		return false
	}
}

func (t *table) copyColsFrom(others []*table) {
	for _, rec := range others {
		for k, v := range rec.fields {
			t.fields[k] = v
		}
	}
}

func (t *table) setName(name string) {
	t.name = name
}

func (t *table) getUpdateSql(rec *record) (string, []interface{}) {
	var colNames []string
	var strValues []interface{}
	for field, type_ := range t.fields {
		colNames = append(colNames, field+"=?")
		value := rec.fields[field]

		if type_ == "Time" {
			strValues = append(strValues, value.(time.Time).Format(ISO8601))
		} else {
			strValues = append(strValues, fmt.Sprintf("%v", value))
		}
	}

	joinedCols := strings.Join(colNames, ", ")
	sql := "UPDATE " + t.name + " SET " + joinedCols + " WHERE Id=?;"
	strValues = append(strValues, rec.fields["Id"])

	return sql, strValues
}

func (t *table) getInsertSql(rec *record) (string, []interface{}) {
	var colNames []string
	var strValues []interface{}
	var questionMarks []string
	for field, type_ := range t.fields {
		colNames = append(colNames, field)
		value := rec.fields[field]

		if type_ == "Time" {
			strValues = append(strValues, value.(time.Time).Format(ISO8601))
		} else {
			strValues = append(strValues, fmt.Sprintf("%v", value))
		}

		questionMarks = append(questionMarks, "?")
	}

	joinedCols := strings.Join(colNames, ", ")
	joinedVals := strings.Join(questionMarks, ", ")
	sql := "INSERT INTO " + t.name + " (" + joinedCols + ") VALUES (" + joinedVals + ");"

	return sql, strValues
}

func (t *table) getDeleteSql(rec *record) (string, []interface{}) {
	var strValues []interface{}
	strValues = append(strValues, rec.fields["Id"])
	sql := "DELETE FROM " + t.name + " WHERE Id=?"
	return sql, strValues
}

// HELPER ----------------------------------------------------------
func GetModelName(model AnyModel) string {
	return reflect.Indirect(reflect.ValueOf(model)).Type().Name()
}

func createTableFromModel(model AnyModel) []*table {
	var tabs []*table

	modelElem := reflect.Indirect(reflect.ValueOf(model))
	modelType := modelElem.Type()

	tab := newTable()
	tab.setName(modelType.Name())
	tabs = append(tabs, tab)

	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)
		fieldValue := modelElem.Field(i).Interface()
		if field.Anonymous {
			tabs = append(tabs,
				createTableFromModel(fieldValue.(AnyModel))...)
			tab.copyColsFrom(tabs)
			continue
		}

		fieldName := field.Name
		type_ := field.Type.Name()
		tag := field.Tag

		if tag != "nodb" {
			tab.addCol(fieldName, type_)
		}
	}

	return tabs
}
