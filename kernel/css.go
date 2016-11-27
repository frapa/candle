package kernel

import (
	"regexp"
)

// Super simple CSS preprocessor. Only supports variables!

var cssVariableDefRe *regexp.Regexp
var cssVariableSubRe *regexp.Regexp

func init() {
	cssVariableDefRe = regexp.MustCompile("(?m)^\\s*(§[A-Za-z0-9_\\-]+)\\s*:\\s*([^;]+)\\s*;\\s*$")
	cssVariableSubRe = regexp.MustCompile("§[A-Za-z0-9_\\-]+")
}

func compileCss(css []byte) []byte {
	// build variables table
	variablesTable := make(map[string][]byte)

	submatches := cssVariableDefRe.FindAllSubmatch(css, -1)
	for _, variable := range submatches {
		name := variable[1]
		value := variable[2]
		variablesTable[string(name)] = value
	}

	// remove variable definitions
	compiledCss := cssVariableDefRe.ReplaceAll(css, []byte{})

	// Substitute variables with values
	replaceVar := func(varName []byte) []byte {
		varNameString := string(varName)
		return variablesTable[varNameString]
	}
	compiledCss = cssVariableSubRe.ReplaceAllFunc(compiledCss, replaceVar)

	return compiledCss
}
