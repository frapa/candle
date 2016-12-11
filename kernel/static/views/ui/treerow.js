var Kernel_View_Ui_Treerow = Kernel_View_Ui_Row.extend({
    cellTemplate: _.template('<td><%= data %> <span class="count"><%= count %></span></td>'),

    initialize: function (options) {
        this.parent = options.parent;
        this.children = options.children;
        this.childCollection = options.childCollection;
        this.columns = options.columns;
        this.actions = options.actions;
        this.childrenAttr = options.childrenAttr;
        this.click = options.click;

        this.createSubRows(options);
        Kernel_View_Ui_Row.prototype.initialize.call(this, options);
    },

    updateCount: function () {
        var newCount = this.countChildren();

        if (newCount) {
            this.$('.count').first().html('(' + newCount + ')')
        } else {
            // We need to remove the whole subtable
            this.$subRow.remove();
            delete this.$subRow;

            // Remove count
            this.$('.count').html('');

            // Finally we need to remove the Unfolding-indicator
            this.$('.unfold-indicator')
                .removeClass('icon-down-open-mini')
                .removeClass('icon-right-open-mini');
        }

        if (this.parent != null) {
            this.parent.updateCount();
        }
    },

    initListenersAfterRender: function () {
        var _this = this;

        this.listenTo(this.childCollection, 'add', function (element) {
            // Before sync the Id does not exist.
            _this.listenToOnce(element, 'sync', function () {
                var newNode = {
                    model: element,
                    children: [],
                    childCollection: element.to(_this.childrenAttr)
                };
                _this.children.push(newNode);

                var newRow = new Kernel_View_Ui_Treerow({
                    model: element,
                    children: [],
                    childCollection: element.to(_this.childrenAttr),
                    columns: _this.columns,
                    actions: _this.actions,
                    parent: _this,
                    childrenAttr: _this.childrenAttr,
                    click: _this.click
                });
                _this.subRows.push(newRow);

                if (_this.$subRow === undefined) {
                    _this.generateSubRowHtml();
                    _this.showUnfoldingIndicator();
                    _this.$subRow.insertAfter(_this.$el);
                }

                newRow.render(_this.level+1);
                _this.$subTable.append([newRow.$el, newRow.$subRow]);
                _this.updateCount();
            });
        });

        this.listenTo(this.childCollection, "remove", function (element) {
            var index = -1;
            var deletedRow = _.find(_this.subRows, function (row) {
                index += 1;
                return row.model.get('Id') === element.get('Id');
            });

            _this.subRows.splice(index, 1);
            _this.updateCount();

            deletedRow.remove();
        });
    },

    createSubRows: function (options) {
        var _this = this;
        this.subRows = [];

        _.each(this.children, function (child) {
            var row = new Kernel_View_Ui_Treerow({
                model: child.model,
                children: child.children,
                childCollection: child.childCollection,
                columns: options.columns,
                actions: options.actions,
                parent: _this,
                childrenAttr: options.childrenAttr,
                click: options.click
            });
            _this.subRows.push(row);
        });
    },

    countChildren: function () {
        return _.reduce(this.subRows, function (partialSum, row) {
            return partialSum + 1 + row.countChildren();
        }, 0);
    },

    /* Actions can be specified with the following object
     *  {
     *      icon: 'icon-plus-squared',
     *      callback: function () {},
     *      tooltip: 'example'
     *  }
     *
     *  The this pointer of the callback is set to the button
     *  element.
     */
    renderActions: function ($cell) {
        var $div = $('<div class="table-actions"></div>');

        var _this = this;
        var $actions = _.map(this.actions, function (action) {
            var $actionButton = $('<span class="table-action"></span>');

            $actionButton.addClass(action.icon);

            var wrapCallback = function (event) {
                // Otherwise the row would be clicked
                event.stopPropagation();
                action.callback.apply({
                    $button: $actionButton,
                    row: _this,
                    rowData: _this.columnData,
                    model: _this.model,
                    childCollection: _this.childCollection
                });
            };
            
            $actionButton.click(wrapCallback);

            action.tooltip.openOnHover($actionButton);

            return $actionButton;
        });

        $div.append($actions);

        $cell.css('position', 'relative');
        $cell.append($div);
    },

    render: function (level) {
        if (level === undefined) {
            level = 0;
        }
        this.level = level;

        var _this = this;

        this.$cells = _.map(this.columnData, function (cell, i) {
            var count = _this.countChildren();
            if (count && i == 0) {
                _.extendOwn(cell, {count: '(' + count + ')'});
            } else {
                _.extendOwn(cell, {count: ''});
            }

            var $cell = $(_this.cellTemplate(cell));

            if (i == 0) {
                _this.addUnfoldingIndicator($cell, level);
            }

            return $cell;
        });

        var $row = $('<tr></tr>');
        $row.append(this.$cells);
        if (this.click) {
            var callback = this.click.bind(this, this.model);
            $row.click(callback);
        }

        this.renderActions(_.last(this.$cells));

        this.setElement($row);

        // Add subrows into another subtable
        if (this.subRows.length) {
            this.generateSubRowHtml();

            _.invoke(this.subRows, 'render', level+1);
            var $rows = _.flatten(_.map(this.subRows, function (row) {
                return [row.$el, row.$subRow];
            }), true);

            this.$subTable.append($rows);
        } else {
            this.$subRow = $([]);
        }

        this.initListenersAfterRender();
        return this;
    },

    generateSubRowHtml: function () {
        this.$subRow = $('<tr class="treeSubRow"><td colspan="' +
            this.columnData.length + '"></td></tr>');
        this.$subTable = $('<table class="table treeSubTable"></table>');
        this.$subRow.children().first().append(this.$subTable);
    },

    showUnfoldingIndicator: function () {
        this.$('.unfold-indicator').addClass('icon-down-open-mini');
    },

    addUnfoldingIndicator: function (cell, level) {
        var $indicator = $('<span class="unfold-indicator ' +
            (this.children.length ? 'icon-down-open-mini' : '') + '"></span>')
        
        // This adds margin-left to nest the tree and show it properly
        $indicator.css('margin-left', (level * 1.4) + 'em')

        var _this = this;
        $indicator.click(function (event) {
            $indicator.toggleClass('icon-down-open-mini icon-right-open-mini');
            _this.$subRow.toggle();
            event.stopPropagation();
        });

        cell.prepend($indicator);
    }
});
