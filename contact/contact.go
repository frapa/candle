package contact

import (
	k "github.com/frapa/candle/kernel"
)

type Contact struct {
	*k.BaseModel
	FirstName string
	LastName  string
}

func init() {
	k.DefineLink(NewContact(), "User", k.NewUser(), "Contact")
	k.DefineLink(NewContact(), "Addresses", NewAddress())
	k.DefineLink(NewContact(), "EmailAddresses", NewEmailAddress())
	k.DefineLink(NewContact(), "TelegramAccounts", NewTelegramAccount(), "Contact")

	k.RegisterModel(NewContact)
	k.RegisterRestResource(NewContact())
}

func NewContact() *Contact {
	c := new(Contact)
	c.BaseModel = k.NewBaseModel()
	return c
}
