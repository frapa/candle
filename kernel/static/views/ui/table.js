var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.actions = options.actions;
        this.inlineEditing = options.inlineEditing;
        this.hasAddingRow = options.addingRow;
        this.beforeSave = options.beforeSave;
        this.modelToRow = {};
        this.order = options.order ? options.order.split(' ') : undefined;
        this.columns = options.columns;
        
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

    initEvents: function ()
    {
        this.listenTo(this.collection, 'add', this.onModelAdded.bind(this));
        this.listenTo(this.collection, 'remove', this.onModelRemoved.bind(this));
    },

    onModelAdded: function (model)
    {
        /*var asyncWaitForRow = new AsyncNotificationManager(function () {
            console.info(123);
        });*/

        //this.createRowFromModel(asyncWaitForRow, model);
    },

    onModelRemoved: function (model)
    {
        var row = this.modelToRow[model.id];
        row.$el.remove();

        var index = array.indexOf(row);
        if (index > -1) {
            this.rows.splice(index, 1);
        }
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

    initHeader: function () {
        var _this = this;

        this.$('th').each(function (i, $th) {
            $($th).click(_this.sortByClickedCol.bind(_this, i));
        });

        if (this.order) {
            if (this.order[1] == 'desc') {
                this.$sortIndicator = $('<span class="icon-down-open sort-indicator"></span>');
            } else {
                this.$sortIndicator = $('<span class="icon-up-open sort-indicator"></span>');
            }

            $(this.$('th')[this.colIdx]).append(this.$sortIndicator);
        }
    },

    sortByClickedCol: function (colIdx) {

        if (this.colIdx != colIdx) {
            this.order = ['', 'asc']
            this.colIdx = colIdx;
        } else {
            this.order = ['', this.order[1] == 'asc' ? 'desc' : 'asc']
        }

        this.rerender();
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

    getSortedRows: function () {
        var _this = this;

        if (this.order) {
            if (this.colIdx === undefined) {
                var colHeader = this.order[0];
                this.colIdx = _.findIndex(this.columns, function (col) {
                    if (col.header == colHeader) {
                        return true;
                    }
                    return false;
                });
            }

            if (this.colIdx < 0) {
                console.error("Trying to sort by inexistant column '" + colHeader + "'");
                return this.rows;
            }

            var sortedRows = _.sortBy(this.rows, function (row) {
                var cell = row.columnData[_this.colIdx];
                
                if (cell.type == 'int64') {
                    if (cell.data == '')
                        return _this.order[1] == 'asc' ? Infinity : -Infinity;
                    return parseInt(cell.data);
                } else if (cell.type == 'float') {
                    if (cell.data == '')
                        return _this.order[1] == 'asc' ? Infinity : -Infinity;
                    return parseFloat(cell.data);
                }

                return cell.data;
            });

            if (this.order[1] == 'desc') {
                sortedRows = sortedRows.reverse();
            }

            return sortedRows;
        } else {
            return this.rows;
        }
    },

    renderRows: function (anmgr) {
        var _this = this;

        if (this.collection.length || this.hasAddingRow) {
            this.rows = [];

            var asyncWaitForRows = new AsyncNotificationManager(function () {
                var $rows = _.pluck(_this.getSortedRows(), '$el');
                _this.$tbody.append($rows);

                var $rows = _.pluck(_this.getSortedRows(), '$el');
                if (_this.hasAddingRow) {
                    _this.prependAddingRow();
                }

                _this.initKeys();
                _this.initHeader();
                anmgr.notifyEnd();
            });
            this.collection.map(this.createRowFromModel.bind(this,
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

        this.initEvents();
    },

    createRowFromModel: function (anmgr, model) {
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
        this.modelToRow[model.id] = row;
    }
});
