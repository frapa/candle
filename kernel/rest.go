package kernel

import (
	"ripple"
)

type RestResource struct {
	
}

type RestResourceList struct {
	List map[string][]*RestResource
}

var restResources RestResource

func RegisterResource(model AnyModel) {
	if restResources.List == nil {
		restResources.List = make(map[string][]*RestResource)
	}

	name := GetModelName(model)
	restResources.List[name] = createTableFromModel(model)
}

// --- Rest Server --- //

type RestController struct {
	
}

func StartRestServer() {
    app := ripple.NewApplication()

    // Create a controller and register it. Any number of controllers
    // can be registered that way.

    var restController RestController
    app.RegisterController("rest", restController)

    // Setup the routes. The special patterns `_controller` will automatically match
    // an existing controller, as defined above. Likewise, `_action` will match any 
    // existing action.

    app.AddRoute(ripple.Route{ Pattern: "_rest/:model/" })
    app.AddRoute(ripple.Route{ Pattern: "_rest/:model/:id" })

    // Start the server

    http.ListenAndServe(":443", app)

}
