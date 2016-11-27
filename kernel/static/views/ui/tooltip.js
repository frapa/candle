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

    computePosRelToBody: function ($target) {
        var x = 0;
        var y = 0;

        var currentParent = $target;
        do {
            var pos = currentParent.position();
            x += pos.left;
            y += pos.top;

            currentParent = currentParent.offsetParent()
        } while (currentParent.prop('tagName') != 'BODY');

        return [x, y];
    },

    computeHeight: function ($target) {
        var height = $target.height();
        return height;
    },

    computeWidth: function ($target) {
        var width = $target.width();
        return width;
    },

    openOnHover: function ($target) {
        if (!this.rendered) {
            this.render();
        }

        var _this = this;
        $target.on('mouseover', function () {
            var pos = _this.computePosRelToBody($target);
            var targetHeight = _this.computeHeight($target);
            var targetWidth2 = _this.computeWidth($target) / 2;

            _this.$el.css('left', (pos[0] + targetWidth2) + 'px');
            _this.$el.css('top', (pos[1] + targetHeight + 8) + 'px');

            _this.$el.show();
        });

        $target.on('mouseout', function () {
            _this.$el.hide();
        });
    }
});
