package kernel

import (
    "github.com/rs/xid"
)

/* Useful interface for functions taking as argument
 * a generic model.
 */
type AnyModel interface {}

/* For now empty, but soon will gather the funtionalities
 * that every model should have.
 */
type BaseModel struct {
    Id string
}

// Constructor initilizes basic model
func NewBaseModel() *BaseModel {
    baseModel := new(BaseModel)

    // initialize unique id
    baseModel.Id = xid.New().String()

    return baseModel
}
