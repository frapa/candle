var Kernel_RootView = AbstractView.extend({
    el: '#app',

    subviews: {
        app: null,
        dialog: null
    },

    initialize: function () {
        global.mainView = this;
    },

    open: function (view) {
        AbstractView.prototype.open.apply(this, [view, 'app']);
    },

    openDialog: function (view) {
        AbstractView.prototype.open.apply(this, [view, 'dialog']);
    }
});
