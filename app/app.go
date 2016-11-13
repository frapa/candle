package main

import (
	"fmt"
	k "github.com/frapa/candle/kernel"
	"time"
)

type Avatar struct {
	k.BaseModel
	Url string
}

func init() {
	k.RegisterModel(Avatar{})

	k.DefineLink(Avatar{}, "User", k.User{}, "Avatar")
}

func createUsers() {
	alice := k.NewUser("Alice", "psw123")
	k.Save(alice)

	bob := k.NewUser("Bob", "unapswmolto lunga123")
	k.Save(bob)
	k.Save(bob)

	chris := k.NewUser("Chris", "asd6asja88")
	k.Save(chris)

	dave := k.NewUser("Dave", "ÖASDÜR§%§$%")
	k.Save(dave)

	var aliceAvatar Avatar
	aliceAvatar.Id = "ADSasa8sud8asiasni"
	aliceAvatar.Url = "An url for Alice's avatar"
	k.Save(&aliceAvatar)
}

func searchUsers() {
	var user k.User
	k.All("User").Filter("UserName", "LIKE", "%ice%").Get(&user)
	fmt.Printf("USER: %v\n", user)

	user.LastLog = time.Now().UTC()
	fmt.Printf("USER: %v\n", user)

	k.Save(&user)

	var user2 k.User
	k.All("User").Get(&user2)
	fmt.Println("FIRST USER: ", user2.UserName)

	k.All("User").OrderBy("UserName", k.DESC).Get(&user2)
	fmt.Println("ORDER BY INVERSE NAME: ", user2.UserName)

	k.All("User").OrderBy("UserName", k.DESC).Offset(1).Get(&user2)
	fmt.Println("ORDER BY INVERSE NAME, OFFSET 1: ", user2.UserName)

	fmt.Println("LOOP:")
	users := k.All("User").OrderBy("UserName", k.DESC)
	for users.Next() {
		users.Get(&user2)
		fmt.Println("   ", users.Current(), user2.UserName)
	}

	fmt.Println("LOOP WITH COMPLEX SELECTION:")
	filter := k.Or(k.And(k.F("UserName", "LIKE", "%i%"),
		k.F("UserName", "LIKE", "%c%")),
		k.F("UserName", "=", "Bob"))
	users = k.All("User").Filter(filter).OrderBy("UserName", k.DESC)
	for users.Next() {
		users.Get(&user2)
		fmt.Println("   ", users.Current(), user2.UserName)
	}

	time.Now().UTC()
}

func createLinks() {
	var aliceAvatar Avatar
	k.All("Avatar").Limit(1).Get(&aliceAvatar)

	var alice k.User
	k.All("User").Filter("UserName", "=", "Alice").Get(&alice)

	alice.Link("Avatar", aliceAvatar)
	aliceAvatar.Link("User", alice)
}

func searchLinks() {
	var alice k.User
	aliceColl := k.All("User").Filter("UserName", "=", "Alice")
	aliceColl.Get(&alice)

	var aA Avatar
	aliceColl.To("Avatar").Get(&aA)
	fmt.Println("LINK THROUGH COLLECTION:", aA.Url)

	alice.To("Avatar").Get(&aA)
	fmt.Println("LINK THROUGH OBJECT:", aA.Url)

	var alice2 k.User
	alice.To("Avatar").To("User").Get(&alice2)
	fmt.Println("LET'S GO BACK:", alice2.UserName)
}

func main() {
	k.UpdateSchema()

	// Need only be run once!
	//createUsers()
	//createLinks()

	searchUsers()
	fmt.Println("\n# LINKS -------------------------------------------")
	searchLinks()

	/*var avatar Avatar
	avatar.Id = "asdasfasfa23423"
	avatar.Url = "/a/test/url"
	kernel.Save(&avatar)
	fmt.Println(avatar.Class)

	var user kernel.User
	kernel.All("User").Filter("Id", "=", "id2").Get(&user)
	err := user.Link("Avatar", avatar)

	fmt.Println(err)*/

	/**/
}
