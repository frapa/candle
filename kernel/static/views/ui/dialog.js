var Kernel_View_Ui_Dialog = AbstractView.extend({
    // properties that can be set in the children
    title: '',
    buttons: {
        Cancel: function () { return true; },
        Ok: function () {}
    },

    render: function (options) {
        this.contentTemplate = this.template;
        this.template = Kernel_View_Ui_Dialog.prototype.template;

        // Automatically insert subview
        var sv = this.subviews;
        var tempView = AbstractView.extend({
            template: this.contentTemplate
        });
        this.subviews = _.extend({
            content: new tempView()
        }, sv ? sv : {}); // this must stay afterwards,
        // because inner views are not found otherwise

        var to = options.templateObj
        options.templateObj = _.extend(to ? to : {}, {
            title: this.title,
            buttons: this.buttons
        });

        AbstractView.prototype.render.call(this, options);

        this.addButtons();
    },

    setTriangle: function (vloc, hloc) {
        if (vloc == 'n') {
            this.$('.dialog').addClass('dialog-top')
        } else {
            this.$('.dialog').addClass('dialog-bottom')
        }

        if (hloc == 'c') {
            this.$('.dialog-triangle-container')
                .addClass('dialog-triangle-container-center')
        } else if (hloc == 'e') {
            this.$('.dialog-triangle-container')
                .addClass('dialog-triangle-container-east')
        }
    },

    addButtons: function () {
        var $footer = this.$('footer');
        var _this = this;
        _.each(this.buttons, function (callback, text)
        {
            var $button = $('<button class="flat">' + text + '</button>');
            $button.click(function ()
            {
                if (typeof callback == 'string') {
                    callback = _this[callback];
                }

                if (callback.call(_this, _this.subviews)) {
                    _this.close();
                }
            });
            $footer.append($button)
        });
    },

    show: function ($target, anchor, options) {
        this.$target = $target;
        $target.addClass('selected');

        if (options && options.tableAction) {
            $target.parent().addClass('selected');
        }

        if (anchor === undefined) anchor = 'nc';

        var possibleAncors = ['nw', 'nc', 'ne',
            'sw', 'sc', 'se']

        if (possibleAncors.indexOf(anchor) == -1) {
            console.error('Invalid anchor for dialog: "' + anchor + '".');
        }

        var vloc = anchor[0];
        var hloc = anchor[1];

        var pos = utils.computePosRelToBody($target);

        var targetHeight = utils.computeHeight($target);
        var targetWidth2 = utils.computeWidth($target) / 2;
        
        global.mainView.openDialog(this);

        var _this = this;
        var $dialog = this.$('.dialog').css('visibility', 'hidden');
        setTimeout(function () {
            var thisHeight = utils.computeHeight($dialog);
            var thisWidth2 = utils.computeWidth($dialog) / 2;

            var verModifier = vloc == 's' ?
                - (thisHeight + 1) : (targetHeight + 1);
            var horModifier = hloc == 'w' ?
                -2.5 : (hloc == 'c' ? -thisWidth2 : -(2*thisWidth2 - 2.5));

            $dialog.css('left', (pos[0] + targetWidth2 + horModifier) + 'em');
            $dialog.css('top', (pos[1] + verModifier) + 'em');

            _this.setTriangle(vloc, hloc);
            _this.bindExitListeners();

            $dialog.css('visibility', 'visible');
        }, 25);
    },

    bindExitListeners: function () {
        var _this = this;

        // Close on click out
        this.$el
            .click(function () {
                _this.close();
            });

        // Avoid closing on click in
        this.$('.dialog')
            .click(function (event) {
                event.stopPropagation();
            });

        // Close on Escape
        $(window)
            .on('keypress', function (event) {
                if (event.key == 'Escape')  {
                    _this.close();
                    $(window).off('keypress', this);
                }
            });
    },

    close: function () {
        this.$target.parent().removeClass('selected');
        this.$target.removeClass('selected');
        global.mainView.closeDialog();
    },

    remove: function () {
        this.$target.parent().removeClass('selected');
        this.$target.removeClass('selected');
        AbstractView.prototype.remove.call(this);
    }
});

var Kernel_View_Ui_DialogList = Kernel_View_Ui_Dialog.extend({
    title: '',
    buttons: {},

    initialize: function (options) {
        Kernel_View_Ui_Dialog.prototype.initialize.apply(this, arguments);

        this.addView('content',
            new Kernel_View_Ui_Table(_.extend({
                hideHeader: true,
            }, options))
        );
    },

    render: function (options) {
        Kernel_View_Ui_Dialog.prototype.render.apply(this, arguments);

        this.$('.dialog').addClass('dialog-list');
    }
});
