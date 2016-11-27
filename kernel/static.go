package kernel

import (
	"io/ioutil"
	"net/http"
)

var index []byte
var concatJs []byte
var concatCss []byte
var fontello []byte
var fontello2 []byte

func indexHandler(writer http.ResponseWriter, request *http.Request) {
	if request.URL.String() != "/" {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		writer.WriteHeader(http.StatusNotFound)
		writer.Write([]byte("404"))
	} else {
		writer.Header().Set("Content-Type", "text/html; charset=utf-8")
		writer.WriteHeader(http.StatusOK)
		writer.Write(index)
	}
}

func javascriptHandler(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "text/javascript")
	writer.WriteHeader(http.StatusOK)
	writer.Write(concatJs)
}

func cssHandler(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "text/css")
	writer.WriteHeader(http.StatusOK)
	writer.Write(concatCss)
}

func fontHandler(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "application/x-font-woff")
	writer.WriteHeader(http.StatusOK)

	if request.URL.String() != "/fontello.woff2" {

		writer.Write(fontello2)
	} else {
		writer.Write(fontello)
	}
}

func load(path string) []byte {
	content, err := ioutil.ReadFile(path)
	if err != nil {
		panic(err)
	}

	return content
}

func loadResources() {
	fontello = load("./static/css/000_kernel/fontello.woff")
	fontello2 = load("./static/css/000_kernel/fontello.woff2")
}

func StartStaticServer() {
	loadResources()

	http.HandleFunc("/concat.js", javascriptHandler)
	http.HandleFunc("/concat.css", cssHandler)
	http.HandleFunc("/font/fontello.woff", fontHandler)
	http.HandleFunc("/font/fontello.woff2", fontHandler)
	http.HandleFunc("/", indexHandler)
}
