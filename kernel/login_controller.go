package kernel

import (
	"github.com/frapa/ripple"
)

type loginController struct {
	GenericRestController
}

func (c *loginController) Get(ctx *ripple.Context) {
	username := ctx.Params["username"]
	password := ctx.Params["password"]

	if err := CheckUserPassword(username, password); err == nil {
		ctx.Response.Body = "{\"success\":true}"
	} else {
		ctx.Response.Body = "{\"success\":false,\"reason\":\"" + err.Error() + "\"}"
	}
}

func initLoginController() {
	instLoginController := new(loginController)
	App.RegisterController("login", instLoginController)

	App.AddRoute(ripple.Route{
		Pattern:    "/controller/login/:username/:password",
		Controller: "login"})
}
