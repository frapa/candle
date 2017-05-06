package contact

import (
	"bytes"
	k "github.com/frapa/candle/kernel"
	"github.com/frapa/ripple"
	tpl "text/template"
)

var accountDataStr string = `
{
	"username": "{{ .UserName }}",
	"email": "{{ .Email }}",
	"contactId": "{{ .ContactId }}"
}
`

var accountDataTemplate *tpl.Template

func init() {
	var err error
	accountDataTemplate, err = tpl.New("book").Parse(accountDataStr)
	if err != nil {
		panic(err)
	}

	// disable kernel login controller in favour of this one
	k.InitLoginControllerFunc = initLoginController
}

type loginController struct {
	k.GenericRestController
}

func generateUserDataJson(user *k.User) string {
	buffer := new(bytes.Buffer)

	type accountInfo struct {
		UserName  string
		Email     string
		ContactId string
	}

	var info accountInfo
	info.UserName = user.UserName
	info.Email = user.Email

	contact := NewContact()
	user.To("Contact").Get(contact)
	info.ContactId = contact.Id

	accountDataTemplate.Execute(buffer, info)

	return buffer.String()
}

// Validates login and answers with profile data of the user
func (c *loginController) Get(ctx *ripple.Context) {
	username := ctx.Params["username"]
	password := ctx.Params["password"]

	if user, err := k.CheckUserPassword(username, password); err == nil {
		accountData := generateUserDataJson(user)
		ctx.Response.Body = "{\"success\":true, \"accountData\":" + accountData + "}"
	} else {
		ctx.Response.Body = "{\"success\":false,\"reason\":\"" + err.Error() + "\"}"
	}
}

func initLoginController() {
	instLoginController := new(loginController)
	k.App.RegisterController("login", instLoginController)

	k.App.AddRoute(ripple.Route{
		Pattern:    "/controller/login/:username/:password",
		Controller: "login"})
}
