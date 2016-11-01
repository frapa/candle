package kernel

import (
	"crypto/sha512"
	"golang.org/x/crypto/pbkdf2"
	"strings"
	"time"
)

type User struct {
	BaseModel
	UserName string
	Salt     string
	PswHash  string
	//	CreatedOn time.Time  // ho commentato perché credo che metteró un CreationDate in Model, che
	//	dovrebbe valere per qualsiasi modello.
	LastLog time.Time
}

func NewUser(name string, psw string) *User {
	u := new(User)
	u.BaseModel = *NewBaseModel()
	u.UserName = name

	u.Salt = RandStringBytesMaskImprSrc(saltLen) // XXX bel nome per una funzione! Io non so che fa, se non l'ho scritta...
	u.PswHash = pswToHash(psw, u.Salt)

	//u.CreatedOn = time.Now().UTC()
	//u.LastLog = u.CreatedOn

	return u
}

func pswToHash(psw string, salt string) string {
	// XXX da un occhiata al 4096, credo sia la lunghezza (in bit?) della stringa
	// meglio se non é proprio 1 KB per password.
	// dovrebbe essere il numero di iterazioni di hash: eg. hash(hash(hash(...hash(salt||psw) ...)))
	ByteHash := pbkdf2.Key([]byte(psw), []byte(salt), 4096, 32, sha512.New)
	hash := string(ByteHash[:32])

	return hash
}

func LogIn(name string, psw string) {
	var u User
	All("User").Filter("UserName", "=", name).Get(&u)

	switch strings.Compare(pswToHash(psw, u.Salt), u.PswHash) {
	case 0:
		u.LastLog = time.Now().UTC()
	case 1, -1:
		LogInFailed()
	}
}

/* used only in case of many repetition of the function
 * func FindUser(name string) *User {
	return All("User").Filter("username", "=", name).Get(&u)
}*/

func LogInFailed() {

}
