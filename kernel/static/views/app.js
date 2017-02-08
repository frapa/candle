var Kernel_RootView = AbstractView.extend({
    el: '#app',

    subviews: {
        app: null,
        dialog: null
    },

    initialize: function () {
        global.mainView = this;
    },

    openMain: function (view) {
        AbstractView.prototype.open.apply(this, [view, 'app']);
        return Backbone.history.start({pushState: true});
    },

    openDialog: function (view) {
        AbstractView.prototype.open.apply(this, [view, 'dialog']);
    },

    closeDialog: function () {
        AbstractView.prototype.close.call(this, 'dialog');
    }
});
