package contact

import (
	k "github.com/frapa/candle/kernel"
)

type Address struct {
	*k.BaseModel
	Street          string
	StreetContinued string
	PostalCode      string
	City            string
	Country         string
}

func init() {
	k.RegisterModel(NewAddress)
	k.RegisterRestResource(NewAddress())
}

func NewAddress() *Address {
	c := new(Address)
	c.BaseModel = k.NewBaseModel()
	return c
}
