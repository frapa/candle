package kernel

import (
	"github.com/dchest/cssmin"
	"github.com/dchest/htmlmin"
	"github.com/dchest/jsmin"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var jsCompressionEnabled bool
var backboneClassesAdded bool

type minFunc func([]byte) []byte
type middleFunc func(string, string, []byte) []byte

func escapeSlashes(str string) string {
	return strings.Replace(str, "\\", "\\\\", -1)
}

func escapeQuotes(str string) string {
	return strings.Replace(str, "\"", "\\\"", -1)
}

var re *regexp.Regexp

func init() {
	re = regexp.MustCompile("(?m)^\\s*var\\s*([A-Za-z_][A-Za-z0-9_\\.]+)\\s*=\\s*([A-Za-z_][A-Za-z0-9_\\.]+)\\.extend\\s*\\(\\s*{")
}

func identity(content []byte) []byte {
	return content
}

// Automatically add template as a string in javascript
func bindTemplate(path string, content []byte) []byte {
	strContent := string(content)

	templatePath := strings.Replace(path, "static/views", "static/templates", -1)
	templatePath = strings.Replace(templatePath, ".js", ".html", -1)
	if _, err := os.Stat(templatePath); os.IsNotExist(err) {
		return content
	}

	template, err := ioutil.ReadFile(templatePath)
	if err != nil {
		panic(err)
	}

	minifiedTemplate, err := htmlmin.Minify(template, nil)
	if err != nil {
		panic(err)
	}

	escTemplate1 := strings.Replace(string(minifiedTemplate), "\n", "", -1)
	escTemplate2 := escapeSlashes(escTemplate1)
	escTemplate3 := escapeQuotes(escTemplate2)
	replacement := "var $1 = $2.extend({template: _.template(\"" + escTemplate3 + "\"),"

	templated := re.ReplaceAllString(strContent, replacement)

	return []byte(templated)
}

func compact(folders []string, ext string, minify minFunc, editFunc ...middleFunc) []byte {
	var compacted []byte

	// Function which minifies and adds files together
	minifyAndCompact := func(folder string, path string) {
		content, err := ioutil.ReadFile(path)
		if err != nil {
			panic(err)
		}

		if len(editFunc) > 0 {
			for _, f := range editFunc {
				content = f(folder, path, content)
			}
		}

		compacted = append(compacted, minify(content)...)
		compacted = append(compacted, []byte("\n")...)
	}

	// Function that is run for every file and filters out uninteresting files
	// based on type and extension
	generateFilterFiles := func(folder string) func(string, os.FileInfo, error) error {
		filterFiles := func(path string, f os.FileInfo, err error) error {
			pieces := strings.Split(f.Name(), ".")
			if !f.IsDir() && pieces[len(pieces)-1] == ext {
				minifyAndCompact(folder, path)
			}
			return nil
		}
		return filterFiles
	}

	// Walk every folder and compact all found files
	for _, folder := range folders {
		err := filepath.Walk(folder, generateFilterFiles(folder))
		if err != nil {
			panic(err)
		}
	}

	return compacted
}

func minifyCss(cssCode []byte) []byte {
	return cssmin.Minify(cssCode)
}

func compactCss() {
	folders := []string{"./static/css"}

	preprocess := func(content []byte) []byte {
		compiledCss := compileCss(content)
		return minifyCss(compiledCss)
	}

	concatCss = preprocess(compact(folders, "css", identity))
}

func minifyJs(jsCode []byte) []byte {
	if !jsCompressionEnabled {
		return jsCode
	}

	minified, err := jsmin.Minify(jsCode)
	if err != nil {
		panic(err)
	}

	return minified
}

// Puts all javascript in a single minified file
func compactJs() {
	folders := []string{"./static/libs", "./static/engine",
		"./static/models", "./static/collections",
		"./static/views", "./static/js"}

	insertBackboneClasses := func(folder string, path string, content []byte) []byte {
		if !backboneClassesAdded && folder == "./static/models" {
			backboneClassesAdded = true
			content = append([]byte(GenerateBackboneLinks()), content...)
			content = append([]byte(GenerateBackboneClasses()), content...)
			return content
		}
		return content
	}

	bindTemplatesToViews := func(folder string, path string, content []byte) []byte {
		if folder == "./static/views" {
			return bindTemplate(path, content)
		}
		return content
	}

	funcs := []middleFunc{insertBackboneClasses, bindTemplatesToViews}
	concatJs = append(concatJs, compact(folders, "js", minifyJs, funcs...)...)
}

func GenerateIndex(title string) {
	html := "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"

	// add title
	html += "<title>" + title + "</title>"

	// add scripts
	concatJs = []byte("var " + title + " = {};")
	compactJs()
	html += "<script src=\"concat.js\"></script>"

	// add css
	compactCss()
	html += "<link rel=\"stylesheet\" type=\"text/css\" href=\"concat.css\">"

	// finish off
	html += "</head><body id=\"app\"><subview name=\"app\"></subview><subview name=\"dialog\"></subview></body></html>"

	index = []byte(html)
}
