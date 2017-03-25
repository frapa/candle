var Kernel_View_Ui_Radio = AbstractView.extend({
    initialize: function (options) {
        this.options = options.options;
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend({
            templateObj: {
                options: this.options,
            }
        }, options));
    },
});
