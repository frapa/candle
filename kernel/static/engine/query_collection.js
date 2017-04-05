var QueryCollection = UniqueCollection.extend({
    initialize: function (models) {
        this.fetched = false;
        this.started = false;

        if (models && models.length && !(models[0] instanceof RelationalModel)) {
            _.each(models, function (modelData, i) {
                models[i] = new RelationalModel(modelData);
            });
        }
    },

    /* This is a performance enhancement. If the collection
     * has already been fetched, there is no need to fetch it again
     */
    fetch: function (options) {
        var _this = this;

        // In candle it's possible to create anonymous collection
        // for use in table. These have no url.
        if (!this.url) {
            options.success(this, undefined, options)
            return;
        }

        var force = (options && options.force) ? true : false;

        if (this.fetched && !force) {
            // This works better because code is run asyncronously
            // and some code works better because it assumes fetch is
            // asyncronous
            setTimeout(function () {
                options.success(_this, undefined, options);
            }, 0);
        } else {
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
                        ConnectionManager.endConnection();

                        _.each(_this2.successCallbacks, function (c) {
                            c(collection, response, options_);
                        });
					};
                };

                this.outerSuccess = new SuccessManager();
                options.success = this.outerSuccess.call;

                this.started = true; // to avoid multiple concurrent requests for no reason
                ConnectionManager.startConnection();
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
