var Kernel_View_Ui_Tooltip = AbstractView.extend({
    initialize: function (text) {
        this.text = text;
    },

    render: function () {
        AbstractView.prototype.render.call(this, {
            templateObj: {text: this.text}
        });

        $(document.body).append(this.$el);
    },

    openOnHover: function ($target) {
        if (!this.rendered) {
            this.render();
        }

        var _this = this;
        $target.on('mouseover', function () {
            var pos = utils.computePosRelToBody($target);
            var targetHeight = utils.computeHeight($target);
            var targetWidth2 = utils.computeWidth($target) / 2;

            _this.$el.css('left', (pos[0] + targetWidth2) + 'em');
            _this.$el.css('top', (pos[1] + targetHeight + 0.75) + 'em');

            _this.$el.show();
        });

        $target.on('mouseout', function () {
            _this.$el.hide();
        });
    }
});
