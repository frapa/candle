package kernel

import (
	"net/http"
)

var index []byte
var concatJs []byte
var concatCss []byte

func indexHandler(writer http.ResponseWriter, request *http.Request) {
	writer.Header().Set("Content-Type", "text/html; charset=utf-8")
	writer.WriteHeader(http.StatusOK)
	writer.Write(index)
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

func StartStaticServer() {
	http.HandleFunc("/concat.js", javascriptHandler)
	http.HandleFunc("/concat.css", cssHandler)
	http.HandleFunc("/", indexHandler)
}
