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
            links[attr].push(model.id);
            _this.set('links', links);

            if (callback) callback();
        }

        if (model.isNew()) {
            this.listenToOnce(model, 'sync', setLink);
            model.save();
        } else {
            setLink();
        }
    },

    /*unlink: function (attr, model) {
        var links = this.get('links');
        var id = model.id;

        if (links === undefined ||
            links[attr] === undefined ||
            links[attr].indexOf(id) == -1)
        {
            console.error('Tring to unlink unexistant link (attribute: "' + attr + '").');
            return;
        }
        
        var unlink = this.get('unlink');
        unlink = unlink == undefined ? {} : unlink;
        unlink[attr] = unlink[attr] === undefined ? [] : unlink[attr];
        unlink[attr].push(id);
        this.set('unlink', unlink);

        links[attr] = _.difference(link[attr], [id]);
        this.set('links', links);
    },*/

    unlinkAll: function (attr) {
        var unlink = this.get('unlink');
        unlink = unlink == undefined ? {} : unlink;
        unlink[attr] = ['all'];
        this.set('unlink', unlink);

        var links = this.get('links');

        if (links === undefined || links[attr] === undefined) {
            return;
        }
        
        links[attr] = [];
        this.set('links', links);
    },

    relink: function (attr, model, callback) {
        this.unlinkAll(attr);
        this.link(attr, model, callback);
    }
});
