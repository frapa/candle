var Kernel_View_Ui_Selectbox = AbstractView.extend({
    scrolling: false,

    initialize: function (options) {
        if (options) {
            this.selected = options.selected;
            this.attr = options.attr;
            this.collection.comparator = this.attr;
            this.label = options.label ? options.label : '';
            this.changeCallback = options.onChange;
        }

        if (!(this.collection instanceof QueryCollection)) {
            this.collection = new QueryCollection(this.collection);
        }
    },

    render: function (options) {
        var _this = this;

        if (this.collection) {
            options.anmgr.waitForAction();
            this.collection.fetch({
                success: function () {
                    AbstractView.prototype.render.call(_this,
                        _.extend(options, {
                            templateObj: {
                                label: _this.label
                            }
                        })
                    );
                    _this.initializeSearch();
                    _this.renderItems();
                    _this.trigger('render');
                    options.anmgr.notifyEnd();
                }
            });
        }

        return this;
    },

    notifyChange: function (item) {
        if (this.changeCallback) {
            this.changeCallback(item);
        }
    },

    initListeners: function () {
        var _this = this;
        var $input = this.$('.selectbox-input');

        _.each(this.items, function (item) {
            // Click event for items in the list
            item.$item
            .on('mousedown', function (event) {
                // Here we want to stop the input from being blurred
                // before we can get the click event on items.
                event.preventDefault();
            })
            .click(function () {
                var newValue = item.$item.html();
                if (newValue) {
                    $input[0].value = newValue;
                    _this.selected = item.model;
                    _this.trigger('change', item.model);
                    // Having blocked the event, we need to blur manually
                    $input.blur();
                }
            })
            .on('mouseover', function () {
                // Stop scrolling if, while the selectbox list is
                // being scrolled with the keyboard, the mouse is
                // hovered on a item.
                if (_this.scrolling) {
                    _this.scrolling = false;
                    return;
                }

                _.each(_this.items, function (item_) {
                    item_.$item.removeClass('hover');
                    item_.selected = false;
                });

                item.selected = true;
                item.$item.addClass('hover');
            });
        });

        $input
        .blur(function (event) {
            // Check if the input is correct
            var val = $input[0].value;

            var index = _this.validValues.indexOf(val.toLowerCase());
            if (index == -1) {
                $input[0].value = _this.previousValue;
                $input.css('color', 'unset');
            } else {
                item = _this.items[index];
                $input[0].value = item.model.get(_this.attr);
                _this.previousValue = val;
                _this.selected = item.model;
            }
        })
        .focus(function () {
            // Limit list length
            _this.setMaxListHeight();
        })
        .on('input', function () {
            // Search in the list
            _this.search();
        })
        .on('keydown', function (event) {
            // Implement arrows and selection with enter
            switch (event.key) {
            case "ArrowDown":
                _this.select(1);
                break;
            case "ArrowUp":
                _this.select(-1);
                break;
            case "ArrowRight":
            case "Enter":
                _.find(_this.items, function (item) {
                    if (item.selected) {
                        // simulate click
                        item.$item.trigger('click');
                        _this.$('.selectbox').hide();
                        _this.trigger('change', item.model);
                        return true;
                    }
                    return false;
                });
                break;
            case "Escape":
            }
        })
        // If item was selected with the keyboard and list was
        // closed, we still want to show the list, even tough
        // the input is already focused
        .click(function () {
            _this.$('.selectbox').show();
        });

        var justClosed = false;
        var $arrow = this.$('.selectbox-arrow');
        $arrow
        .click(function (event) 
        {
            if (!justClosed) {
                $input.focus();
            }
        })
        .on('mousedown', function (event) 
        {
            justClosed = $input[0] == document.activeElement;
            if (justClosed) {
                $input.blur();
            }
        });

        this.listenTo(this, 'change', this.notifyChange.bind(this));
    },

    // Select previous or next element through the keyboard
    select: function (mod) {
        var activeItems = _.filter(this.items, function (item) {
            return item.visible;
        });

        var activatedItem = null;
        var found = _.find(activeItems,
            function (item, index, items)
        {
            if (item.selected) {
                var newItem = items[index + mod];

                if (newItem) {
                    item.selected = false;
                    item.$item.removeClass('hover');

                    newItem.selected = true;
                    newItem.$item.addClass('hover');
                    activatedItem = newItem;
                }

                return true;
            }

            return false;
        }) !== undefined; // find returns undefined if no element is found

        if (!found) {
            if (mod === 1) {
                activatedItem = activeItems[0];
            } else {
                var activated = activeItems.length-1;
                activatedItem = activeItems[activated];
            }

            activatedItem.selected = true;
            activatedItem.$item.addClass('hover');
        }

        // make sure the activated item is visible
        var $list = this.$('.selectbox').show();

        if (activatedItem) {
            var _this = this;
            var currentY = $list.scrollTop();
            var y = activatedItem.$item[0].offsetTop;

            if (mod === 1) {
                var listHeight = this.listHeight * utils.emSize;
                var itemHeight = utils.computeHeight(activatedItem.$item) * utils.emSize;
                if (currentY > (listHeight - y)) {
                    _this.scrolling = true;
                    $list.scrollTop(y - listHeight + itemHeight);
                }
            } else {
                if (currentY > y) {
                    _this.scrolling = true;
                    $list.scrollTop(y);
                }
            }
        }   
    },

    initializeSearch: function () {
        if (!this.attr) {
            console.error("Selectbox should have an 'attr' option.");
            return;
        }

        if (this.selected) { 
            if (!this.attr) {
                this.previousValue = '';
            } else {
                this.previousValue = this.selected.get(this.attr);
            }

            this.$('.selectbox-input')[0].value = this.previousValue;
        } else {
            this.previousValue = '';
        }
    },

    search: function () {
        var searchTerms = this.$('.selectbox-input')[0]
            .value.toLowerCase();

        var numResults = 0;
        _.each(this.items, function (item) {
            if (item.value.indexOf(searchTerms) !== -1) {
                numResults += 1;
                item.$item.show();
                item.visible = true;
            } else {
                item.$item.hide();
                item.visible = false;
            }
        });

        if (numResults === 0) {
            this.$('.selectbox').hide();
            this.$('.selectbox-input').css('color', 'red');
        } else {
            this.$('.selectbox').show();
            this.$('.selectbox-input').css('color', 'initial');
        }
    },

    // Makes sure the list doesn't go out of the page
    setMaxListHeight: function () {
        var $list = this.$('.selectbox');
        var startY = utils.computePosRelToBody($list)[1];
        var pageHeight = utils.computeHeight($(document.body));
        this.listHeight = (pageHeight-startY-1);
        $list.css('max-height', this.listHeight + 'em');
    },

    renderItems: function () {
        var _this = this;
        this.items = [];
        this.validValues = [];

        this.collection.each(function (model) {
            var displayValue = model.get(_this.attr);
            var $item = $('<div class="selectbox-item">' + displayValue + '</div>');

            if (_this.selected && model.get('Id') === _this.selected.get('Id')) {
                $item.addClass('selected');
            }

            if (typeof displayValue != 'string') {
                displayValue = displayValue.toString();
            }

            var value = displayValue.toLowerCase();
            _this.validValues.push(value);
            _this.items.push({
                $item: $item,
                model: model,
                value: value,
                visible: true, // for search
                selected: false // for keyboard input
            });
        });

        var getItems = function (item) {
            return item.$item;
        };

        this.$('.selectbox-list')
            .append(_.map(this.items, getItems));
        this.initListeners();
    },

    getSelectedModel: function () {
        return this.selected;
    },

    getValue: function () {
        return this.getSelectedModel();
    },
});
