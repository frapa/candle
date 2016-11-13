package kernel

import (
	"math/rand"
	"sync"
	"time"
)

const (
	letterBytes   = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	letterIdxBits = 6                    // 6 bits to represent a letter index (52 letters + 10 digits = 62 < 2^6=64)
	letterIdxMask = 1<<letterIdxBits - 1 // All 1-bits, as many as letterIdxBits
	letterIdxMax  = 63 / letterIdxBits   // # of letter indices fitting in 63 bits
	saltLen       = 10
)

var src = rand.NewSource(time.Now().UnixNano())

var mutex sync.Mutex

func int63() int64 {
	mutex.Lock()
	v := src.Int63()
	mutex.Unlock()
	return v
}

// generates a random string of a fixed length
// original name 'RandStringBytesMaskImprSrc'
func RandStringFixedLength(n int) string {
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
