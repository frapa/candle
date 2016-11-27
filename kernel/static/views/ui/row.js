var Kernel_View_Ui_Row = AbstractView.extend({
    cellTemplate: _.template('<td><%= data %></td>'),

    initialize: function (options) {
        var _this = this;
        
        this.columnData = _.map(options.columns, function (col) {
            var cellData = {};

            if (col.attr !== undefined) {
                cellData.data = _this.model.get(col.attr);
            } else if (col.compute !== undefined) {
                cellData.data = col.compute(_this.model);
            } else if (col.method !== undefined) {
                cellData.data = _this.model[col.method]();
            } else {
                cellData.data = "";
            };

            return cellData;
        });
    },

    render: function () {
        var _this = this;

        var $cells = _.map(this.columnData, function (cell) {
            return $(_this.cellTemplate(cell));
        });

        var $row = $('<tr></tr>');
        $row.append($cells);

        this.setElement($row);
    }
});
