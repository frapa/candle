function StatusMessage(options) {
    this.message = options.message;
    this.type = options.type === undefined ? 'neutral': options.type;
    this.clickCallback = options.click;
}

StatusMessage.prototype.show = function (timeout) {
    if (timeout === undefined) {
        timeout = 5000;
    }

    this.$message = $('<div class="status-message"><div><span></span>' + this.message + '</div></div>');
    this.$message.addClass(this.type);

    var klass = 'icon-info';
    if (this.type == 'error') klass = 'icon-alert';
    else if (this.type == 'success') klass = 'icon-check';
    this.$message.find('span').addClass(klass);

    var $msgDiv = this.$message.children().first();

    var _this = this;
    $msgDiv.click(function (event) {
        _this.destroy();

        if (_this.clickCallback) {
            _this.clickCallback(event);
        }
    });
    setTimeout(this.destroy.bind(this), timeout);

    $(document.body).append(this.$message);
};

StatusMessage.prototype.destroy = function () {
    this.$message.remove();
};
