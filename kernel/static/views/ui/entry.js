var Kernel_View_Ui_Entry = AbstractView.extend({
    label: '',

    initialize: function (options) {
        this.label = (options && options.label) ?
            options.label : '';
        this.enterCallbacks = (options && options.onEnter) ? [options.onEnter] : [];
        this.blurCallbacks = (options && options.onBlur) ? [options.onBlur] : [];
        this.stopTypingCallbacks = (options && options.onStopTyping) ? [options.onStopTyping] : [];
        this.isPasswordField = options && options.password;
        this.isAutoFocus = options && options.autoFocus;
        this.hidden = options.hidden;
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend({
            templateObj: {
				fieldType: this.isPasswordField ? "password" : "text",
				autoFocus: this.isAutoFocus ? "autofocus" : "",
                label: this.label,
                hidden: this.hidden,
            }
        }, options));

        this.initListenersAfterRender();
        return this;
    },

    initListenersAfterRender: function () {
        var _this = this;
        var triggerChange = function (event) {
            _this.trigger('change', event.target.value, event);
        };

        var callEnterCallbacks =  function (event) {
            if (event.keyCode == 13) {
                _.each(_this.enterCallbacks, function (callback) {
                    callback(_this.getValue());
                });
            }
        };

        var callBlurCallbacks =  function (event) {
            _.each(_this.blurCallbacks, function (callback) {
                callback(_this.getValue());
            });
        };

        var callStopTypingCallbacks =  function (event) {
            _.each(_this.stopTypingCallbacks, function (callback) {
                callback(_this.getValue());
            });
        };

        this.$('input')
            .on('change', triggerChange)
            .on('input', triggerChange)
            .on('keyup', callEnterCallbacks)
            .on('blur', callBlurCallbacks)
            .on('keyup', _.debounce(callStopTypingCallbacks, 500));
    },
    
    setValue: function (value) {
        return this.$('input')[0].value = value;
    },

    getValue: function () {
        return this.$('input')[0].value;
    },

    onEnter: function (callback) {
        this.enterCallbacks.push(callback);
    },

    onBlur: function (callback) {
        this.blurCallbacks.push(callback);
    },

    focus: function () {
        this.$('input').focus();
    },

    hide: function () {
        this.$el.addClass('hidden');
    },

    show: function () {
        this.$el.removeClass('hidden');
    }
});
