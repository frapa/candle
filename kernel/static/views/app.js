var Kernel_RootView = AbstractView.extend({
    el: '#app',

    subviews: {
        app: null
    },

    open: function (view) {
        AbstractView.prototype.open.apply(this, [view, 'app']);
    }
});
