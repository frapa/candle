package kernel

import (
	"crypto/sha512"
	"golang.org/x/crypto/pbkdf2"
	"math/rand"
	"strings"
	"sync"
	"time"
)

const letterBytes = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
const (
	letterIdxBits = 6                    // 6 bits to represent a letter index (52 letters + 10 digits = 62 < 2^6=64)
	letterIdxMask = 1<<letterIdxBits - 1 // All 1-bits, as many as letterIdxBits
	letterIdxMax  = 63 / letterIdxBits   // # of letter indices fitting in 63 bits
)
const saltLen = 10

var src = rand.NewSource(time.Now().UnixNano())

var mutex sync.Mutex

func int63() int64 {
	mutex.Lock()
	v := src.Int63()
	mutex.Unlock()
	return v
}

func RandStringBytesMaskImprSrc(n int) string {
	// default n := 10
	b := make([]byte, n)
	// A src.Int63() generates 63 random bits, enough for letterIdxMax characters!
	for i, cache, remain := n-1, int63(), letterIdxMax; i >= 0; {
		if remain == 0 {
			cache, remain = int63(), letterIdxMax
		}
		if idx := int(cache & letterIdxMask); idx < len(letterBytes) {
			b[i] = letterBytes[idx]
			i--
		}
		cache >>= letterIdxBits
		remain--
	}

	return string(b)
}

// XXX ho segnato con XXX i punti dove farei alcune correzioni
// Correggo solo per la prima volta, non voglio scassarti la minchia

type User struct {
	BaseModel
	UserName  string
	Salt      string
	PswHash   string
	CreatedOn time.Time
	LastLog   time.Time
}

func NewUser(name string, psw string) *User {
	u := new(User)
	u.BaseModel = *NewBaseModel()
	u.UserName = name

	u.Salt = RandStringBytesMaskImprSrc(saltLen)
	u.PswHash = pswToHash(psw, u.Salt)

	u.CreatedOn = time.Now().UTC()
	u.LastLog = u.CreatedOn

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

// not sure if we need this
/*func CompareHash(hash1, hash2 string) bool {
	ans := Compare(hash1, hash2)
	if ans == 0 {
		return true
	} // XXX else deve essere sulla stessa riga, Go spacca le balle su queste cose
	else {
		return false
	}
}*/

func LogIn(name string, psw string) {
	var u User
	All("User").Filter("username", "=", name).Get(&u)

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
