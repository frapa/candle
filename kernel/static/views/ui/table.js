var Kernel_View_Ui_Table = AbstractView.extend({
    initialize: function (options) {
        this.renderData = {
            columns: options.columns,
            headerTemplate: _.template('<th><%= header %></th>')
        };
    },

    render: function () {
        AbstractView.prototype.render.call(this, this.renderData);

        var _this = this;
        this.$tbody = this.$('tbody');

        this.collection.fetch({
            success: this.renderRows.bind(_this)
        });

        return this
    },

    renderRows: function () {
        if (this.collection.length) {
            var $rows = this.collection.map(this.getElFromModel.bind(this));
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
            columns: this.renderData.columns
        });
        row.render();
        return row.$el;
    }
});
