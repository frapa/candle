var QueryCollection = Backbone.Collection.extend({
    initialize: function (options) {
        if (options && options.url) {
            this.url = options.url;
        }

        if (options && options.query) {
            this.url += '?' + options.query;
        }
    }
});
