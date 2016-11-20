package kernel

import (
	"fmt"
	"strings"
)

func GenerateBackboneClasses() string {
	jsCode := ""

	// TODO: order list so that we pick the packages as defined in modules.txt

	for modelName, resource := range restResources.Models {
		packageName := resource.GetPackageName()

		jsModelName := packageName + "_Model_" + modelName
		jsModel := "var " + jsModelName +
			" = Relational_Model.extend({});"

		jsCollection := "var " + packageName + "_Collection_" + modelName +
			" = Backbone.Collection.extend({url: '/api/" +
			modelName + "', idAttribute: 'Id', model: " + jsModelName + "});"

		jsCode += jsModel + jsCollection
	}

	return jsCode
}

func GenerateBackboneLinks() string {
	jsCode := ""

	for modelName, resource := range restResources.Models {
		var jsLinks []string
		for attr, info := range linkTable[modelName] {
			if targetResource, ok := restResources.Models[info.Target]; ok {
				targetPackage := targetResource.GetPackageName()

				jsTargetModel := targetPackage + "_Model_" + info.Target
				urlTemplate := "/api/" + modelName + "/<%= Id %>/" + attr

				jsLink := attr + ": {model: " + jsTargetModel +
					", urlTemplate: _.template('" + urlTemplate + "')}"

				jsLinks = append(jsLinks, jsLink)
			} else {
				fmt.Println("WARNING: link " + modelName + " -> " + info.Target +
					" cannot be created on the javascript side because '" + info.Target +
					"' is not registered as a REST resource.")
			}
		}

		packageName := resource.GetPackageName()
		jsModelName := packageName + "_Model_" + modelName

		jsCode += "_.extend(" + jsModelName + ".prototype, {links: {" + strings.Join(jsLinks, ",") + "}});"
	}

	return jsCode
}
