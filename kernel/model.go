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
	To(string) *query
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

func (bm BaseModel) Link(attr string, target AnyModel) error {
	return Link(bm, attr, target)
}

func (bm BaseModel) To(attr string) *query {
	return All(bm.GetClass()).Filter("Id", "=", bm.GetId()).To(attr)
}
