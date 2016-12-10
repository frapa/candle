var utils = {
    computePosRelToBody: function ($target) {
        var off = $target.offset();
        var x = off.left;
        var y = off.top;
        return [x / this.emSize, y / this.emSize];
    },

    computeHeight: function ($target) {
        var height = $target[0].offsetHeight / this.emSize;
        return height;
    },

    computeWidth: function ($target) {
        var width = $target[0].offsetWidth / this.emSize;
        return width;
    },
};

$(function () {
    utils.emSize = parseFloat($("body").css("font-size"));
});
