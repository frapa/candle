package kernel

import (
	"reflect"
)

type LinkInfo struct {
	Origin  string
	Attr    string
	Target  string
	Inverse string
}

var linkTable map[string]map[string]LinkInfo

func init() {
	initLinkTable()
}

func initLinkTable() {
	linkTable = make(map[string]map[string]LinkInfo)
}

func DefineLink(origin AnyModel, attr string, target AnyModel, inverse_ ...string) {
	inverse := ""
	if len(inverse) == 1 {
		inverse = inverse_[0]
	}

	originClass := reflect.TypeOf(origin).Name()
	targetClass := reflect.TypeOf(origin).Name()

	if _, ok := linkTable[originClass]; !ok {
		linkTable[originClass] = make(map[string]LinkInfo)
	}

	linkTable[originClass][attr] = LinkInfo{originClass, attr, targetClass, inverse}
	if inverse != "" {
		linkTable[targetClass][inverse] = LinkInfo{targetClass, inverse, originClass, attr}
	}
}

func GetLinkInfo(origin string, attr string) LinkInfo {
	return linkTable[origin][attr]
}

func Link(origin AnyModel, attr string, target AnyModel) error {
	if !origin.IsPersisted() || !target.IsPersisted() {
		panic("Cannot Link with unpersisted element(s). Save it first.")
	}

	originId := origin.GetId()
	originClass := origin.GetClass()
	targetId := target.GetId()
	targetClass := target.GetClass()

	selectSql := "SELECT COUNT(*) FROM _Links WHERE " +
		"OriginClass=? AND TargetClass=? AND OriginId=? AND TargetId=? AND Attr=?"
	row := GetDb().QueryRow(selectSql, originClass, targetClass, originId, targetId, attr)

	var count uint
	err := row.Scan(&count)
	if err != nil {
		return err
	}

	// Insert only if link does not exists already
	if count == 0 {
		insertSql := "INSERT INTO _Links (OriginClass, OriginId, TargetClass, TargetId, Attr, InverseAttr) " +
			"VALUES (?, ?, ?, ?, ?, ?)"

		link := GetLinkInfo(originClass, attr)
		inverse := link.Inverse
		if inverse == "" {
			_, err = GetDb().Exec(insertSql, originClass, targetClass, originId, targetId, attr, nil)
		} else {
			_, err = GetDb().Exec(insertSql, originClass, originId, targetClass, targetId, attr, inverse)
		}

		if err != nil {
			return err
		}
	}

	return nil
}
