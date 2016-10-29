package kernel

/* Exoteric stuff. Skip if not mentally ready
 */

import (
	"fmt"
	"reflect" // here we go
	"strings"
	"time"
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

func (r *record) copyColsFrom(others []*record) {
	for _, rec := range others {
		for k, v := range rec.fields {
			r.fields[k] = v
		}
	}
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

// HELPER ----------------------------------------------------------
func createTableFromModel(model AnyModel) []*table {
	var tabs []*table

	modelElem := reflect.ValueOf(model)
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

func createRecordFromModel(model AnyModel, topModelName_ ...string) []*record {
	var recs []*record

	modelElem := reflect.ValueOf(model)
	modelType := modelElem.Type()

	var topModelName string
	if len(topModelName_) == 0 {
		topModelName = modelType.Name()
	} else {
		topModelName = topModelName_[0]
	}

	rec := newRecord()
	recs = append(recs, rec)

	for i := 0; i < modelType.NumField(); i++ {
		field := modelType.Field(i)
		fieldValue := modelElem.Field(i).Interface()
		if field.Anonymous {
			recs = append(recs,
				createRecordFromModel(fieldValue.(AnyModel), topModelName)...)
			rec.copyColsFrom(recs)
			continue
		}

		fieldName := field.Name
		tag := field.Tag

		if tag != "nodb" {
			if tag == "class" {
				rec.addCol(fieldName, reflect.ValueOf(topModelName))
			} else {
				rec.addCol(fieldName, fieldValue)
			}
		}
	}

	return recs
}

func Save(model AnyModel) error {
	tabs := createTableFromModel(model)
	recs := createRecordFromModel(model)

	for i, tab := range tabs {
		rec := recs[i]

		var sql string
		var args []interface{}
		if model.IsPersisted() {
			// SQL update
			sql, args = tab.getUpdateSql(rec)
		} else {
			// SQL insert
			sql, args = tab.getInsertSql(rec)
		}

		fmt.Println(sql, args)
		_, err := GetDb().Exec(sql, args...)
		if err != nil {
			return err
		}
	}

	return nil
}
