package kernel

import (
	"github.com/laurent22/ripple"
	"net/http"
)

// --- Resource registration --- //

type RestResource struct {
	modelName string
}

func NewRestResource(modelName string) *RestResource {
	m := new(RestResource)
	m.modelName = modelName
	return m
}

type RestResourceList struct {
	Models map[string]*RestResource
}

var restResources RestResourceList

func RegisterResource(model AnyModel) {
	if restResources.Models == nil {
		restResources.Models = make(map[string]*RestResource)
	}

	modelName := GetModelName(model)
	restResources.Models[modelName] = NewRestResource(modelName)
}

// --- Init function --- //

func StartRestServer(port string) {
	app := ripple.NewApplication()

	// Create a controller and register it.
	restController := new(GenericRestController)
	app.RegisterController("rest", restController)

	// Setup the routes. The special patterns `_controller` will automatically match
	// an existing controller, as defined above. Likewise, `_action` will match any
	// existing action.
	app.AddRoute(ripple.Route{Pattern: "/:_controller/:model"})
	app.AddRoute(ripple.Route{Pattern: "/:_controller/:model/:id"})

	// Start the server
	http.ListenAndServe(port, app)
}

// --- Rest server --- //

type GenericRestController struct {
}

func (c *GenericRestController) Get(ctx *ripple.Context) {
	modelName := ctx.Params["model"]
	id := ctx.Params["id"]

	if id == "" {
		// All models where requested

	} else {
		// Only a specific model was requested
	}

	ctx.Response.Body = modelName + " " + id
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
