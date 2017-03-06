UniqueModelCache = {};

/* This makes sure we have only one model around with the same id.
 * This is extremely useful, because if a model is changed in one collection
 * we want the other collection that contains the same model to be
 * updated as well.
 *
 * For example in Electrum if we modify a transaction from the Expense
 * account, we want the same model to be updated in the Asset collection
 * as well.
 */
var UniqueModel = Backbone.Model.extend({
    constructor: function (attributes, options) {
        var id = attributes && attributes[this.idAttribute];

        if (id && id in UniqueModelCache) {
            return UniqueModelCache[id];
        }

        Backbone.Model.apply(this, arguments);

        if (id) {
            UniqueModelCache[id] = this;
        }
    }
});
