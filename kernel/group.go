package kernel

import (
	"reflect"
	"strings"
)

type Group struct {
	BaseModel
	Name              string
	Permissions       string // "r", "w", "rw"
	CreatePermissions string
}

func init() {
	DefineLink(Group{}, "Users", User{}, "Groups")
	DefineLink(Group{}, "Models", BaseModel{}, "Groups")

	RegisterModel(Group{})
}

func NewGroup(name string) *Group {
	g := new(Group)

	g.BaseModel = *NewBaseModel()

	g.Name = name
	g.Permissions = "r" // default to only reading

	return g
}

func TargetCacheGroup(target AnyModel, Id string) {
	var cache string
	typeName := reflect.ValueOf(target).Type().Name()
	if typeName == "" {
		cache = target.(*BaseModel).GroupsCache
	} else {
		cache = target.(BaseModel).GroupsCache
	}

	currentGroups := strings.Split(cache, ",")
	// Split return an array with an empty string...
	if cache == "" || cache == "%!s(<nil>)" {
		currentGroups = []string{}
	}

	// Is there the group already?
	groupAlreadyCached := false
	for _, group := range currentGroups {
		if Id == group {
			groupAlreadyCached = true
			break
		}
	}

	if !groupAlreadyCached {
		currentGroups := append(currentGroups, Id)
		target.SetGroupsCache(strings.Join(currentGroups, ","))
	}
}

func TargetUncacheGroup(target AnyModel, Id string) {
	var cache string
	typeName := reflect.ValueOf(target).Type().Name()
	if typeName == "" {
		cache = target.(*BaseModel).GroupsCache
	} else {
		cache = target.(BaseModel).GroupsCache
	}

	currentGroups := strings.Split(cache, ",")
	// Split return an array with an empty string...
	if cache == "" || cache == "%!s(<nil>)" {
		currentGroups = []string{}
	}

	// Is there the group already?
	groupIsCached := false
	groupPosition := -1
	for i, group := range currentGroups {
		if Id == group {
			groupPosition = i
			groupIsCached = true
			break
		}
	}

	if groupIsCached {
		currentGroups := append(currentGroups[:groupPosition],
			currentGroups[groupPosition+1:]...)
		target.SetGroupsCache(strings.Join(currentGroups, ","))
	}
}

func (g *Group) CanCreate(model string) bool {
	models := strings.Split(g.CreatePermissions, ",")

	for _, modelName := range models {
		if model == modelName {
			return true
		}
	}

	return false
}

/* Override the BasicModel implementation of link,
 * so that no other action is necessary when linking
 * groups to objects. This is necessary to implement
 * caching and fast permission filtering.
 */
func (g Group) Link(attr string, target AnyModel) error {
	if attr == "Models" {
		g.TargetCacheGroup(target)
	}

	return g.BaseModel.Link(attr, target)
}

// On Unlink we need to remove the cache
func (g Group) Unlink(attr string, target AnyModel) error {
	if attr == "Models" {
		g.TargetUncacheGroup(target)
	}

	return g.BaseModel.Unlink(attr, target)
}

func (g *Group) TargetCacheGroup(target AnyModel) {
	TargetCacheGroup(target, g.Id)
}

func (g *Group) TargetUncacheGroup(target AnyModel) {
	TargetUncacheGroup(target, g.Id)
}
