var Kernel_View_Ui_Dialog = AbstractView.extend({
    // properties that can be sen in the children
    title: '',
    buttons: ['Cancel', 'Ok'],

    render: function (options) {
        this.contentTemplate = this.template;
        this.template = Kernel_View_Ui_Dialog.prototype.template;

        // Automatically insert subview
        _.extend(this.subviews, {
            content: new AbstractView.extend({
                template: this.contentTemplate
            })
        });
        
        _.extend(options.templateObj, {
            title: this.title,
            button: this.buttons
        });

        console.log(options);
        AbstractView.prototype.render.call(this, options);
    },

    show: function () {
        global.mainView.openDialog(this);
    }
});
