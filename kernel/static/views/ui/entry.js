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

        this.initListenersAfterRender();
        return this;
    },

    initListenersAfterRender: function () {
        var _this = this;
        var triggerChange = function (event) {
            _this.trigger('change', event.target.value, event);
        };

        this.$('input')
            .on('change', triggerChange);
    },
    
    setValue: function (value) {
        return this.$('input')[0].value = value;
    },

    getValue: function () {
        return this.$('input')[0].value;
    }
});
