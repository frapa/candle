package kernel

/* Exoteric stuff. Skip if not mentally ready
 */

import (
	"fmt"
	"reflect" // here we go
	"strings"
)

// RECORDS ----------------------------------------------------
type record struct {
	fields map[string]interface{}
}

func newRecord() *record {
	rec := new(record)
	rec.fields = make(map[string]interface{})
	return rec
}

func (r *record) addCol(col string, value interface{}) {
	r.fields[col] = value
}

// TABLES -----------------------------------------------------
type table struct {
	name   string
	fields map[string]string
}

func newTable() *table {
	tab := new(table)
	tab.fields = make(map[string]string)
	return tab
}

func (t *table) addCol(col string, type_ string) {
	t.fields[col] = type_
}

func (t *table) setName(name string) {
	t.name = name
}

func (t *table) getInsertSql(rec *record) string {
	var colNames []string
	var strValues []string
	for field, type_ := range t.fields {
		colNames = append(colNames, field)

		if type_ == "string" {
			strValues = append(strValues, fmt.Sprintf("'%v'", rec.fields[field]))
		} else {
			strValues = append(strValues, fmt.Sprintf("%v", rec.fields[field]))
		}
	}

	joinedCols := strings.Join(colNames, ", ")
	joinedVals := strings.Join(strValues, ", ")
	sql := "INSERT INTO " + t.name + " (" + joinedCols + ") VALUES (" + joinedVals + ");"

	return sql
}

// HELPER ----------------------------------------------------------
func createTableFromModel(model AnyModel) *table {
	modelType := reflect.ValueOf(model).Elem().Type()
	tab := newTable()

	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)
		fieldName := field.Name
		type_ := field.Type.Name()
		tag := field.Tag

		if tag != "nodb" {
			tab.addCol(fieldName, type_)
		}
	}

	return tab
}

func createRecordFromModel(model AnyModel) *record {
	modelElem := reflect.ValueOf(model).Elem()
	modelType := modelElem.Type()
	rec := newRecord()

	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)
		fieldName := field.Name
		fieldValue := modelElem.Field(i).Interface()
		tag := field.Tag

		if tag != "nodb" {
			rec.addCol(fieldName, fieldValue)
		}
	}

	return rec
}

/*
func Save(model AnyModel) {
	modelName := reflect.ValueOf(model).Elem().Type().Name()

	tab := createTableFromModel(model)
	tab.setName(modelName)

	rec := createRecordFromModel(model)
	sql := tab.getInsertSql(rec)
}*/
