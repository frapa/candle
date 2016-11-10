package kernel

import (
	"fmt"
)

func Delete(object AnyModel) error {
	if object.IsPersisted() {
		fmt.Println("WARNING: Trying to delete unpersisted object of type '" +
			object.GetClass() + "'")
	} else {
		tabs := GetTablesFromModelClass(object.GetClass())
		rec := createRecordFromObject(object)[0]

		for _, tab := range tabs {
			sql, args := tab.getDeleteSql(rec)

			_, err := GetDb().Exec(sql, args...)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
