var Relational_Model = Backbone.Model.extend({
    to: function (key) {
        if (this.links[key] === undefined) {
            console.error('There is no relation named "' + key + '"');
        } else {
            var linkInfo = this.links[key];
            var url = linkInfo.urlTemplate(this.toJSON());

            var tempCollection = Backbone.Collection.extend({
                url: url,
                model: linkInfo.model
            });
            return new tempCollection();
        }
    }
});
