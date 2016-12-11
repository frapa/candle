var Relational_Model = Backbone.Model.extend({
    to: function (key) {
        if (this.links[key] === undefined) {
            console.error('There is no relation named "' + key + '"');
        } else if (this.isNew()) {
            // Model wasn't persisted we need to make up something
            console.error('Cannot go a complex step away from unpersisted model');
        } else {
            var linkInfo = this.links[key];
            var url = linkInfo.urlTemplate(this.toJSON());

            var tempCollection = Backbone.Collection.extend({
                url: url,
                model: linkInfo.model
            });
            return new tempCollection();
        }
    },

    link: function (attr, model, callback) {
        var links = this.get('links');

        if (links === undefined) {
            links = {};
        }

        if (links[attr] === undefined) {
            links[attr] = [];
        }

        var _this = this;
        var setLink = function () {
            links[attr].push(model.get("Id"));
            _this.set('links', links);
        }

        if (model.isNew()) {
            this.listenToOnce(model, 'sync', setLink);
            model.save();
        } else {
            setLink();
        }
    },
});
