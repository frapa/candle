var Kernel_View_Ui_Radio = AbstractView.extend({
    initialize: function (options) {
        this.options = options.options;
        this.uid = _.uniqueId('radio_');
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend({
            templateObj: {
                options: this.options,
                uid: this.uid,
            }
        }, options));
    },

    getValue: function () {
        return this.$('input[name="' + this.uid + '"]:checked').val();
    },
});
