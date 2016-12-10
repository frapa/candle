package kernel

import (
	"fmt"
)

func DeleteAllLinks(object AnyModel) {
	id := object.GetId()

	deleteSql := "DELETE FROM _Links WHERE OriginId=? OR TargetId=?;"
	_, err := GetDb().Exec(deleteSql, id, id)
	if err != nil {
		panic(err)
	}
}

func Delete(object AnyModel) error {
	if !object.IsPersisted() {
		fmt.Println("WARNING: Trying to delete unpersisted object of type '" +
			object.GetClass() + "'")
	} else {
		DeleteAllLinks(object)

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
