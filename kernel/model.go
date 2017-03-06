package kernel

import (
	"github.com/rs/xid"
	"time"
)

/* Useful interface for functions taking as argument
 * a generic model.
 */
type AnyModel interface {
	GetId() string
	GetClass() string
	IsPersisted() bool
	SetGroupsCache(string)
	Link(string, AnyModel) error
	Unlink(string, AnyModel) error
	To(string) *query
	Delete() error
}

/* For now empty, but soon will gather the funtionalities
 * that every model should have.
 */
type BaseModel struct {
	Id          string
	Class       string `class`                // special tag that should be used only here
	Persisted   bool   `nodb:"true" json:"-"` // is it already in the db?
	CreatedOn   time.Time
	GroupsCache string // Used to cache which groups can access the element
}

func init() {
	RegisterModel(BaseModel{})
}

// Constructor initilizes basic model
func NewBaseModel() *BaseModel {
	baseModel := new(BaseModel)

	// initialize unique id
	baseModel.Id = xid.New().String()
	baseModel.CreatedOn = time.Now()
	baseModel.Persisted = false

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

func (bm BaseModel) SetGroupsCache(cache string) {
	bm.GroupsCache = cache
	Save(&bm)
}

func (bm BaseModel) Link(attr string, target AnyModel) error {
	// If it's a group we need to update the cache
	if attr == "Groups" && target.GetClass() == "Group" {
		TargetCacheGroup(bm, target.GetId())
	}

	return Link(bm, attr, target, true)
}

func (bm BaseModel) Unlink(attr string, target AnyModel) error {
	// If we are unlinking a group, remove the cache
	if attr == "Groups" && target.GetClass() == "Group" {
		TargetUncacheGroup(bm, target.GetId())
	}

	return Unlink(bm, attr, target, true)
}

func (bm BaseModel) To(attr string) *query {
	return All(bm.GetClass()).Filter("Id", "=", bm.GetId()).To(attr)
}

func (bm BaseModel) Delete() error {
	return Delete(&bm)
}
