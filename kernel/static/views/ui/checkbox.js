var Kernel_View_Ui_Checkbox = AbstractView.extend({
    initialize: function (options) {
        this.label = options.label;
        this.icon = options.icon;
        this.style = options.style ? options.style : 'default';
    },
    
    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend({
            templateObj: {
                label: this.label,
                icon: this.icon,
                style: this.style,
            }
        }, options));
    },

    getValue: function () {
        return this.$('input')[0].checked;
    },
});
