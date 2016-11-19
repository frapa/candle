package kernel

import (
	"net/http"
)

func StartApplication(title string, port string) {
	UpdateSchema()
	GenerateIndex(title)

	StartRestServer()
	StartStaticServer()

	http.ListenAndServe(port, nil)
}
