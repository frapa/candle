# Database APIs

To make things robust and easy, we have a dabatase API which conveniently
handles the database for us.

## Automated schema creation

Every App should call `kernel.UpdateSchema` when run. This function
makes sure the database schema is up to date with the current Go code.

To define model (also called classes), you have to write a struct,
and you need at least to include `BaseModel`:

```
type Person struct {
    BaseModel

    Name string
    Birthday time.Time
    Location string
    Emplyment string
    Employer string
    Height float64
}
```

Then you need to write a function `init` and register the current struct

```
func init() {
    kernel.RegisterModel(Person{})
}
```

For code clarity, the function `init` should immediately follow the
struct declaration.

If you also want to define a Link between this struct and another one,
you can do it in `init` as follows:

```
func init() {
    kernel.RegisterModel(Person{})

    // Defines a link called "User" between Person and
    // a loginable kernel.User. It also create the inverse
    // link called "Person"
    kernel.DefineLink(Person{}, "User", kernel.User{}, "Person")
}
```

This is all you need to now about schemas. The rest is automatic.

## Constructors

Every model should define a constructor, which should be written
immediately below `init`. The constructor must call the
parent constructor. Here an example:

```
type Person struct {
    BaseModel

    Name string
    Birthday time.Time
    Location string
    Emplyment string
    Employer string
    Height float64
}

func init() {
    ...
}

func NewPerson() *Person {
    p := new(Person)
    p.BaseModel = *NewBaseModel()

    // other initializations

    return p
}

```

## Create instances

Creating a new instance in as easy as calling the constructor.
The constructor does not save the data to the database, so,
in order for the instance to be saved, you need to pass the
instance to `kernel.Save`. Here I save a `Person` to the db:

```
alice := NewPerson()
alice.Name = "Alice"
alice.Location = "Via della campagna 37, Lamon, 32033 (BL), Italy"
kernel.Save(alice)
```

Note that calling `kernel.Save` twice would not save the object two times,
because the db is tied to the Go instances.

## Searching the database and modifying objects

Searching is done through the `Query` struct. The best way to create a `Query`
is using `kernel.All` as a starting point. Example:


```
aliceQuery := kernel.All("Person").Filter("Name", "=", "Alice")
```

**Important:** There is a distiction between structs and `Query`. In the
example above `aliceQuery` is a struct of type `Query`, not a struct of
type `Person`. This is a very important distinction. You cannot for
example do `aliceQuery.Name = "Bob"`. To get the `Person` struct out of
a `Query` you need to use `Get`. The following example changes in the
database the name from Alice to Bob:

```
var alice Person
aliceQuery.Get(&alice)
alice.Name = "Bob"
kernel.Save(&alice)
```

Note that this time we called `kernel.Save` with a & in front, because
this time we have a struct and not a pointer to struct. You will get a
error message if you do not use &.

## Loops

Queries can also return more that one object. In this case `Get` gives
you only the first result. There is a convenient way of of looping
through results. The following will print a list of all people in the
database, numbering them:

```
people = kernel.All("Person")

for people.Next() {
    var person Person
    people.Get(&person) // gets current person

    number := people.Current() // this get result number starting with 0

    fmt.Println(number, person.Name)
}
```

## Creating links

Links are also very important and rather easy to create. Let's say
each person has a link attribute called `Email` to a struct of type
`EmailAddress`, which contains the address details. Here is how you
can create a link between the two:

```
// get Alice from db
var alice Person
kernel.All("Person").Filter("Name", "=", "Alice").Get(&alice)

// create new email address
aliceEmailAddr = NewEmailAddress("alice@example.com")
kernel.Save(aliceEmailAddr)

alice.Link("Email", aliceEmailAddr)
```

**Important:** before using the function `Link` you need to be sure
that the linked objects are saved.

## Inverse links

This are very useful. It happens often that you want to create a
link between objects in both directions. In the example above,
you may also want to have a link of name `Person` from `EmailAddress`
to `Person` so that given an `EmailAddress` you know whose address
is it. We have seen above how to define inverse links:

```
// the last parameter is the name of the inverse link
kernel.DefineLink(Person{}, "Email", EmailAddress{}, "Person")
```

The cool thing is that

```
alice.Link("Email", aliceEmailAddr)
```

will also create an inverse link automatically if it was defined.
If it was defined, that the following code would be equivalent to
the line above

```
aliceEmailAddr.Link("Person", alice)
```

Note: between two objects you can have only one link. If you call `Link`
twice, it will fail silently.

## Navigate links

Now that we saw how to define and create links, we'll see how to
use them. To get the email address of Alice, you can use a `Query`
using `To`:

```
var email EmailAddress
kernel.All("Person").Filter("Name", "=", "Alice").To("Email").Get(&email)
```

Note that this works also if you already have a `Person` struct:

```
// get Alice from db
var alice Person
kernel.All("Person").Filter("Name", "=", "Alice").Get(&alice)

var email EmailAddress
alice.To("Email").Get(&email)
```
