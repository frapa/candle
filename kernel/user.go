package kernel

import (
	"crypto/sha512"
	"errors"
	"golang.org/x/crypto/pbkdf2"
	"time"
)

type User struct {
	*BaseModel
	Email    string
	UserName string
	Salt     string
	PswHash  string
	LastLog  time.Time
}

func init() {
	RegisterModel(NewUser)
}

func NewUser() *User {
	u := new(User)
	u.BaseModel = NewBaseModel()

	return u
}

func (u *User) SetPassword(psw string) {
	u.Salt = RandStringFixedLength(saltLen)
	u.PswHash = pswToHash(psw, u.Salt)
}

func (u *User) CanCreate(model string) (bool, *Group) {
	groups := u.To("Groups")

	group := NewGroup()
	for groups.Next() {
		groups.Get(group)

		if group.CanCreate(model) {
			return true, group
		}
	}

	return false, &Group{}
}

// generate Hash from password string
func pswToHash(psw string, salt string) string {
	ByteHash := pbkdf2.Key([]byte(psw), []byte(salt), 4096, 32, sha512.New)
	hash := string(ByteHash[:32])

	return hash
}

func GetUserFromAuth(auth string) (*User, error) {
	user := All("User").Filter("UserName", "=", auth)

	// Allow login with email
	if user.Count() == 0 {
		user = All("User").Filter("Email", "=", auth)

		// This means the user does not exist
		if user.Count() == 0 {
			return nil, errors.New("User does not exist.")
		}
	}

	u := NewUser()
	user.Get(u)

	return u, nil
}

// check password to login
func CheckUserPassword(name string, psw string) (*User, error) {
	u, err := GetUserFromAuth(name)
	if err != nil {
		return nil, err
	}

	if pswToHash(psw, u.Salt) == u.PswHash {
		return u, nil
	} else {
		return nil, errors.New("Password is wrong.")
	}
}
