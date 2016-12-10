var Kernel_View_Ui_Entry = AbstractView.extend({
    label: '',

    initialize: function (options) {
        this.label = (options && options.label) ?
            options.label : '';
    },

    render: function () {
        AbstractView.prototype.render.call(this, {
            templateObj: {
                label: this.label
            }
        });

        return this;
    },
    
    setValue: function (value) {
        return this.$('input')[0].value = value;
    },

    getValue: function () {
        return this.$('input')[0].value;
    }
});
