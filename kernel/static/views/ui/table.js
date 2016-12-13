var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.actions = options.actions;
        this.inlineEditing = options.inlineEditing;
        this.hasAddingRow = options.addingRow;
        this.addingRowBeforeSave = options.addingRowBeforeSave;
        
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
        this.addingRow = new Kernel_View_Ui_Row({
            model: newModel,
            empty: true,
            columns: this.renderData.columns,
            inlineEditing: true,
            actions: this.actions,
            saveAction: this.addingRowBeforeSave
        });

        anmgr.waitForAction();
        var _this = this;
        var waitForAddingRow = new AsyncNotificationManager(function () {
            var $firstCell = _this.addingRow.$('td').first();
            $firstCell.append('&nbsp;<div class="adding-row-indicator">Click here to add row...</div>');

            anmgr.notifyEnd();
        });

        this.addingRow.render({anmgr: waitForAddingRow});

        waitForAddingRow.notifyEnd();
    },

    renderRows: function (anmgr) {
        var _this = this;

        if (this.collection.length || this.hasAddingRow) {
            this.rows = [];

            var asyncWaitForRows = new AsyncNotificationManager(function () {
                var $rows = _.pluck(_this.rows, '$el');
                _this.$tbody.append($rows);

                if (_this.hasAddingRow) {
                    _this.$tbody.prepend(_this.addingRow.$el);
                }

                anmgr.notifyEnd();
            });
            this.collection.map(this.getElFromModel.bind(this, asyncWaitForRows));

            if (this.hasAddingRow) {
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
