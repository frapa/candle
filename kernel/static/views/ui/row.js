var Kernel_View_Ui_Row = AbstractView.extend({
    cellTemplate: _.template('<td><%= data %></td>'),

    initialize: function (options) {
        this.actions = options.actions ? options.actions : [];
        this.inlineEditing = options.inlineEditing;
        this.inlineEditingActivated = false;
        
        var _this = this;
        this.columnData = _.map(options.columns, function (col) {
            var cellData = {
                attr: col.attr,
                link: col.link,
                linkDisplayAttr: col.linkDisplayAttr
            };
                
            if (col.attr !== undefined) {
                var data = _this.model.get(col.attr);
                cellData.data = data === undefined ? 'Insert here...' : data;
                cellData.type = _this.model.types[col.attr];
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
    renderActions: function ($cell, inlineEditing) {
        var _this = this;

        var $div = $('<div class="table-actions"></div>');

        var actions = this.actions.slice();
        if (inlineEditing) {
            var tooltip = new Kernel_View_Ui_Tooltip('Save');

            actions.push({
                icon: 'icon-floppy',
                callback: function () {
                    console.info(_this.model);
                    _this.model.save();

                    var $current = _this.$el;
                    _this.render(false);
                    $current.replaceWith(_this.$el);
                    tooltip.remove();
                    
                    _this.inlineEditingActivated = false;
                },
                tooltip: tooltip
            });
        }

        var $actions = _.map(actions, function (action) {
            var $actionButton = $('<span class="table-action"></span>');

            $actionButton.addClass(action.icon);
            $actionButton.click(action.callback.bind({
                $button: $actionButton,
                row: _this,
                rowData: _this.columnData,
                model: _this.model,
                childCollection: _this.childCollection
            }));

            action.tooltip.openOnHover($actionButton);

            return $actionButton;
        });

        $div.append($actions);

        if (inlineEditing) {
            $div.addClass('selected');
        }

        $cell.css('position', 'relative');
        $cell.append($div);
    },


    render: function (inlineEditing) {
        var _this = this;

        this.$cells = _.map(this.columnData, function (cell) {
            if (inlineEditing) {
                return _this.createEditingWidget(cell);
            } else {
                return $(_this.cellTemplate(cell));
            }
        });

        var $row = $('<tr></tr>');
        $row.append(this.$cells);

        this.setElement($row);

        this.renderActions(_.last(this.$cells), inlineEditing);

        // Initialize listeners if it wasn't already done.
        if (this.inlineEditing && !inlineEditing) {
            this.inlineEditingListeners();
        }
        return this;
    },

    inlineEditingListeners: function () {
        var _this = this;

        if (!this.inlineEditingActivated) {
            this.$el.click(function () {
                var $current = _this.$el;
                _this.render(true);
                $current.replaceWith(_this.$el);
                _this.inlineEditingActivated = true;
            });
        }
    },

    updateModel: function (attr, value) {
        this.model.set(attr, value);
    },

    createEditingWidget: function (cell) {
        if (cell.type === 'string') {
            cell.widget = new Kernel_View_Ui_Entry().render();
            cell.widget.setValue(cell.data);

            // update model on change
            this.listenTo(cell.widget, 'change',
                this.updateModel.bind(this, cell.attr));

            var $cell = $('<td><div class="widget-helper"></div></td>');
            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else if (cell.type === 'Time') {
            cell.widget = new Kernel_View_Ui_Date().render();
            cell.widget.setValue(cell.data);

            var $cell = $('<td><div class="widget-helper"></div></td>');
            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else if (cell.type === 'link') {
            var linkedCollection = this.model.linkTypes[cell.attr];
            cell.widget = new Kernel_View_Ui_Selectbox({
                collection: new linkedCollection(),
                attr: cell.linkDisplayAttr,
            }).render();

            var $cell = $('<td><div class="widget-helper"></div></td>');
            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else {
            // Fall back on defualt non-editable mode
            return $(this.cellTemplate(cell));
        }
    }
});
