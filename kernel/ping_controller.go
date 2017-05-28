package kernel

import (
	"github.com/frapa/ripple"
)

type pingController struct {
	GenericRestController
}

func (c *pingController) Get(ctx *ripple.Context) {
	ctx.Response.Body = "ok"
}

func initPingController() {
	instPingController := new(pingController)
	App.RegisterController("ping", instPingController)

	App.AddRoute(ripple.Route{
		Pattern:    "/controller/ping/",
		Controller: "ping"})
}
