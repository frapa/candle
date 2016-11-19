package kernel

import (
	"github.com/frapa/ripple"
	"net/http"
	"reflect"
)

// --- Resource registration --- //

type RestResource struct {
	modelName string
	modelType reflect.Type
}

func NewRestResource(model AnyModel, modelName string) *RestResource {
	m := new(RestResource)
	m.modelName = modelName

	m.modelType = reflect.ValueOf(model).Type()

	return m
}

func (rr *RestResource) NewInstance() interface{} {
	return reflect.New(rr.modelType).Interface()
}

type RestResourceList struct {
	Models map[string]*RestResource
}

var restResources RestResourceList
var app *ripple.Application = ripple.NewApplication()

func RegisterRestResource(model AnyModel) {
	if restResources.Models == nil {
		restResources.Models = make(map[string]*RestResource)
	}

	modelName := GetModelName(model)
	restResources.Models[modelName] =
		NewRestResource(model, modelName)
}

// --- Init function --- //

func init() {

}

func StartRestServer() {
	// This makes sure json is returned gzipped whenever possible
	app.EnableCompression()

	// Create a controller and register it.
	restController := new(GenericRestController)
	app.RegisterController("rest", restController)

	// Setup the routes. The special patterns `_controller` will automatically match
	// an existing controller, as defined above. Likewise, `_action` will match any
	// existing action.
	app.AddRoute(ripple.Route{Pattern: "/api/:model", Controller: "rest"})
	app.AddRoute(ripple.Route{Pattern: "/api/:model/:id", Controller: "rest"})

	// Start the server
	http.HandleFunc("/api/", app.ServeHTTP)
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

func (c *GenericRestController) MatchResource(ctx *ripple.Context) (*RestResource, bool) {
	modelName := ctx.Params["model"]

	if resource, ok := restResources.Models[modelName]; ok {
		return resource, true
	} else {
		NewRestError("Resource '" + modelName +
			"' does not exist.").Send(ctx)
		return nil, false
	}
}

func (c *GenericRestController) Get(ctx *ripple.Context) {
	if !c.Authenticate(ctx) {
		return
	}

	modelName := ctx.Params["model"]
	id := ctx.Params["id"]

	if resource, ok := c.MatchResource(ctx); ok {
		if id == "" {
			// All models where requested
			models := All(resource.modelName)

			// Check if collection is empty
			if models.Count() == 0 {
				ctx.Response.Body = "[]"
			} else {
				var collection []interface{}
				for models.Next() {
					model := resource.NewInstance()
					models.Get(model)
					collection = append(collection, model)
				}

				ctx.Response.Body = collection
			}
		} else {
			// Only a specific model was requested
			model := resource.NewInstance()
			matchingModel := All(resource.modelName).Filter("Id", "=", id)

			// Check if requested id exists
			if matchingModel.Count() == 0 {
				NewRestError("There is no '" + modelName +
					"' with id '" + id + "'.").Send(ctx)
			} else {
				matchingModel.Get(model)
				ctx.Response.Body = model
			}
		}
	}
}

func (c *GenericRestController) Post(ctx *ripple.Context) {
	println("Post")
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
