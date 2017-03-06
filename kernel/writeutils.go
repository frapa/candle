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

		if tag.Get("nodb") != "true" {
			if tag == "class" {
				rec.addCol(fieldName, reflect.ValueOf(topModelName))
			} else {
				if fieldName == "Id" && fieldValue.(string) == "" {
					fmt.Println("WARNING: trying to save '" + topModelName +
						"' without Id. Maybe call to constructor missing?")
				}

				rec.addCol(fieldName, fieldValue)
			}
		}
	}

	return recs
}

func Save(model AnyModel) error {
	var tabs []*table
	var recs []*record

	// Here these is a problem due to go way to
	// embed struct: if I create a model and call
	// Save on it's embedded BaseModel, the model
	// will only be saved in the BaseModel table
	// even tough the Class is correctly set.
	// Here we detect this comparing the struct
	// name with the Class attribute; if different
	// we save a model of the right type that embeds
	// this one. That time I shouldn't have used
	// struct fields, a map was probably better!
	structName := GetModelName(model)
	modelClass := model.GetClass()
	if structName != modelClass && modelClass != "" {
		if model.IsPersisted() {
			// Write only subattributes

			tabs = createTableFromModel(model)
			recs = createRecordFromObject(model, modelClass)

			// Prepend tables and records duplicated from
			// the first one. This is a hack but is simple
			// and works well (also performance-wide)
			inheritanceChain := schema.Tables[modelClass]

			newTabs := []*table{}
			newRecs := []*record{}
			for _, tab := range inheritanceChain {
				if tab.name == structName {
					break
				}

				// Without asterisk I only copy the pointer,
				// but I want to copy the value
				tempTab := *tabs[0]
				tempTab.name = tab.name

				newTabs = append(newTabs, &tempTab)
				newRecs = append(newRecs, recs[0])
			}

			tabs = append(newTabs, tabs...)
			recs = append(newRecs, recs...)
		} else {
			// NOT TESTED
			// Create empty model with the default values
			embeddedModel := model
			model := NewInstanceOf(modelClass)

			structType := reflect.ValueOf(model).Elem().Type()
			for i := 0; i < structType.NumField(); i++ {
				field := structType.Field(i)
				if field.Anonymous && field.Name == structName {
					modelField := reflect.ValueOf(model).Elem().Field(i)
					modelField.Set(reflect.ValueOf(embeddedModel))
					break
				}
			}

			tabs = createTableFromModel(model)
			recs = createRecordFromObject(model, modelClass)
		}
	} else {
		reflect.Indirect(reflect.ValueOf(model)).FieldByName("Class").SetString(structName)

		tabs = createTableFromModel(model)
		recs = createRecordFromObject(model)
	}

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
			fmt.Println("ERROR:", err)
			return err
		}
	}

	reflect.Indirect(reflect.ValueOf(model)).FieldByName("Persisted").SetBool(true)

	return nil
}
