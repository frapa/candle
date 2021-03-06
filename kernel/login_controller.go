package kernel

import (
	"bytes"
	"github.com/frapa/ripple"
	tpl "text/template"
)

var accountDataStr string = `
{
	"username": "{{ .UserName }}",
	"email": "{{ .Email }}"
}
`

var accountDataTemplate *tpl.Template

func init() {
	var err error
	accountDataTemplate, err = tpl.New("book").Parse(accountDataStr)
	if err != nil {
		panic(err)
	}
}

type loginController struct {
	GenericRestController
}

func generateUserDataJson(user *User) string {
	buffer := new(bytes.Buffer)

	type accountInfo struct {
		UserName string
		Email    string
	}

	var info accountInfo
	info.UserName = user.UserName
	info.Email = user.Email

	accountDataTemplate.Execute(buffer, info)

	return buffer.String()
}

// Validates login and answers with profile data of the user
func (c *loginController) Get(ctx *ripple.Context) {
	username := ctx.Params["username"]
	password := ctx.Params["password"]

	if user, err := CheckUserPassword(username, password); err == nil {
		accountData := generateUserDataJson(user)
		ctx.Response.Body = "{\"success\":true, \"accountData\":" + accountData + "}"
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

var InitLoginControllerFunc func() = initLoginController
