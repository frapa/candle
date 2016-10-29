package kernel

import (
	"github.com/rs/xid"
)

/* Useful interface for functions taking as argument
 * a generic model.
 */
type AnyModel interface {
	GetId() string
	GetClass() string
	IsPersisted() bool
	Link(string, AnyModel) error
}

/* For now empty, but soon will gather the funtionalities
 * that every model should have.
 */
type BaseModel struct {
	Id        string
	Class     string `class` // special tag that should be used only here
	Persisted bool   `nodb`  // is it already in the db?
}

// Constructor initilizes basic model
func NewBaseModel() *BaseModel {
	baseModel := new(BaseModel)

	// initialize unique id
	baseModel.Id = xid.New().String()

	return baseModel
}

func (bm BaseModel) GetId() string {
	return bm.Id
}

func (bm BaseModel) GetClass() string {
	return bm.Class
}

func (bm BaseModel) IsPersisted() bool {
	return bm.Persisted
}

func getInverse(attr string, other AnyModel) string {
	inverse, ok := createTableFromModel(other)[0].reverses[attr]

	if ok {
		return inverse
	} else {
		return ""
	}
}

func (bm BaseModel) Link(attr string, other AnyModel) error {
	otherId := other.GetId()
	otherClass := other.GetClass()

	selectSql := "SELECT COUNT(*) FROM _Links WHERE " +
		"OriginClass=? AND TargetClass=? AND OriginId=? AND TargetId=? AND Attr=?"
	row := GetDb().QueryRow(selectSql, bm.Class, otherClass, bm.Id, otherId, attr)

	var count uint
	err := row.Scan(&count)
	if err != nil {
		return err
	}

	// Insert only if link does not exists already
	if count == 0 {
		inverse := getInverse(attr, other)

		insertSql := "INSERT INTO _Links (OriginClass, OriginId, TargetClass, TargetId, Attr, Inverse) " +
			"VALUES (?, ?, ?, ?, ?, ?)"

		if inverse == "" {
			_, err = GetDb().Exec(insertSql, bm.Class, otherClass, bm.Id, otherId, attr, nil)
		} else {
			_, err = GetDb().Exec(insertSql, bm.Class, otherClass, bm.Id, otherId, attr, inverse)
		}

		if err != nil {
			return err
		}
	}

	return nil
}
