package kernel

import (
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

func (g *Group) CanCreate(model string) bool {
	models := strings.Split(g.CreatePermissions, ",")

	for _, modelName := range models {
		if model == modelName {
			return true
		}
	}

	return false
}
