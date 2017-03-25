var Kernel_View_Ui_FieldFilter = AbstractView.extend({
    initialize: function (options) {
        this.addView('input', new Kernel_View_Ui_Entry(options));
        
        this.addView('type', new Kernel_View_Ui_Radio({
            options: [{
                icon: 'icon-quote',
                checked: true,
                value: 'contains',
            }, {
                label: '=',
                value: 'equals',
            }, {
                label: '<',
                value: 'less',
            }, {
                label: '>',
                value: 'greater',
            }]
        }));
        
        this.addView('match-case', new Kernel_View_Ui_Checkbox({
            label: 'aA',
            style: 'button',
            onChange: options.onChangeOptions,
        }));

        this.addView('negate', new Kernel_View_Ui_Checkbox({
            label: '!',
            style: 'button',
            onChange: options.onChangeOptions,
        }));
    },

    getValue: function () {
        return this.getView('input').getValue();
    },

    getType: function () {
        return this.getView('type').getValue();
    },

    getMatchCase: function () {
        return this.getView('match-case').getValue();
    },

    getNegate: function () {
        return this.getView('negate').getValue();
    }
});
