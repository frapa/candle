var Kernel_View_Ui_Row = AbstractView.extend({
    cellTemplate: _.template('<td><%= data %></td>'),

    initialize: function (options) {
        this.uid = _.uniqueId('row_');

        this.columns = options.columns;

        this.click = options.click;
        this.actions = options.actions ? options.actions : [];
        this.inlineEditing = options.inlineEditing;
        this.inlineEditingActivated = false;
        this.saveAction = options.saveAction;

        this.buildCellData();

        this.listenToOnce(this, 'render', this.watchForChanges.bind(this));
    },

    watchForChanges: function () {
        var _this = this;

        if (!this.alreadyWatching) {
            this.alreadyWatching = true;

            this.listenTo(this.model, 'change', function () {
                if (!_this.inlineEditingActivated) {
                    _this.rerender();
                }
            });

            this.listenTo(this.model, 'sync', function () {
                // on save show fading tick
                var $tick = $('<span class="save-tick icon-check"></span>');
                _this.$('.table-actions').append($tick);
                setTimeout(function () { $tick.addClass('fade'); }, 500)
                setTimeout(function () { $tick.remove(); }, 2000);
            });
        }
    },

    buildCellData: function () {
        var _this = this;
        this.linksFetched = false;
        var onLinksFetched = new AsyncNotificationManager(function () {
            _this.trigger('links_fetched')
            _this.linksFetched = true;
        });

        this.columnData = _.map(this.columns, function (col) {
            var cellData = {
                label: col.header,
                attr: col.attr,
                link: col.link,
                computed: false,
                linkedCollection: col.linkedCollection,
                linkedCollectionInst: col.linkedCollectionInst,
                onSave: col.onSave,
            };

            if (col.attr !== undefined && col.link === undefined) {
                var data = _this.model.get(col.attr);
                cellData.data = data === undefined ? '' : data;
                cellData.type = _this.model.types[col.attr];
            } else if (col.compute !== undefined) {
                cellData.data = col.compute(_this.model, cellData, onLinksFetched);
                cellData.type = col.type;
                cellData.computed = true;
            } else if (col.method !== undefined) {
                cellData.data = _this.model[col.method](cellData, onLinksFetched);
                cellData.type = col.type;
                cellData.computed = true;
            } else if (col.link !== undefined) {
                onLinksFetched.waitForAction();
                _this.model.to(col.link)
                .fetch({
                    success: function (collection) {
                        if (collection.length === 0) {
                            cellData.data = '';
                        } else {
                            cellData.data = collection.at(0).get(col.attr);
                            cellData.collection = collection;
                        }

                        onLinksFetched.notifyEnd();
                    }
                });
                cellData.type = 'link';
            } else {
                cellData.data = '';
            };

            return cellData;
        });

        onLinksFetched.notifyEnd();
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
        /*if (inlineEditing) {
            var tooltip = new Kernel_View_Ui_Tooltip('Save');

            actions.push({
                icon: 'icon-floppy',
                callback: function () {
                    _this.saveEditedRow();
                    tooltip.remove();
                },
                tooltip: tooltip
            });
        }*/

        var $actions = _.map(actions, function (action) {
            var $actionButton = $('<span class="table-action"></span>');

            $actionButton.addClass(action.icon);
            
            var wrapCallback = function (event) {
                // Otherwise the row would be clicked
				event.stopPropagation();
				action.callback({
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

        if (inlineEditing) {
            $div.addClass('selected');
        }

        //$cell.css('position', 'relative');
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

                /*var colNum = _this.columnData.length;
                $cell.css('width', (100.0 / colNum) + '%');*/
                return $cell;
            });

            var $row = $('<tr></tr>');
            $row.append(_this.$cells);
            if (options && options.cssClasses) $row.addClass(options.cssClasses);
            if (_this.inlineEditingActivated) {
                $row.addClass('inline-editing');
                $row.prepend('<span class="inline-editing-title">Edit Transaction</span>');

                var $footer = $('<footer></footer>');
                $footer.append('<button class="flat inline-editing-cancel">Cancel</div>');
                $footer.append('<button class="flat inline-editing-save">Save</div>');
                $row.append($footer);

                $row = $('<div class="inline-editing-container"></div>').append($row);
            }

            if (_this.click) {
                var callback = _this.click.bind(_this, _this.model);
                $row.click(callback);
            }

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

        if (!this.linksFetched) {
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
                // see below; this is a flag to 
                _this.inlineEditingActivatedNow = true;
                var $current = _this.$el;

                var anmgr = new AsyncNotificationManager(function () {
                    $current.replaceWith(_this.$el);
                    _this.trigger('activated');
                    _this.initSaveOnOutsideClick();
                });

                _this.render({
                    inlineEditing: true,
                    anmgr: anmgr
                });
                anmgr.notifyEnd();
            });
        }
    },
    
    initSaveOnOutsideClick: function () {
        var _this = this;

        _this.checkOutsideClick = function (event) { 
            if (!$(event.target).closest(_this.$el).length &&
                _this.inlineEditingActivated)
            {
                _this.saveEditedRow();
            }        
        };

        // detect click outside row
        $(document).click(_this.checkOutsideClick);
    },

    saveEditedRow: function () {
        var _this = this;

        if (this.saveAction) {
            this.saveAction(this.model);
        }

        this.model.save(undefined, {
            success: function (model) {
            }
        });

        $(document).off('click', _this.checkOutsideClick);
        
        this.inlineEditingActivated = false;

        this.buildCellData();
        this.rerender();
    },

    updateModel: function (link, cell, value) {
        if (link) {
            /* For some tables it's possible to have
             * a column of type link without the attrib link set
             * to a real value. This because maybe the column
             * does not correspond to a specific attrib, but
             * the onSave is used at save time to link the correct
             * attrib. In this case we should just stop here.
             */
            if (cell.link == undefined) return;
            this.model.relink(cell.link, value);
        } else {
            if (cell.type === 'int64') {
                this.model.set(cell.attr, parseInt(value));
            } else {
                this.model.set(cell.attr, value);
            }
        }
    },

    insertOnEnter: function () {
        this.saveEditedRow();
    },

    createEditingWidget: function (cell, anmgr) {
        var _this = this;
        var $cell = $('<td class="widget">' +
            '<div class="widget-helper"></div></td>');

        if (cell.type === 'string' || cell.type === 'int64' || cell.type === 'float') {
            cell.widget = new Kernel_View_Ui_Entry({
                label: cell.label,
                onEnter: this.insertOnEnter.bind(this),
            }).render();
            cell.widget.setValue(cell.data);

            // update model on change
            if (cell.onSave !== undefined) {
                this.listenTo(cell.widget, 'change', function () {
                    cell.onSave.apply(null, [cell, _this.model]
                        .concat(Array.prototype.slice.call(arguments)));
                    _this.updateModel.apply(this, [false, cell]
                        .concat(Array.prototype.slice.call(arguments)));
                });
            } else {
                this.listenTo(cell.widget, 'change',
                    this.updateModel.bind(this, false, cell));
            }

            $cell.find('div').append(cell.widget.$el);

            return $cell
        } else if (cell.type === 'Time') {
            cell.widget = new Kernel_View_Ui_Date({
                label: cell.label,
                onEnter: this.insertOnEnter.bind(this),
            }).render();
            
            // update model on change
            if (cell.onSave !== undefined) {
                this.listenTo(cell.widget, 'change', function () {
                    cell.onSave.apply(null, [cell, _this.model]
                        .concat(Array.prototype.slice.call(arguments)));
                    _this.updateModel.apply(this, [false, cell]
                        .concat(Array.prototype.slice.call(arguments)));
                });
            } else {
                this.listenTo(cell.widget, 'change', function (date) {
                    this.updateModel(false, cell, date.toISOString());
                });
            }

            $cell.find('div').append(cell.widget.$el);

            cell.widget.setValue(cell.data);

            return $cell
        } else if (cell.type === 'link') {
            var linkedCollectionInst = cell.linkedCollectionInst;
            if (linkedCollectionInst === undefined) {
                var linkedCollection = null;
                if (cell.linkedCollection) {
                    linkedCollection = cell.linkedCollection;
                } else {
                    linkedCollection = window[this.model.linkTypes[cell.link]];
                }

                linkedCollectionInst = new linkedCollection();
            }

            cell.widget = new Kernel_View_Ui_Selectbox({
                label: cell.label,
                collection: linkedCollectionInst,
                attr: cell.attr,
                selected: cell.collection === undefined ?
                    undefined : cell.collection.at(0),
                onEnter: this.insertOnEnter.bind(this),
            })

            this.listenToOnce(cell.widget, 'render', function () {
                $cell.find('div').append(cell.widget.$el);
            });

            cell.widget.render({
                anmgr: anmgr
            });
            
            // update model on change
            if (cell.onSave !== undefined) {
                this.listenTo(cell.widget, 'change', function () {
                    cell.onSave.apply(null, [cell, _this.model]
                        .concat(Array.prototype.slice.call(arguments)));
                    _this.updateModel.apply(this, [true, cell]
                        .concat(Array.prototype.slice.call(arguments)));
                });
            } else {
                this.listenTo(cell.widget, 'change',
                    this.updateModel.bind(this, true, cell));
            }

            return $cell
        } else {
            // Fall back on defualt non-editable mode
            return $(this.cellTemplate(cell));
        }
    },
});
