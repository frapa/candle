var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.columns = options.columns;
        
        this.click = options.click;
        this.actions = options.actions;
        this.inlineEditing = options.inlineEditing;
        this.hasAddingRow = options.addingRow;
        this.initializeAddingModel = options.initializeAddingModel;
        this.beforeSave = options.beforeSave;
        this.modelToRow = {};
        this.order = options.order ? options.order.split(' ') : undefined;
        
        this.hideHeader = (options && options.hideHeader) ? true : false;
        
        // transform tooltips into tooltip ui components
        this.actions = _.map(options.actions, function (action) {
            action.tooltip = new Kernel_View_Ui_Tooltip(action.tooltip);
            return action;
        });

        if (!(this.collection instanceof QueryCollection)) {
            this.collection = new QueryCollection(this.collection);
        }
    },

    initEvents: function ()
    {
        if (!this.eventsBound) {
            this.listenTo(this.collection, 'add', this.onModelAdded.bind(this));
            this.listenTo(this.collection, 'remove', this.onModelRemoved.bind(this));
            this.eventsBound = true;
        }
    },

    onModelAdded: function (model)
    {
        var _this = this;

        var insertedRow;
        var asyncWaitForRow = new AsyncNotificationManager(function () {
            // If it's ordered, add the row in the right place
            if (_this.order) {
                var newRowIndex = _.findIndex(_this.getSortedRows(), function (row) {
                    return row == insertedRow;
                });
                _this.$tbody.find('tr:nth-child(' + (newRowIndex + 1) + ')').after(insertedRow.$el);
            // Otherwise just add it as the beginning
            } else {
                _this.$tbody.prepend(insertedRow.$el);
            }
        });

        insertedRow = this.createRowFromModel(asyncWaitForRow, model);

        asyncWaitForRow.notifyEnd();
    },

    onModelRemoved: function (model)
    {
        var row = this.modelToRow[model.id];

        // Can be that the model has no id.
        // In that case rowId is used instead
        if (row === undefined) {
            row = this.modelToRow[model.rowId];
        }

        row.$el.remove();

        var index = _.findIndex(this.rows, function (currentRow) {
            return row.uid == currentRow.uid;
        });
        if (index > -1) {
            this.rows.splice(index, 1);
        }

        if (model.id) {
            delete this.modelToRow[model.id];
        } else {
            delete this.modelToRow[model.rowId];
        }
    },

    render: function (options) {
        this.renderData = {
            width: (100.0 / this.columns.length),
            columns: _.map(this.columns, function (column) {
                return _.extend({header: column.attr}, column); // allow for empty headers
            }),
            headerTemplate: _.template('<th style="width: ' +
                '<%= width %>%;"><%= header %></th>')
        };

        AbstractView.prototype.render.call(this, _.extend(options, {
            templateObj: this.renderData
        }));

        var _this = this;
        this.$tbody = this.$('tbody');

        if (this.hideHeader) {
            this.$('thead').hide();
        }

        options.anmgr.waitForAction();
        this.collection.fetch({
            success: this.renderRows.bind(_this, options.anmgr)
        });

        return this
    },

    initKeys: function () {
        var _this = this;

        keymage('ctrl-s', function (event) {
            _this.addingRow.onAdd();
            // Then focus on the first field of the addingRow
            // to help further inputs
            _this.addingRow.once('rerender', function () {
               _this.addingRow.$('input').first().focus(); 
            });
        }, {preventDefault: true});
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
        start = new Date();
        if (this.colIdx != colIdx) {
            this.order = ['', 'asc']
            this.colIdx = colIdx;
        } else {
            this.order = ['', this.order[1] == 'asc' ? 'desc' : 'asc']
        }

        this.rerender();
    },

    renderAddingRow: function (anmgr) {
        var _this = this;

        this.addingRow = new Kernel_View_Ui_AddingRowHelper({
            columns: this.renderData.columns,
            modelClass: this.collection.model,
            collection: this.collection,
            beforeSave: this.beforeSave,
            initializeAddingModel: this.initializeAddingModel,
        });

        anmgr.waitForAction();
        var _this = this;
        var waitForAddingRow = new AsyncNotificationManager(function () {
            _this.$tbody.before(_this.addingRow.$el);

            anmgr.notifyEnd();
        });

        this.addingRow.render({anmgr: waitForAddingRow});

        waitForAddingRow.notifyEnd();
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

                return cell.data.toLowerCase();
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
            saveAction: this.beforeSave,
            click: this.click
        });

        row.render({
            anmgr: anmgr
        });

        this.rows.push(row);

        if (model.id === undefined) {
            model.rowId = _.uniqueId();
            this.modelToRow[model.rowId] = row;
        } else {
            this.modelToRow[model.id] = row;
        }

        return row;
    }
});

