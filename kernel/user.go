package kernel

import (
	"crypto/sha512"
	"errors"
	"golang.org/x/crypto/pbkdf2"
	"time"
)

type User struct {
	BaseModel
	Email    string
	UserName string
	Salt     string
	PswHash  string
	LastLog  time.Time
}

func init() {
	RegisterModel(User{})
}

func NewUser(name string, psw string) *User {
	u := new(User)
	u.BaseModel = *NewBaseModel()
	u.UserName = name

	u.Salt = RandStringFixedLength(saltLen)
	u.PswHash = pswToHash(psw, u.Salt)

	return u
}

func (u *User) CanCreate(model string) (bool, Group) {
	groups := u.To("Groups")

	var group Group
	for groups.Next() {
		groups.Get(&group)

		if group.CanCreate(model) {
			return true, group
		}
	}

	return false, Group{}
}

// generate Hash from password string
func pswToHash(psw string, salt string) string {
	ByteHash := pbkdf2.Key([]byte(psw), []byte(salt), 4096, 32, sha512.New)
	hash := string(ByteHash[:32])

	return hash
}

// check password to login
func CheckUserPassword(name string, psw string) error {
	user := All("User").Filter("UserName", "=", name)

	// Allow login with email
	if user.Count() == 0 {
		user = All("User").Filter("Email", "=", name)

		// This means the user does not exist
		if user.Count() == 0 {
			return errors.New("User does not exist.")
		}
	}

	var u User
	user.Get(&u)

	if pswToHash(psw, u.Salt) == u.PswHash {
		return nil
	} else {
		return errors.New("Password is wrong.")
	}
}
