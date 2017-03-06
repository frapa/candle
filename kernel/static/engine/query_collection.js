var QueryCollection = UniqueCollection.extend({
    initialize: function (options) {
        this.fetched = false;
        this.started = false;
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
            if (this.started) {
				this.outerSuccess.successCallbacks.push(innerSuccess);
            } else {
				var SuccessManager = function () {
                    var _this2 = this;
                    this.successCallbacks = [innerSuccess];
					this.call = function (collection, response, options_) {
                        _this.fetched = true;
                        _this.started = false;
                        _this.trigger('fetched');

                        _.each(_this2.successCallbacks, function (c) {
                            c(collection, response, options_);
                        });
					};
                };

                this.outerSuccess = new SuccessManager();
                options.success = this.outerSuccess.call;

                this.started = true; // to avoid multiple requests for no reason
                Backbone.Collection.prototype.fetch.call(this,
                    _.extend({data: $.param(_this.queryParams)}, options));
            }
        }
    },

    resetFetched: function () {
        if (!this.started) {
            this.fetched = false;
        } else {
            console.error("Trying to reset collection while fetching it. Try later.");
        }
    }
});
