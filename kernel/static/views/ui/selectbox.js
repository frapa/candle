var Kernel_View_Ui_Selectbox = AbstractView.extend({
    scrolling: false,

    initialize: function (options) {
        if (options) {
            this.selected = options.selected;
            this.attr = options.attr;
            this.collection.comparator = this.attr;
            this.label = options.label ? options.label : '';
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
                    options.anmgr.notifyEnd();
                }
            });
        }

        return this;
    },

    initListeners: function () {
        var _this = this;

        _.each(this.items, function (item) {
            // Click event for items in the list
            item.$item
            .click(function () {
                var newValue = item.$item.html();
                if (newValue) {
                    _this.$('.selectbox-input')[0].value = newValue;
                    _this.selected = item.model;
                }
            })
            .on('mouseover', function () {
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

        this.$('.selectbox-input')
        .blur(function () {
            // Check if the input is correct
            var val = _this.$('.selectbox-input')[0].value;

            var index = _this.validValues.indexOf(val.toLowerCase());
            var $input = _this.$('.selectbox-input');
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
        .on('keypress', function (event) {
            // Implement arrows and selection with enter
            switch (event.code) {
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
                        return true;
                    }
                    return false;
                });
                break;
            case "Escape":
            }
        })
        .click(function () {
            _this.$('.selectbox').show();
        });
    },

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

        this.previousValue = this.selected.get(this.attr);
        this.$('.selectbox-input')[0].value = this.selected.get(this.attr);
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

            if (model.get('Id') === _this.selected.get('Id')) {
                $item.addClass('selected');
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
    }
});