var Kernel_View_Ui_AddingRowHelper = AbstractView.extend({
    initialize: function (options) {
        this.columns = options.columns;
        this.collection = options.collection;
        this.modelClass = options.modelClass;
        this.beforeSave = options.beforeSave;
        this.initializeAddingModel = options.initializeAddingModel;

        this.addButtonActive = false;
    },

    render: function (options) {
        var _this = this;

        this.tmpModel = new this.modelClass();
        if (this.initializeAddingModel) {
            this.initializeAddingModel(this.tmpModel);
        }

        // Create fake row to exploit the already written logic
        // that selects the Ui type based on the model attribute type
        this.helperRow = new Kernel_View_Ui_Row({
            model: this.tmpModel,
            columns: this.columns,
        });
        this.helperRow.insertOnEnter = this.onAdd.bind(this);

        // Use the heper row when ready
        options.anmgr.waitForAction();
        var afterRenderHelperRow = new AsyncNotificationManager(function () {
            _this.renderAddingRowFields(_this.helperRow);
            _this.initEvents();
            options.anmgr.notifyEnd();
        });

        this.helperRow.render({
            anmgr: afterRenderHelperRow,
            inlineEditing: true,
        })

        afterRenderHelperRow.notifyEnd();
    },

    renderAddingRowFields: function (helperRow) {
        var _this = this;
        var $dom = $('<tr class="adding-row"></tr>');

        this.helperRow.$el.find('td').each(function (i, td) {
            var $td = $(td);

            // copy and modify table actions
            var $tableActions = $td.find('.table-actions');
            if ($tableActions.length) {
                _this.initAddAction($tableActions);
            }
            
            $dom.append(td);
        });

        this.setElement($dom);
        this.rendered = true;
    },

    initEvents: function () {
        var _this = this;

        // Make sure the model is modified at least once before allowing saving
        // of the temporary model
        this.listenToOnce(this.tmpModel, 'change', function () {
            _this.enableSave();
        });
    },

    initAddAction: function ($tableActions) {
        // Remove actions
        $tableActions.html('');

        // Create save action
        this.$saveAction = $('<span class="table-action icon-plus-circled"></span>');
        this.$saveAction.css('opacity', '0.5');
        this.$saveAction.click(this.onAdd.bind(this));

        this.addTooltip = new Kernel_View_Ui_Tooltip('Add');
        this.addTooltip.openOnHover(this.$saveAction);

        $tableActions.append(this.$saveAction);
    },

    onAdd: function () {
        if (!this.addButtonActive) return;

        var _this = this;

        this.beforeSave(this.tmpModel);
        this.tmpModel.save();

        this.collection.add(this.tmpModel);
        
        // This is not removed otherwise
        this.addTooltip.remove();
        this.rerender();
        this.disableSave();
    },

    enableSave: function () {
        console.warn('what')
        this.addButtonActive = true;
        this.$saveAction.css('opacity', '1');
    },

    disableSave: function () {
        console.log(213);
        this.addButtonActive = false;
        this.$saveAction.css('opacity', '0.5');
    },
});
