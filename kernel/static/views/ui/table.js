var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.actions = options.actions;
        this.inlineEditing = options.inlineEditing;
        this.addingRow = options.addingRow;
        
        // transform tooltips into tooltip ui components
        this.actions = _.map(options.actions, function (action) {
            action.tooltip = new Kernel_View_Ui_Tooltip(action.tooltip);
            return action;
        });

        this.renderData = {
            columns: options.columns,
            headerTemplate: _.template('<th><%= header %></th>')
        };
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, _.extend(options, {
            templateObj: this.renderData
        }));

        var _this = this;
        this.$tbody = this.$('tbody');

        options.anmgr.waitForAction();
        this.collection.fetch({
            success: this.renderRows.bind(_this, options.anmgr)
        });

        return this
    },

    renderAddingRow: function (anmgr) {
        var newModel = new this.collection.model();
        var addingRow = new Kernel_View_Ui_Row({
            model: newModel,
            empty: true,
            columns: this.renderData.columns,
            inlineEditing: true,
            actions: this.actions
        });

        return addingRow.render({anmgr: anmgr}).$el;
    },

    renderRows: function (anmgr) {
        var _this = this;

        if (this.collection.length || this.addingRow) {
            this.rows = [];

            var asyncWaitForRows = new AsyncNotificationManager(function () {
                var $rows = _.pluck(_this.rows, '$el');
                _this.$tbody.append($rows);
                anmgr.notifyEnd();
            });
            this.collection.map(this.getElFromModel.bind(this, asyncWaitForRows));

            if (this.addingRow) {
                this.renderAddingRow(asyncWaitForRows);
            }

            asyncWaitForRows.notifyEnd();
        } else {
            var colNum = this.renderData.columns.length;
            var $tr = $('<tr><td colspan="' + colNum + '">The table is empty</td></tr>');
            this.$tbody.append($tr);
            anmgr.notifyEnd();
        }
    },

    getElFromModel: function (anmgr, model) {
        var row = new Kernel_View_Ui_Row({
            model: model,
            columns: this.renderData.columns,
            inlineEditing: this.inlineEditing,
            actions: this.actions
        });

        row.render({
            anmgr: anmgr
        });

        this.rows.push(row);
    }
});
