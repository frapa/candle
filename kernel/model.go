package kernel

import (
	"github.com/rs/xid"
)

/* Useful interface for functions taking as argument
 * a generic model.
 */
type AnyModel interface {
	IsPersisted() bool
}

/* For now empty, but soon will gather the funtionalities
 * that every model should have.
 */
type BaseModel struct {
	Id        string
	Class     string
	Persisted bool `nodb` // is it already in the db?
}

// Constructor initilizes basic model
func NewBaseModel() *BaseModel {
	baseModel := new(BaseModel)

	// initialize unique id
	baseModel.Id = xid.New().String()

	return baseModel
}

func (bm BaseModel) IsPersisted() bool {
	return bm.Persisted
}
