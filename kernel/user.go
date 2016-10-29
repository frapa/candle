package kernel

import (
	"time"
	"crypto/sha512" // XXX questo non serve piú
)

// XXX ho segnato con XXX i punti dove farei alcune correzioni
// Correggo solo per la prima volta, non voglio scassarti la minchia

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
	// XXX ricorda il return!
}

// XXX questa forse puoi scriverla minuscola (se 
// la funzione viene sicuramente usata solo in questo file
// [in realta solo in kernel] allora puoi mettere all'inizio
// la lettera minuscola, cosí dall'esterno non si
// vede)
func PswToHash(psw string) hash {
	//ByteHash := sha512.Sum512_256( []byte(psw) )
	salt := 
	// XXX da un occhiata al 4096, credo sia la lunghezza (in bit?) della stringa
	// meglio se non é proprio 1 KB per password.
	// Devi anche importare la libreria che probabilmente va installata
	pbkdf2.Key([]byte(psw), salt, 4096, 32, sha1.New)
	hash = string(ByteHash[:32])
	return hash
}

// XXX No credo si possano comparare le stringhe con ==
// not sure if we need this
func CompareHash(hash1, hash2 string) bool {
	ans := Compare(hash1, hash2)
	if ans == 0 {
		return true
	} // XXX else deve essere sulla stessa riga, Go spacca le balle su queste cose
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
