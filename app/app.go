package main

import (
	"fmt"
	"github.com/frapa/candle/kernel"
	"time"
)

func main() {
	var user kernel.User
	kernel.All("User").Filter("Id", "=", "id2").Get(&user)
	fmt.Printf("USER: %v\n", user)

	user.LastLog = time.Now().UTC()

	kernel.Save(user)

	var user2 kernel.User
	user2.UserName = "terzo"
	user2.PswHash = "23123nk1j2b3kh1b23"
	user2.LastLog = time.Now().UTC()

	kernel.Save(user2)
}
