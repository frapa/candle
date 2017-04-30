var RelationalModel = UniqueModel.extend({
    initialize: function (modelData) {
        this.toCache = {};
        this.linkedModelsCache = {};

        if (modelData && modelData.hasOwnProperty('Links_')) {
            this.cacheLinksOnInit();
        }

        this.checkTypes();
    },

    cacheLinksOnInit: function () {
        var _this = this;

        _.each(this.get('Links_'), function (models, attr) {
            var collection = _this.createNewCollection(attr);
            _.each(models, function (model) {
                collection.add(model);
            });
            collection.fetched = true;
            _this.toCache[attr] = collection;
        });
    },

    // If the model was created out of data, assign types
    checkTypes: function () {
        if (!this.types) {
            this.types = {};

            for (attr in this.attributes) {
                var val = this.get(attr);
                
                var type = typeof val;
                if (val === 'number') {
                    if (Number.isInteger(val)) {
                        val = 'int64';
                    } else {
                        val = 'float64';
                    }
                }

                this.types[attr] = type;
            }
        }
    },

    createNewCollection: function (attr) {
        var linkInfo = this.links[attr];
        var url = linkInfo.urlTemplate(this.toJSON());
        
        var tempCollection = QueryCollection.extend({
            url: url,
            model: linkInfo.model
        });

        return new tempCollection();
    },

    cacheLinkedModel: function (attr, model) {
        if (this.toCache.hasOwnProperty(attr)) {
            // If the collection was already fetched, add element to
            // it. There is no need to cache it because the collection
            // cannot be fetched twice.
            this.toCache[attr].add(model);
        } else {
            // If the collection wasn't fetched, then on fetch we won't get
            // this model since the link isn't saved yet. (On save we reset
            // the cache, so that this link won't be there anymore)
            
            if (!this.linkedModelsCache.hasOwnProperty(attr)) {
                this.linkedModelsCache[attr] = [];
            }

            this.linkedModelsCache[attr].push(model);
        }
    },

    clearCache: function (attr) {
        this.linkedModelsCache[attr] = [];

        if (this.toCache.hasOwnProperty(attr)) {
            var collection = this.toCache[attr];
            collection.remove(collection.models);
            collection.fetched = true;
        }
    },

    to: function (attr) {
        if (this.links[attr] === undefined) {
            console.error('There is no relation named "' + attr + '"');
        } else if (this.isNew()) {
            // Allow to to get back 
            var isInCache = this.linkedModelsCache.hasOwnProperty(attr);

            var tempCollectionInst = new QueryCollection();
            tempCollectionInst.fetched = true;
            if (isInCache) {
                tempCollectionInst.add(this.linkedModelsCache[attr]);
            }

            return tempCollectionInst;
        } else {
            // check if the model is in cache
            var isInCache = this.toCache.hasOwnProperty(attr);

            if (isInCache) {
                var collection = this.toCache[attr];
                return collection;
            } else {
                var tempCollectionInst = this.createNewCollection(attr);

                var _this = this;
                this.listenToOnce(tempCollectionInst, 'fetched', function () {
                    _this.toCache[attr] = tempCollectionInst;

                    // This happens if fetch is called after link. We need to
                    // add the linked and not yet saved models to the collection.
                    // Unpersisted links are cached until save is called.
                    if (_this.linkedModelsCache.hasOwnProperty[attr]) {
                        _.each(_this.linkedModelsCache[attr], function (model) {
                            tempCollectionInst.add(model);
                        });
                    }
                });
                
                return tempCollectionInst;
            }
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
            _this.trigger('change');

            if (callback) callback();
        }

        if (model.isNew()) {
            this.listenToOnce(model, 'sync', setLink);
            model.save();
        } else {
            setLink();
        }

        this.cacheLinkedModel(attr, model, true);
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

    unlinkAll: function (attr, doNotTrigger) {
        var unlink = this.get('unlink');
        unlink = unlink == undefined ? {} : unlink;
        unlink[attr] = ['all'];
        this.clearCache(attr);
        this.set('unlink', unlink);

        var links = this.get('links');

        if (links === undefined || links[attr] === undefined) {
            return;
        }
        
        links[attr] = [];
        this.set('links', links);
        if (!doNotTrigger) _this.trigger('change');
    },

    relink: function (attr, model, callback) {
        if (attr === undefined) console.error(attr);
        this.unlinkAll(attr, true);
        this.link(attr, model, callback);
    },

    save: function (attributes, options) {
        ConnectionManager.startConnection(true);
        innerSuccess = options && options.success;
        innerError = options && options.error;
    
        options = {} || options;
        options.success = function () {
            ConnectionManager.endConnection(true);

            // Model is saved. The cached links are not relevant anymore,
            // because a fetch would get them from the server. Delete the cache.
            this.linkedModelsCache = {};

            if (innerSuccess) {
                innerSuccess.apply(arguments);
            }        
        };
        options.error = function () {
            ConnectionManager.endConnection(true);
            if (innerError) {
                innerError.apply(arguments);
            }
        };

        UniqueModel.prototype.save.call(this, attributes, options);
    },
});
