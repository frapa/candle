var ConnectionManager = _.extend({
    connections: 0,
    saveConnections: 0,

    startConnection: function (save) {
        ConnectionManager.connections += 1;
        if (save) {
            ConnectionManager.saveConnections += 1;
            this.trigger('uplink-start');
        } else {
            this.trigger('downlink-start');
        }
    },

    endConnection: function (save) {
        ConnectionManager.connections -= 1;
        if (save) {
            ConnectionManager.saveConnections -= 1;
            this.trigger('uplink-end');
        } else {
            this.trigger('downlink-end');
        }
    },

    beforeUnload: function (event) {
        if (ConnectionManager.saveConnections) {
            event.returnValue = 'Unsaved changes';
            return 'Unsaved changes';
        }
    },
}, Backbone.Events);

window.addEventListener('beforeunload', ConnectionManager.beforeUnload);
