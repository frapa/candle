var ConnectionManager = _.extend({
    connections: 0,
    saveConnections: 0,
    connectionStatus: 'unknown',
    ping: Infinity,

    initialize: function () {
        setInterval(ConnectionManager.checkConnection, 5000);
    },

    checkConnection: function () {
        ConnectionManager.pingConnection(function (ping) {
            // In case implement a 'first connect' event
            if (ConnectionManager.connectionStatus == 'offline') {
                ConnectionManager.connectionStatus = 'online';
                ConnectionManager.trigger('reconnect');
            }

            ConnectionManager.connectionStatus = 'online';
            ConnectionManager.ping = ping;

            ConnectionManager.trigger('ping');
        }, function () {
            if (ConnectionManager.connectionStatus != 'offline') {
                ConnectionManager.connectionStatus = 'offline';
                ConnectionManager.trigger('disconnect');
            }

            ConnectionManager.connectionStatus = 'offline';
            ConnectionManager.ping = Infinity;
        });
    },

    pingConnection: function (success, fail) {
        function calcolatePing (end) {
            var elapsed = end - start;
            var ping = elapsed / 2;

            success(ping);
        }

        var start = new Date();
        var request = $.ajax({
            url: '/controller/ping/',
            dataType: 'text',
            success: function (data) {
                var end = new Date();

                if (data == 'ok') {
                    calcolatePing(end);
                }
            },
            error: function () {
                fail();
            }
        });
    },

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
window.addEventListener('load', ConnectionManager.initialize);
