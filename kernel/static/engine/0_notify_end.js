function AsyncNotificationManager(callback, parent) {
    this.parent = parent;
    this.callback = callback;
    this.missingCalls = 1;
    
    if (this.parent !== undefined) {
        this.parent.waitForAction();
    }
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
        this.callback();
    }

    if (this.parent !== undefined) {
        this.parent.notifyEnd();
    }
}
