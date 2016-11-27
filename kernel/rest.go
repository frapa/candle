package kernel

import (
	"errors"
	"github.com/frapa/ripple"
	"net/http"
	"reflect"
	"strings"
)

// --- Resources --- //

type RestResource struct {
	modelName    string
	modelPackage string
	constructor  interface{}
}

func NewRestResource(model AnyModel, modelName string, constructor interface{}) *RestResource {
	m := new(RestResource)
	m.modelName = modelName
	m.constructor = constructor

	modelType := reflect.ValueOf(model).Type()
	tockens := strings.Split(modelType.PkgPath(), "/")
	m.modelPackage = tockens[len(tockens)-1]

	return m
}

func (rr *RestResource) GetPackageName() string {
	packageName := rr.modelPackage
	if packageName == "main" {
		packageName = "App"
	} else {
		// Make sure first letter is capitalized
		packageName = strings.ToTitle(string(packageName[0])) +
			packageName[1:]
	}
	return packageName
}

func MatchResource(ctx *ripple.Context) (*RestResource, bool) {
	modelName := ctx.Params["model"]

	if resource, ok := restResources.Models[modelName]; ok {
		return resource, true
	} else {
		NewRestError("Resource '" + modelName +
			"' does not exist.").Send(ctx)
		return nil, false
	}
}

func GetLinkedResource(modelName string, q *query, linkName string) ([]AnyModel, error) {
	// First check that the link exists
	if info, ok := linkTable[modelName][linkName]; ok {
		// Then check that the corresponding resource exists
		// Without this it would be possible to retrieve linked
		// but unregistered models, a serious security hole!
		if targetResource, ok := restResources.Models[info.Target]; ok {
			// All models where requested
			targetModels := q.To(linkName)

			// Check if collection is empty
			if targetModels.Count() == 0 {
				return []AnyModel{}, nil
			} else {
				var collection []AnyModel
				for targetModels.Next() {
					targetModel := NewInstanceOf(targetResource.modelName)
					targetModels.Get(targetModel)
					collection = append(collection, targetModel)
				}

				return collection, nil
			}
		} else {
			return []AnyModel{}, errors.New("Linked class in not registered as rest resource")
		}
	} else {
		println(modelName, " ", linkName)
		return []AnyModel{}, errors.New("Link does not exist")
	}
}

// --- Resource list --- //

type RestResourceList struct {
	Models map[string]*RestResource
}

var restResources RestResourceList
var App *ripple.Application = ripple.NewApplication()

// --- Resource registration --- //

func RegisterRestResource(model AnyModel, constructor interface{}) {
	if restResources.Models == nil {
		restResources.Models = make(map[string]*RestResource)
	}

	modelName := GetModelName(model)
	restResources.Models[modelName] =
		NewRestResource(model, modelName, constructor)
}

// --- Init function --- //

func StartRestServer() {
	// This makes sure json is returned gzipped whenever possible
	App.EnableCompression()

	// Create a controller and register it.
	restController := new(GenericRestController)
	App.RegisterController("rest", restController)

	// Setup the routes. The special patterns `_controller` will automatically match
	// an existing controller, as defined above. Likewise, `_action` will match any
	// existing action.
	App.AddRoute(ripple.Route{Pattern: "/api/:model", Controller: "rest"})
	App.AddRoute(ripple.Route{Pattern: "/api/:model/:id", Controller: "rest"})
	App.AddRoute(ripple.Route{Pattern: "/api/:model/:id/:link", Controller: "rest"})

	// Start the server
	http.HandleFunc("/api/", App.ServeHTTP)
}

// --- Rest server --- //

type GenericRestController struct {
}

func (c *GenericRestController) Authenticate(ctx *ripple.Context) bool {
	user := ctx.GetQueryParam("user")
	password := ctx.GetQueryParam("psw")

	// TODO: check user and password
	println(user, " ", password)
	return true
}

func (c *GenericRestController) ApplyQueryParameters(q *query, ctx *ripple.Context) *query {
	modelName := ctx.Params["model"]
	table := GetTablesFromModelClass(modelName)[0]

	nq := q.Clone()

	for key, value := range ctx.GetQuery() {
		if key != "user" && key != "psw" {
			if len(value) == 1 && len(value[0]) == 0 {
				// For now I support < and >
				if strings.Contains(key, "<") {
					tockens := strings.Split(key, "<")
					if table.hasField(tockens[0]) {
						nq = nq.Filter(tockens[0], "<", tockens[1])
					}
				} else if strings.Contains(key, ">") {
					tockens := strings.Split(key, ">")
					if table.hasField(tockens[0]) {
						nq = nq.Filter(tockens[0], ">", tockens[1])
					}
				}
			} else {
				// Then it is a = filter
				if table.hasField(key) {
					nq = nq.Filter(key, "=", value[0])
				}
			}
		}
	}

	return nq
}

func (c *GenericRestController) Get(ctx *ripple.Context) {
	if !c.Authenticate(ctx) {
		return
	}

	modelName := ctx.Params["model"]
	id := ctx.Params["id"]
	link := ctx.Params["link"]

	if resource, ok := MatchResource(ctx); ok {
		if id == "" {
			// All models where requested
			unfilteredModels := All(resource.modelName)
			models := c.ApplyQueryParameters(unfilteredModels, ctx)

			// Check if collection is empty
			if models.Count() == 0 {
				ctx.Response.Body = "[]"
			} else {
				ctx.Response.Body = models.GetAll()
			}
		} else if link == "" {
			// Only a specific model was requested
			model := NewInstanceOf(resource.modelName)
			matchingModel := All(resource.modelName).Filter("Id", "=", id)

			// Check if requested id exists
			if matchingModel.Count() == 0 {
				NewRestError("There is no '" + modelName +
					"' with id '" + id + "'.").Send(ctx)
			} else {
				matchingModel.Get(model)
				ctx.Response.Body = model
			}
		} else {
			// A linked model was requested
			matchingModel := All(resource.modelName).Filter("Id", "=", id)

			// Check if requested id exists
			if matchingModel.Count() == 0 {
				NewRestError("There is no '" + modelName +
					"' with id '" + id + "'.").Send(ctx)
			} else {
				collection, err := GetLinkedResource(modelName, matchingModel, link)
				if err != nil {
					println(err.Error())
					NewRestError("There is no relation '" + link +
						"' for model '" + modelName + "'").Send(ctx)
				} else {
					ctx.Response.Body = collection
				}
			}
		}
	}
}

func (c *GenericRestController) Post(ctx *ripple.Context) {
	if !c.Authenticate(ctx) {
		return
	}

	if resource, ok := MatchResource(ctx); ok {
		constructor := reflect.ValueOf(resource.constructor)
		model := constructor.Call(nil)[0].Interface().(AnyModel)
		Save(model)

		ctx.Response.Status = http.StatusCreated
		ctx.Response.Body = model
	}
}

func (c *GenericRestController) Put(ctx *ripple.Context) {
	println("put")
}

func (c *GenericRestController) Del(ctx *ripple.Context) {
	println("delete")
}

// --- Helper function --- //
type RestError struct {
	Message string
	Field   string
	Errors  []*RestError
}

func NewRestError(msg string) *RestError {
	e := new(RestError)
	e.Message = msg
	return e
}

func (e *RestError) Send(ctx *ripple.Context) {
	ctx.Response.Status = http.StatusBadRequest
	ctx.Response.Body = e
}
