package kernel

import (
	"time"
)

type User struct {
	BaseModel
	UserName string
	PswHash  string
	LastLog  time.Time
}
