function AsyncNotificationManager(callback, parent) {
    this.parent = parent;
    this.callback = callback;
    this.missingCalls = 1;
    
    if (this.parent !== undefined) {
        this.parent.waitForAction();
    }

    var _this = this;
    this.timeoutId = setTimeout(function () {
        console.error(_this, 'Not called after 10 seconds...');
    }, 10000);
}

AsyncNotificationManager.prototype.setCallback = function (callback) {
    this.callback = callback;
}

AsyncNotificationManager.prototype.waitForAction = function () {
    if (this.parent !== undefined) {
        this.parent.waitForAction();
    }

    this.missingCalls += 1;
}

AsyncNotificationManager.prototype.notifyEnd = function () {
    this.missingCalls -= 1;

    if (this.missingCalls == 0) {
        clearTimeout(this.timeoutId);
        this.callback();
    } else if (this.missingCalls < 0) {
        console.error('Too many notifyEnd()');
    }

    if (this.parent !== undefined) {
        this.parent.notifyEnd();
    }
}
