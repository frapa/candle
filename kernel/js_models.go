package kernel

func GenerateBackboneClasses() string {
	jsCode := ""

	for modelName, _ := range restResources.Models {
		jsCollection := "var " + modelName +
			" = Backbone.Collection.extend({url: '/api/" +
			modelName + "', idAttribute: 'Id'});"

		jsCode += jsCollection
	}

	return jsCode
}
