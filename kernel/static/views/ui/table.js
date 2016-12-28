var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.actions = options.actions;
        this.inlineEditing = options.inlineEditing;
        this.hasAddingRow = options.addingRow;
        this.beforeSave = options.beforeSave;
        
        // transform tooltips into tooltip ui components
        this.actions = _.map(options.actions, function (action) {
            action.tooltip = new Kernel_View_Ui_Tooltip(action.tooltip);
            return action;
        });

        this.renderData = {
            width: (100.0 / options.columns.length),
            columns: options.columns,
            headerTemplate: _.template('<th style="width: ' +
                '<%= width %>%;"><%= header %></th>')
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

    initKeys: function () {
        var _this = this;

        keymage('ctrl-s', function () {
            var editedRows = _.filter(_this.rows, function (row) {
                return row.inlineEditingActivated;
            });

            _.each(editedRows, function (row) {
                row.saveEditedRow();
            });

            if (_this.hasAddingRow) {
                // For convenience already prepare new row
                _this.addingRow.once('saved', function () {
                    _this.addingRow.$('td').first().click();
                    _this.addingRow.once('activated', function () {
                        _this.addingRow.$('input').first().focus();
                    });
                });

                // If we do not blur current input, the changes 
                // will be left out. Because the model wasn't updated
                // yet.
                $(':focus').blur();

                _this.addingRow.saveEditedRow();
            }

            return false;
        });
    },

    renderAddingRow: function (anmgr) {
        var newModel = new this.collection.model();
        this.addingRow = new Kernel_View_Ui_Row({
            model: newModel,
            columns: this.renderData.columns,
            inlineEditing: true,
            actions: this.actions,
            saveAction: this.beforeSave
        });

        anmgr.waitForAction();
        var _this = this;
        var waitForAddingRow = new AsyncNotificationManager(function () {
            var $firstCell = _this.addingRow.$('td').first();
            $firstCell.append('&nbsp;<div class="adding-row-indicator">' +
                'Click here to add row...</div>');

            anmgr.notifyEnd();
        });

        this.addingRow.render({anmgr: waitForAddingRow});

        this.listenToOnce(this.addingRow, 'saved', function () {
            var tmpAnmgr = new AsyncNotificationManager(
                _this.prependAddingRow.bind(_this));
            _this.renderAddingRow(tmpAnmgr);
            tmpAnmgr.notifyEnd();
        });

        waitForAddingRow.notifyEnd();
    },

    prependAddingRow: function () {
        this.$tbody.prepend(this.addingRow.$el);
    },

    renderRows: function (anmgr) {
        var _this = this;

        if (this.collection.length || this.hasAddingRow) {
            this.rows = [];

            var asyncWaitForRows = new AsyncNotificationManager(function () {
                var $rows = _.pluck(_this.rows, '$el');
                _this.$tbody.append($rows);

                if (_this.hasAddingRow) {
                    _this.prependAddingRow();
                }

                _this.initKeys();
                anmgr.notifyEnd();
            });
            this.collection.map(this.getElFromModel.bind(this,
                asyncWaitForRows));

            if (this.hasAddingRow) {
                this.renderAddingRow(asyncWaitForRows);
            }

            asyncWaitForRows.notifyEnd();
        } else {
            var colNum = this.renderData.columns.length;
            var $tr = $('<tr><td colspan="' + colNum +
                '">The table is empty</td></tr>');
            this.$tbody.append($tr);
            anmgr.notifyEnd();
        }
    },

    getElFromModel: function (anmgr, model) {
        var row = new Kernel_View_Ui_Row({
            model: model,
            columns: this.renderData.columns,
            inlineEditing: this.inlineEditing,
            actions: this.actions,
            saveAction: this.beforeSave
        });

        row.render({
            anmgr: anmgr
        });

        this.rows.push(row);
    },

    remove: function () {
        AbstractView.prototype.remove.call(this);


    }
});
