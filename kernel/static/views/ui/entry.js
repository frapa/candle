var Kernel_View_Ui_Entry = AbstractView.extend({
    label: '',

    initialize: function (options) {
        this.label = (options && options.label) ?
            options.label : '';
        this.enterCallbacks = (options && options.onEnter) ? [options.onEnter] : [];
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

        var callEnterCallback =  function (event) {
            if (event.keyCode == 13) {
                _.each(_this.enterCallbacks, function (callback) {
                    callback();
                });
            }
        };

        this.$('input')
            .on('change', triggerChange)
            .on('keyup', callEnterCallback);
    },
    
    setValue: function (value) {
        return this.$('input')[0].value = value;
    },

    getValue: function () {
        return this.$('input')[0].value;
    },

    onEnter: function (callback) {
        this.enterCallbacks.push(callback);
    }
});
