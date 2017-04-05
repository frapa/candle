var Kernel_View_Ui_ConnectionIndicator = AbstractView.extend({
    initialize: function () {
        this.listenTo(ConnectionManager, 'downlink-start', this.downStart.bind(this));
        this.listenTo(ConnectionManager, 'uplink-start', this.saveStart.bind(this));
        this.listenTo(ConnectionManager, 'downlink-end', this.downEnd.bind(this));
        this.listenTo(ConnectionManager, 'uplink-end', this.saveEnd.bind(this));
    },

    downStart: function () {
        if (ConnectionManager.saveConnections == 0) {
            this.$el.removeClass('icon-cloud');
            this.$el.addClass('icon-download-cloud');
        }
    },

    saveStart: function () {
        this.$el.removeClass('icon-cloud');
        this.$el.removeClass('icon-download-cloud');
        this.$el.addClass('icon-upload-cloud');
    },

    downEnd: function () {
        if (ConnectionManager.saveConnections == 0 && ConnectionManager.connections == 0) {
            this.$el.removeClass('icon-download-cloud');
            this.$el.addClass('icon-cloud');
        }
    },

    saveEnd: function () {
        if (ConnectioManager.saveConnections == 0) {
            if (ConnectionManager.connection == 0) {
                this.$el.removeClass('icon-upload-cloud');
                this.$el.addClass('icon-cloud');
            } else if (ConnectionManager.connection > 0) {
                this.$el.removeClass('icon-upload-cloud');
                this.$el.addClass('icon-download-cloud');
            }
        }
    },

    render: function () {
        this.setElement($('<span class="connection-indicator icon-cloud"></span>'));
    },
});
