package kernel

/* Exoteric stuff. Skip if not mentally ready
 */

import (
	"fmt"
	"reflect" // here we go
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

func createRecordFromObject(model AnyModel, topModelName_ ...string) []*record {
	var recs []*record

	modelElem := reflect.Indirect(reflect.ValueOf(model))
	modelType := modelElem.Type()

	var topModelName string
	if len(topModelName_) == 0 {
		topModelName = modelType.Name()
		modelElem.FieldByName("Class").SetString(topModelName)
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
				createRecordFromObject(fieldValue.(AnyModel), topModelName)...)
			rec.copyColsFrom(recs)
			continue
		}

		fieldName := field.Name
		tag := field.Tag

		if tag != "nodb" && field.Type.Kind().String() != "struct" {
			if tag == "class" {
				rec.addCol(fieldName, reflect.ValueOf(topModelName))
			} else {
				if fieldName == "Id" && fieldValue.(string) == "" {
					fmt.Println("WARNING: trying to save '" + topModelName +
						"' without Id. Maybe constructor missing?")
				}

				rec.addCol(fieldName, fieldValue)
			}
		}
	}

	return recs
}

func Save(model AnyModel) error {
	tabs := createTableFromModel(model)
	recs := createRecordFromObject(model)

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

		//fmt.Println(sql, args)
		_, err := GetDb().Exec(sql, args...)
		if err != nil {
			return err
		}
	}

	reflect.Indirect(reflect.ValueOf(model)).FieldByName("Persisted").SetBool(true)

	return nil
}
