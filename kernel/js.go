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

func escapeSlashes(str string) string {
	return strings.Replace(str, "\\", "\\\\", -1)
}

func escapeQuotes(str string) string {
	return strings.Replace(str, "\"", "\\\"", -1)
}

var re *regexp.Regexp

func init() {
	re = regexp.MustCompile("^var\\s*([A-Za-z_][A-Za-z0-9_\\.]+)\\s*=\\s*([A-Za-z_][A-Za-z0-9_\\.]+)\\.extend\\s*\\(\\s*{")
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

func compact(folders []string, ext string, minify func([]byte) []byte,
	editFunc ...func(string, string, []byte) []byte) []byte {
	var compacted []byte

	// Function which minifies and adds files together
	minifyAndCompact := func(folder string, path string) {
		content, err := ioutil.ReadFile(path)
		if err != nil {
			panic(err)
		}

		if len(editFunc) > 0 {
			content = editFunc[0](folder, path, content)
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
	concatCss = compact(folders, "css", minifyCss)
}

func minifyJs(jsCode []byte) []byte {
	minified, err := jsmin.Minify(jsCode)
	if err != nil {
		panic(err)
	}

	return minified
}

// Puts all javascript in a single minified file
func compactJs() {
	folders := []string{"./static/libs", "./static/engine",
		"./static/models", "./static/views", "./static/js"}

	bindTemplatesToViews := func(folder string, path string, content []byte) []byte {
		if folder == "./static/views" {
			return bindTemplate(path, content)
		}
		return content
	}

	concatJs = compact(folders, "js", minifyJs, bindTemplatesToViews)
}

func writeBackboneClasses() {
	path := "./static/models/models.js"
	code := []byte(GenerateBackboneClasses())

	err := ioutil.WriteFile(path, code, 0644)
	if err != nil {
		panic(err)
	}
}

func GenerateIndex(title string) {
	html := "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"

	// add title
	html += "<title>" + title + "</title>"

	// add scripts
	writeBackboneClasses()
	compactJs()
	html += "<script src=\"concat.js\"></script>"

	// add css
	compactCss()
	html += "<link rel=\"stylesheet\" type=\"text/css\" href=\"concat.css\">"

	// finish off
	html += "</head><body id=\"app\"><subview name=\"app\"></body></html>"

	index = []byte(html)
}
