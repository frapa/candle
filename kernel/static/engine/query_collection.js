var QueryCollection = Backbone.Collection.extend({
    initialize: function (options) {
        if (options && options.url) {
            this.url = options.url;
        }

        if (options && options.query) {
            this.url += '?' + options.query;
        }

        this.fetched = false;
    },

    /* This is a performance enhancement. If the collection
     * has already been fetched, there is no need to fetch it again
     */
    fetch: function (options) {
        var force = (options && options.force) ? true : false;

        if (this.fetched && !force) {
            options.success(this, undefined, options);
        } else {
            var _this = this;

            var innerSuccess = options.success;
            var outerSuccess = function (collection, response, options_) {
                _this.fetched = true;
                _this.trigger('fetched');
                innerSuccess(collection, response, options_);
            };
            options.success = outerSuccess;

            Backbone.Collection.prototype.fetch.call(this, options);
        }
    }
});
