package kernel

import (
	"time"
	"crypto/sha512"
)

type User struct {
	BaseModel
	UserName string
	PswHash  string
	LastLog  time.Time
}

func NewUser(name string, psw string) *User {
	u := new(User)
	u.BaseModel = *NewBaseModel()
	u.UserName = name
	u.PswHash = PswToHash(psw)
}

func PswToHash(psw string) hash {
	//ByteHash := sha512.Sum512_256( []byte(psw) )
	salt := 
	pbkdf2.Key([]byte(psw), salt, 4096, 32, sha1.New)
	hash = string(ByteHash[:32])
	return hash
}

// not sure if we need this
func CompareHash(hash1, hash2 string) bool {
	ans := Compare(hash1, hash2)
	if ans == 0 {
		return true
	}
	else {
		return false
	}
}

func LogIn(name string, psw string) {
	u := FindUser(name)
	if CompareHash(PswToHash(psw),u.Pswhash) {
		u.LastLogin = time.UTC()
	}
	else {
		LoginFailed()
	}
}

func FindUser(name string) *User {

}

func LoginFailed() {

}
