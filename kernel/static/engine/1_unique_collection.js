UniqueCollectionCache = {};

/* This makes sure we have only one collection per url.
 */
var UniqueCollection = Backbone.Collection.extend({
    constructor: function (models, options) {
        if (options && options.url) {
            this.url = options.url;
        }
        this.queryParams = options && options.params ? options.params : {};

        var uniqueTocken = this.url + this.hashParams();
        if (uniqueTocken in UniqueCollectionCache) {
            return UniqueCollectionCache[uniqueTocken];
        }

        Backbone.Collection.apply(this, arguments);

        UniqueCollectionCache[uniqueTocken] = this;
    },

    hashParams: function (params) {
        var qp = params || this.queryParams;

        var keys = _.sortBy(_.keys(qp), function (key) {
            return key;
        });

        var _this = this;
        var hash = _.map(keys, function (key) {
            return key + '=' + qp[key];
        }).join('&');

        return hash;
    },

    params: function (params) {
        var queryParams = _.extend({}, this.queryParams, params)
        
        var uniqueTocken = this.url + this.hashParams(queryParams);
        if (uniqueTocken in UniqueCollectionCache) {
            console.log('cache');
            return UniqueCollectionCache[uniqueTocken];
        }

        clonedCollection = _.clone(this);
        clonedCollection.queryParams = queryParams;
        UniqueCollectionCache[uniqueTocken] = clonedCollection;
        return clonedCollection;
    },
});
