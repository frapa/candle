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

// Maps uniquely every link with the first key being originClass
// and the second key being the attribute name
var linkTable map[string]map[string]LinkInfo

func initLinkTable() {
	linkTable = make(map[string]map[string]LinkInfo)
}

func DefineLink(origin AnyModel, attr string, target AnyModel, inverse_ ...string) {
	if linkTable == nil {
		initLinkTable()
	}

	inverse := ""
	if len(inverse_) == 1 {
		inverse = inverse_[0]
	}

	originClass := reflect.TypeOf(origin).Name()
	targetClass := reflect.TypeOf(target).Name()

	if _, ok := linkTable[originClass]; !ok {
		linkTable[originClass] = make(map[string]LinkInfo)
	}

	linkTable[originClass][attr] = LinkInfo{originClass, attr, targetClass, inverse}

	if inverse != "" {
		if _, ok := linkTable[targetClass]; !ok {
			linkTable[targetClass] = make(map[string]LinkInfo)
		}
		linkTable[targetClass][inverse] = LinkInfo{targetClass, inverse, originClass, attr}
	}
}

func GetLinkInfo(origin string, attr string) LinkInfo {
	return linkTable[origin][attr]
}

func ParentHasLink(modelName string, attr string) string {
	hineritanceChain := schema.Tables[modelName]

	for _, parent := range hineritanceChain {
		if _, ok := linkTable[parent.name][attr]; ok {
			return parent.name
		}
	}

	return ""
}

func Link(origin AnyModel, attr string, target AnyModel, linkInverse bool) error {
	if !origin.IsPersisted() || !target.IsPersisted() {
		panic("Cannot Link with unpersisted element(s). Save it first.")
	}

	originId := origin.GetId()
	originClass := origin.GetClass()
	targetId := target.GetId()
	targetClass := target.GetClass()

	// check the existance of the link
	infoOriginClass := originClass
	if _, ok := linkTable[originClass][attr]; !ok {
		// check if some parent has the link
		if infoOriginClass = ParentHasLink(originClass, attr); infoOriginClass == "" {
			panic(originClass + " has no link '" + attr + "'")
		}
	}

	link := GetLinkInfo(infoOriginClass, attr)
	// check the target type
	if link.Target != targetClass {
		// check the target type is not a parent model
		if !ModelHasParent(targetClass, link.Target) {
			panic("Trying to create link: \n\t" +
				originClass + " --|" + attr + "|--> " + targetClass +
				"\nExpected: \n\t" +
				originClass + " --|" + attr + "|--> " + link.Target)
		}
	}

	// Check for duplicate links
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

		inverse := link.Inverse
		if inverse == "" {
			_, err = GetDb().Exec(insertSql, originClass, originId, targetClass, targetId, attr, nil)
		} else {
			_, err = GetDb().Exec(insertSql, originClass, originId, targetClass, targetId, attr, inverse)

			// In this case, also create the inverse link
			if linkInverse {
				Link(target, inverse, origin, false)
			}
		}

		if err != nil {
			return err
		}
	}

	return nil
}

func Unlink(origin AnyModel, attr string, target AnyModel, unlinkInverse bool) error {
	if !origin.IsPersisted() || !target.IsPersisted() {
		panic("Cannot Unink unpersisted element(s). Save them first.")
	}

	originId := origin.GetId()
	originClass := origin.GetClass()
	targetId := target.GetId()
	targetClass := target.GetClass()

	// check the existance of the link
	if _, ok := linkTable[originClass][attr]; !ok {
		panic(originClass + " has no link '" + attr + "'")
	}

	link := GetLinkInfo(originClass, attr)
	// check the target type
	if link.Target != targetClass {
		panic("Trying to create link: \n\t" +
			originClass + " --|" + attr + "|--> " + targetClass +
			"\nExpected: \n\t" +
			originClass + " --|" + attr + "|-> " + link.Target)
	}

	selectSql := "DELETE FROM _Links WHERE " +
		"OriginClass=? AND TargetClass=? AND OriginId=? AND TargetId=? AND Attr=?"
	_, err := GetDb().Exec(selectSql, originClass, targetClass, originId, targetId, attr)
	if err != nil {
		return err
	}

	if unlinkInverse {
		inverse := link.Inverse
		selectSql := "DELETE FROM _Links WHERE " +
			"OriginClass=? AND TargetClass=? AND OriginId=? AND TargetId=? AND Attr=?"
		_, err := GetDb().Exec(selectSql, targetClass, originClass, targetId, originId, inverse)
		if err != nil {
			return err
		}
	}

	return nil
}
