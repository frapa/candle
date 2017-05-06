package contact

import (
	k "github.com/frapa/candle/kernel"
)

type EmailAddress struct {
	*k.BaseModel
	Address string
}

func init() {
	k.RegisterModel(NewEmailAddress)
	k.RegisterRestResource(NewEmailAddress())
}

func NewEmailAddress() *EmailAddress {
	c := new(EmailAddress)
	c.BaseModel = k.NewBaseModel()
	return c
}
