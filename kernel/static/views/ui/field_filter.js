var Kernel_View_Ui_FieldFilter = AbstractView.extend({
    initialize: function (fieldModel) {
        this.addView('input', new Kernel_View_Ui_Entry({
            label: fieldModel.get('field')
        }));
        
        this.addView('type', new Kernel_View_Ui_Radio({
        }));
    },

    render: function (options) {
        var wrap

        AbstractView.prototype.render.call(this, options);

    },
});
