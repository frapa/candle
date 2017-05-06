package contact

import (
	k "github.com/frapa/candle/kernel"
	"github.com/rs/xid"
)

type TelegramAccount struct {
	*k.BaseModel
	Tocken string
	ChatId int64
}

func init() {
	k.RegisterModel(NewTelegramAccount)
	k.RegisterRestResource(NewTelegramAccount())
}

func NewTelegramAccount() *TelegramAccount {
	t := new(TelegramAccount)
	t.BaseModel = k.NewBaseModel()
	t.Tocken = xid.New().String()
	return t
}

func (t *TelegramAccount) GetContact() *Contact {
	contact := NewContact()
	t.To("Contact").Get(contact)
	return contact
}

func (t *TelegramAccount) GetUser() *k.User {
	user := k.NewUser()
	t.To("Contact").To("User").Get(user)
	return user
}
