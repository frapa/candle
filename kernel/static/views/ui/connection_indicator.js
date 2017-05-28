var Kernel_View_Ui_ConnectionIndicator = AbstractView.extend({
    initialize: function () {
        this.listenTo(ConnectionManager, 'downlink-start', this.downStart.bind(this));
        this.listenTo(ConnectionManager, 'uplink-start', this.saveStart.bind(this));
        this.listenTo(ConnectionManager, 'downlink-end', this.downEnd.bind(this));
        this.listenTo(ConnectionManager, 'uplink-end', this.saveEnd.bind(this));
        this.listenTo(ConnectionManager, 'disconnect', this.disconnect.bind(this));
        this.listenTo(ConnectionManager, 'reconnect', this.reconnect.bind(this));
        this.listenTo(ConnectionManager, 'ping', this.ping.bind(this));
    },

    resetIcons: function () {
        this.$el
            .removeClass('icon-cloud')
            .removeClass('icon-download-cloud')
            .removeClass('icon-cloud-offline');
    },

    ping: function () {
        var displayPing = ConnectionManager.ping == Infinity ?
            'unknown' : ConnectionManager.ping;
        this.tooltip.setValue(
            'Connection status: ' + ConnectionManager.connectionStatus +
            '<br>Latency: ' + displayPing + ' ms');
    },

    disconnect: function () {
        this.resetIcons();
        this.$el.addClass('icon-cloud-offline');

        new StatusMessage({
            message: 'You are now offline',
            type: 'error',
        }).show();
        
        this.tooltip.setValue(
            'Connection status: ' + ConnectionManager.connectionStatus +
            '<br>Latency: unknown');
    },
        
    reconnect: function () {
        this.resetIcons();
        this.$el.addClass('icon-cloud');

        new StatusMessage({
            message: 'You are online again',
            type: 'success',
        }).show();
    },

    downStart: function () {
        if (ConnectionManager.saveConnections == 0) {
            this.resetIcons();
            this.$el.addClass('icon-download-cloud');
        }
    },

    saveStart: function () {
        this.resetIcons();
        this.$el.addClass('icon-upload-cloud');
    },

    downEnd: function () {
        if (ConnectionManager.saveConnections == 0 && ConnectionManager.connections == 0) {
            this.resetIcons();
            this.$el.addClass('icon-cloud');
        }
    },

    saveEnd: function () {
        if (ConnectionManager.saveConnections == 0) {
            if (ConnectionManager.connection == 0) {
                this.resetIcons();
                this.$el.addClass('icon-cloud');
            } else if (ConnectionManager.connection > 0) {
                this.resetIcons();
                this.$el.addClass('icon-download-cloud');
            }
        }
    },

    render: function () {
        this.setElement($('<span class="connection-indicator icon-cloud"></span>'));

        this.tooltip = new Kernel_View_Ui_Tooltip(
            'Connection status: unknown<br>Latency: unknown');
        this.tooltip.openOnHover(this.$el);
    },
});
