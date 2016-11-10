package kernel

import (
	"fmt"
	"reflect" // here we go
	"strings"
	"time"
)

type Schema struct {
	Tables map[string][]*table
}

var schema Schema

func RegisterModel(name string, model AnyModel) {
	schema.Tables[name] = createTableFromModel(model)
}

func GetTablesFromModelClass(class string) []*table {
	return schema.Tables[class]
}

// SCHEMA BUILDING -------------------------------------------
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

func UpdateSchema() {
}

// TABLES -----------------------------------------------------
type table struct {
	name     string
	fields   map[string]string // maps field with type as string
	links    map[string]string // maps fields with table names
	inverses map[string]string // maps field with inverse field name
	reverses map[string]string // maps inverse field name with field
}

func newTable() *table {
	tab := new(table)
	tab.fields = make(map[string]string)
	tab.links = make(map[string]string)
	tab.inverses = make(map[string]string)
	tab.reverses = make(map[string]string)
	return tab
}

func (t *table) addCol(col string, type_ string) {
	t.fields[col] = type_
}

func (t *table) addLink(col string, type_ string, tag string) {
	t.links[col] = type_

	pieces := strings.Split(tag, ":")
	if len(pieces) == 2 && pieces[0] == "inverse" {
		t.inverses[col] = pieces[1]
		t.reverses[pieces[1]] = col
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
			if field.Type.Kind().String() == "struct" {
				// this is a link
				tab.addLink(fieldName, type_, string(tag))
			} else {
				tab.addCol(fieldName, type_)
			}
		}
	}

	return tabs
}
