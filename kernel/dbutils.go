package kernel

/* Exoteric stuff. Skip if not mentally ready
 */

import (
    "reflect" // here we go
)

type table struct {
    fields map[string]string
}

func NewTable() *table {
    tab := new(table)
    tab.fields = make(map[string]string)
    return tab
}

func (t *table) AddCol(col, type) {
    t.fields[col] = type
}

func createTableFromModel(AnyModel model) {
    modelType := reflect.ValueOf(model).Elem().Type()
    tab := newTable()

    for i := 0; i < modelType.NumField(); i++ {
        field := modelType.Field(i).Name
        type := modelType.Field(i).Type

        tab.AddCol(field, type)
    }
}
