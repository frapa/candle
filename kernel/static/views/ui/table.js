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
        AbstractView.prototype.render.call(this, {
            templateObj: this.renderData
        });

        var _this = this;
        this.$tbody = this.$('tbody');

        this.collection.fetch({
            success: this.renderRows.bind(_this)
        });

        return this
    },

    renderAddingRow: function () {
        var newModel = new this.collection.model();
        var addingRow = new Kernel_View_Ui_Row({
            model: newModel,
            empty: true,
            columns: this.renderData.columns,
            inlineEditing: true,
            actions: this.actions
        });

        return addingRow.render().$el;
    },

    renderRows: function () {
        if (this.collection.length) {
            var $rows = this.collection.map(this.getElFromModel.bind(this));

            if (this.addingRow) {
                $rows.splice(0, 0, this.renderAddingRow());
            }

            this.$tbody.append($rows);
        } else {
            var colNum = this.renderData.columns.length;
            var $tr = $('<tr><td colspan="' + colNum + '">The table is empty</td></tr>');
            this.$tbody.append($tr);
        }
    },

    getElFromModel: function (model) {
        var row = new Kernel_View_Ui_Row({
            model: model,
            columns: this.renderData.columns,
            inlineEditing: this.inlineEditing,
            actions: this.actions
        });
        row.render();
        return row.$el;
    }
});
