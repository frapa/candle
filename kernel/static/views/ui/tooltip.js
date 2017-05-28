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

    setValue: function (text) {
        this.text = text;
        this.$('.tooltip-text').html(text);
    },

    openOnHover: function ($target) {
        this.$target = $target;

        if (!this.rendered) {
            this.render();
        }

        var _this = this;
        $target.on('mouseover', function () {
            var pos = utils.computePosRelToBody($target);
            var targetWidth2 = utils.computeWidth($target) / 2;
            var targetHeight = utils.computeHeight($target);

            var left = (pos[0] + targetWidth2);
            var top = (pos[1] + targetHeight + 0.75);

            var tooltipWidth = utils.computeWidth(_this.$el);
            if (left - tooltipWidth / 2 < 0.5) {
                left = pos[0] + tooltipWidth / 2;
            }

            var winWidthEm = utils.convertToEm(window.innerWidth);
            if (left + tooltipWidth / 2 > winHeightEm - 0.5) {
                left = pos[0] + targetWidth2 * 2 - tooltipWidth / 2;
            }

            var winHeightEm = utils.convertToEm(window.innerHeight);
            var tooltipHeight = utils.computeHeight(_this.$el);
            if (top > winHeightEm) {
                top = pos[1] - 0.25 - tooltipHeight;
            }

            _this.$el.css('left', left + 'em');
            _this.$el.css('top', top + 'em');

            _this.$el.css('visibility', 'visible');
        });

        $target.on('mouseout', function () {
            _this.$el.css('visibility', 'hidden');
        });
    }
});
