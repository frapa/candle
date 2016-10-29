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
}
