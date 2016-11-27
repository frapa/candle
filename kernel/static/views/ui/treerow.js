var Kernel_View_Ui_Treerow = Kernel_View_Ui_Row.extend({
    cellTemplate: _.template('<td><%= data %> <%= count %></td>'),

    initialize: function (options) {
        this.children = options.children;
        this.actions = options.actions;
        this.createSubRows(options);
        Kernel_View_Ui_Row.prototype.initialize.call(this, options);
    },

    createSubRows: function (options) {
        var _this = this;
        this.subRows = [];

        _.each(this.children, function (child) {
            var row = new Kernel_View_Ui_Treerow({
                model: child.model,
                children: child.children,
                columns: options.columns,
                actions: options.actions
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
     */
    renderActions: function ($cell) {
        var $div = $('<div class="table-actions"></div>');

        var $actions = _.map(this.actions, function (action) {
            var $actionButton = $('<span class="table-action"></span>');

            $actionButton.addClass(action.icon);
            $actionButton.click(action.callback);

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

        var _this = this;

        var $cells = _.map(this.columnData, function (cell, i) {
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
        $row.append($cells);

        this.renderActions(_.last($cells));

        this.setElement($row);

        // Add subrows into another subtable
        if (this.subRows.length) {
            this.$subRow = $('<tr class="treeSubRow"><td colspan="' +
                this.columnData.length + '"></td></tr>');
            this.$subTable = $('<table class="treeSubTable"></table>');

            _.invoke(this.subRows, 'render', level+1);
            var $rows = _.flatten(_.map(this.subRows, function (row) {
                return [row.$el, row.$subRow];
            }), true);

            this.$subTable.append($rows);
            this.$subRow.children().first().append(this.$subTable)
        } else {
            this.$subRow = $([]);
        }

        return this
    },

    addUnfoldingIndicator: function (cell, level) {
        var $indicator = $('<span class="unfold-indicator ' +
            (this.children.length ? 'icon-down-open-mini' : '') + '"></span>')
        
        // This adds margin-left to nest the tree and show it properly
        $indicator.css('margin-left', (level * 1.4) + 'em')

        var _this = this;
        $indicator.click(function () {
            $indicator.toggleClass('icon-down-open-mini icon-right-open-mini');
            _this.$subRow.toggle();
        });

        cell.prepend($indicator);
    }
});
