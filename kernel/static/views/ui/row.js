var Kernel_View_Ui_Row = AbstractView.extend({
    cellTemplate: _.template('<td><%= data %></td>'),

    initialize: function (options) {
        this.actions = options.actions ? options.actions : [];
        this.inlineEditing = options.inlineEditing;
        this.inlineEditingActivated = false;
        this.saveAction = options.saveAction;
        this.columns = options.columns;

        this.buildCellData();
    },

    buildCellData: function () {
        this.linksFetched = false;

        var _this = this;
        var linkCount = 0;
        this.columnData = _.map(this.columns, function (col) {
            var cellData = {
                attr: col.attr,
                link: col.link,
            };
                
            if (col.attr !== undefined && col.link === undefined) {
                var data = _this.model.get(col.attr);
                cellData.data = data === undefined ? '' : data;
                cellData.type = _this.model.types[col.attr];
            } else if (col.compute !== undefined) {
                cellData.data = col.compute(_this.model);
            } else if (col.method !== undefined) {
                cellData.data = _this.model[col.method]();
            } else if (col.link !== undefined) {
                if (_this.model.isNew()) {
                    cellData.data = '';
                } else {
                    linkCount++;
                    _this.model.to(col.link)
                    .fetch({
                        success: function (collection) {
                            if (collection.length === 0) {
                                cellData.data = '';
                            } else {
                                cellData.data = collection.at(0).get(col.attr);
                                cellData.collection = collection;
                            }

                            linkCount--;
                            if (linkCount == 0) {
                                _this.trigger('links_fetched')
                                _this.linksFetched = true;
                            }
                        }
                    });
                }
                cellData.type = 'link';
            } else {
                cellData.data = '';
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
                    _this.saveEditedRow();
                    tooltip.remove();
                },
                tooltip: tooltip
            });
        }

        var $actions = _.map(actions, function (action) {
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
			
            $actionButton.click( wrapCallback);

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

    render: function (options) {
        var _this = this;
        
        if (options === undefined) {
            options = {};
        }

        var renderIntern = function (wait) {
            _this.$cells = _.map(_this.columnData, function (cell) {
                var $cell = null;

                if (options.inlineEditing) {
                    $cell = _this.createEditingWidget(cell, options.anmgr);
                } else {
                    if (cell.type === 'Time') {
                        var date = cell.data;
                        if (date === '0001-01-01T00:00:00Z') {
                            date = '';
                        }

                        var newCell = _.clone(cell);
                        newCell.data = date ?
                            global.dateFormat(new Date(date)) : '';

                        $cell = $(_this.cellTemplate(newCell));
                    } else {
                        $cell = $(_this.cellTemplate(cell));
                    }
                }

                var colNum = _this.columnData.length;
                $cell.css('width', (100.0 / colNum) + '%');
                return $cell;
            });

            var $row = $('<tr></tr>');
            $row.append(_this.$cells);

            _this.setElement($row);

            _this.renderActions(_.last(_this.$cells), options.inlineEditing);
            // Initialize listeners if it wasn't already done.
            if (_this.inlineEditing && !options.inlineEditing) {
                _this.inlineEditingListeners();
            }

            _this.trigger('render');
            if (wait) {
                options.anmgr.notifyEnd();
            }
        };

        if (!this.linksFetched && !this.model.isNew()) {
            options.anmgr.waitForAction();
            this.listenToOnce(this, 'links_fetched',
                renderIntern.bind(null, true));
        } else {
            renderIntern(false);
        }

        return this;
    },

    inlineEditingListeners: function () {
        var _this = this;

        if (!this.inlineEditingActivated) {
            this.$el
            .click(function () {
                _this.inlineEditingActivated = true;
                var $current = _this.$el;

                var anmgr = new AsyncNotificationManager(function () {
                    $current.replaceWith(_this.$el);
                    _this.trigger('activated');
                });

                _this.render({
                    inlineEditing: true,
                    anmgr: anmgr
                });
                anmgr.notifyEnd();
            })
        }
    },

    saveEditedRow: function () {
        if (this.saveAction) {
            this.saveAction(this.model);
        }

        this.model.save();

        this.inlineEditingActivated = false;

        var $current = this.$el;
        var _this = this;
        var replaceWhenReady = new AsyncNotificationManager(function () {
            $current.replaceWith(_this.$el);
            _this.trigger('saved');
        });

        this.buildCellData(true);
        this.render({
            inlineEditing: false,
            anmgr: replaceWhenReady
        });
        
        replaceWhenReady.notifyEnd();
    },

    updateModel: function (link, cell, value) {
        if (link) {
            this.model.relink(cell.link, value);
        } else {
            if (cell.type === 'int64') {
                this.model.set(cell.attr, parseInt(value));
            } else {
                this.model.set(cell.attr, value);
            }
        }
    },

    createEditingWidget: function (cell, anmgr) {
        if (cell.type === 'string' || cell.type === 'int64') {
            cell.widget = new Kernel_View_Ui_Entry().render();
            cell.widget.setValue(cell.data);

            // update model on change
            this.listenTo(cell.widget, 'change',
                this.updateModel.bind(this, false, cell));

            var $cell = $('<td class="widget">' +
                '<div class="widget-helper"></div></td>');
            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else if (cell.type === 'Time') {
            cell.widget = new Kernel_View_Ui_Date().render();
            cell.widget.setValue(cell.data);
            
            // update model on change
            this.listenTo(cell.widget, 'change', function (date) {
                this.updateModel(false, cell, date.toISOString());
            });

            var $cell = $('<td class="widget">' +
                '<div class="widget-helper"></div></td>');
            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else if (cell.type === 'link') {
            var linkedCollection = window[this.model.linkTypes[cell.link]];
            cell.widget = new Kernel_View_Ui_Selectbox({
                collection: new linkedCollection(),
                attr: cell.attr,
                selected: cell.collection === undefined ?
                    undefined : cell.collection.at(0)
            }).render({
                anmgr: anmgr
            });

            var $cell = $('<td class="widget">' +
                '<div class="widget-helper"></div></td>');

            this.listenToOnce(cell.widget, 'render', function () {
                $cell.find('div').append(cell.widget.$el);
            });
            
            // update model on change
            this.listenTo(cell.widget, 'change',
                this.updateModel.bind(this, true, cell));

            return $cell
        } else {
            // Fall back on defualt non-editable mode
            return $(this.cellTemplate(cell));
        }
    }
});
