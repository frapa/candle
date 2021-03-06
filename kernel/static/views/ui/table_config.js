var Kernel_View_Ui_ConfigTable = Kernel_View_Ui_Table.extend({
    initialize: function (options) {
        Kernel_View_Ui_Table.prototype.initialize.apply(this, arguments);

        this.openConfig = options.openConfig;
    },

    render: function (options) {
        var _this = this;

        var anmgr = options.anmgr;
        var wrapTable = new AsyncNotificationManager(function () {
            _this.renderFilterIndicator();
            _this.renderConfigSidebar();

            anmgr.notifyEnd();
        });

        anmgr.waitForAction();
        options.anmgr = wrapTable;
        Kernel_View_Ui_Table.prototype.render.apply(this, arguments);

        wrapTable.notifyEnd();
    },

    renderFilterIndicator: function () {
        this.$table = this.$el;
        
        var $filterIndicator = $('<span class="icon-search"></span>');
        $filterIndicator.click(this.toggleConfigSidebar.bind(this));

        var $th = $('<th class="filter-header"></th>');
        $th.append($filterIndicator);
        this.$table.find('thead tr:first-child').append($th);
    },

    renderConfigSidebar: function () {
        this.$wrapper = $('<div class="config-table"></div>');
        this.$container = $('<div class="table-container"></div>');
        this.$configSidebar = $('<div class="table-filters ' +
            (this.openConfig ? '' : 'hidden') + '"></div>');
        this.$wrapper.append(this.$container);
        this.$wrapper.append(this.$configSidebar);

        this.$table = this.$el;
        this.$container.append(this.$table);
        this.setElement(this.$wrapper);
        
        // GLOBAL SEARCH
        this.$globalSearchContainer = $('<div class="global-search-container" /></div>');
        if (!this.searchEntry) {
            this.searchEntry = new Kernel_View_Ui_Entry({
                label: 'Search all',
                onEnter: this.searchAll.bind(this),
                onStopTyping: this.searchAll.bind(this),
            });
            this.searchEntry.render();
        }
        this.$globalSearchContainer.append(this.searchEntry.$el);
        this.$configSidebar.append(this.$globalSearchContainer);

        // LIST
        this.$filterList = $('<div class="filter-list"></div>');
        this.$configSidebar.append(this.$filterList);

        // TOOLBAR
        this.$toolbar = $('<div class="toolbar"></div>');
        // Field
        this.addSidebarToolbarButton('Add field', 'icon-plus', this.showAddFieldDialog);
        // Filter
        this.addSidebarToolbarButton('Filter', 'icon-address', this.showAddFilterDialog);
        // Aggregation
        this.addSidebarToolbarButton('Aggregate', 'icon-docs', this.addField);

        this.$configSidebar.append(this.$toolbar);
    },

    addSidebarToolbarButton: function (tooltip, icon, callback) {
        var $button = $('<span class="button ' + icon + '"></span>');
        new Kernel_View_Ui_Tooltip(tooltip).openOnHover($button);
        $button.click(callback.bind(this, $button));
        this.$toolbar.append($button);
    },

    toggleConfigSidebar: function () {
        this.openConfig = !this.openConfig;
        this.$configSidebar.toggleClass('hidden');

        if (this.openConfig) {
            this.searchEntry.focus();
        }
    },

    extractAvailableFields: function () {
        var _this = this;

        var attributes = new this.collection.model().types ||
            this.collection.at(0).attributes;
        // this second to support collection without types

        var displayedFields = [];
        this.availableFields = new QueryCollection(_.filter(
            _.map(_.keys(attributes), function (fieldName) {
                return {
                    field: fieldName
                };
            }),
            // Filter out already displayed columns
            function (fieldData) {
                var column = _.find(_this.columns, function (col) {
                    if (col.attr === fieldData.field) {
                        return true;
                    }
                    return false;
                });

                if (column === undefined) {
                    return true;
                }

                displayedFields.push(fieldData);
                return false;
            }
        ));

        this.displayedFields = new QueryCollection(displayedFields);
    },

    showAddFieldDialog: function ($button) {
        if (!this.availableFields) {
            this.extractAvailableFields();
        }

        var dialog = new Kernel_View_Ui_DialogList({
            removeOnClose: true,
            collection: this.availableFields,
            order: 'Field asc',
            click: this.addField.bind(this),
            columns: [
                {header: 'Field', attr: 'field'}
            ]
        });
		dialog.show($button, 'sc');
    },

    addField: function (fieldModel) {
        this.columns.push({
            attr: fieldModel.get('field'),
        });

        this.availableFields.remove(fieldModel);
        this.displayedFields.add(fieldModel);

        this.rerender();
    },
    
    showAddFilterDialog: function ($button) {
        if (!this.displayedFields) {
            this.extractAvailableFields();
        }

        var dialog = new Kernel_View_Ui_DialogList({
            removeOnClose: true,
            collection: this.displayedFields,
            order: 'Field asc',
            click: this.addFilter.bind(this),
            columns: [
                {header: 'Field', attr: 'field'}
            ]
        });
		dialog.show($button, 'sc');
    },

    addFilter: function (fieldModel) {
        var filterUiType = Kernel_View_Ui_FieldFilter;

        var types = new this.collection.model().types;
        if (types != undefined) {
            // for some field types we show a different filter type
            // example: dates
            var fieldType = types[fieldModel.get('field')]; 
            if (fieldType === 'Time') {
                filterUiType = Kernel_View_Ui_FieldFilter_DateFilter;
            }
        }

        if (this.filters === undefined) {
            this.filters = [];
        }

        var filterUi = new filterUiType({
            label: 'Filter "' + fieldModel.get('field') + '"',
            onEnter: this.applyFilters.bind(this),
            onStopTyping: this.applyFilters.bind(this),
            onChangeOptions: this.applyFilters.bind(this),
        });
        filterUi.attr = fieldModel.get('field');
        filterUi.render();
        this.$filterList.append(filterUi.$el);
        this.filters.push(filterUi);
    },

    computeFilterTree: function () {
        /* A filter is specified in the following way:
         * {
         *      attr: 'attrName',
         *      value: 'filterValue',
         *      type: 'contains|equal|less|greater|between',
         *      matchCase: true|false,
         *      negate: true|false,
         * }
         */
        var filterTree = [];

        _.each(this.filters, function (filter) {
            var searchString = filter.getValue();
            var filterType = filter.getType();
            var matchCase = filter.getMatchCase();
            var negate = filter.getNegate();

            filterTree.push({
                attr: filter.attr,
                value: searchString,
                type: filterType,
                matchCase: matchCase,
                negate: negate,
            });
        });

        return filterTree;
    },

    filterCollection: function (filter, collection) {
        var searchString = filter.matchCase ? filter.value : filter.value.toLowerCase();

        return new QueryCollection(collection.filter(function (model) {
            var value = filter.matchCase ?
                model.get(filter.attr) : model.get(filter.attr).toLowerCase();

            if (model.types[filter.attr] == 'Time') {
                value = new Date(value);
            }

            var found = false;
            if (filter.type == 'contains') {
                if (value.indexOf(searchString) != -1) {
                    found = true;
                }
            } else if (filter.type == 'equals') {
                found = value == searchString;
            } else if (filter.type == 'less') {
                found = value <= searchString;
            } else if (filter.type == 'greater') {
                found = value >= searchString;
            } else if (filter.type == 'between') {
                if (searchString[0] && searchString[1]) {
                    found = (value >= searchString[0] && value <= searchString[1]);
                }
            }

            return filter.negate ? !found : found;
        }));
    },

    applyFilters: function () {
        var _this = this;
        var filterTree = this.computeFilterTree();

        var collection = this.originalCollection || this.collection;
        _.each(filterTree, function (filter) {
            collection = _this.filterCollection(filter, collection);
        });
                
        if (!this.originalCollection) {
            this.originalCollection = this.collection;
        }
        this.collection = collection;

        this.rerender();
    },

    searchAll: function (searchString) {
        var _this = this;
        this.searchString = searchString;
        var searchString = searchString.toLowerCase();

        if (!this.displayedFields) {
            this.extractAvailableFields();
        }

        var collection = this.originalCollection || this.collection;
        this.filteredCollection = new QueryCollection(collection.filter(function (model) {
            var found = false;
            _this.displayedFields.find(function (fieldModel) {
                var fieldName = fieldModel.get('field');
                var value = model.get(fieldName);

                if (typeof value !== 'string') {
                    value = value.toString();
                }

                value = value.toLowerCase();

                if (value.indexOf(searchString) != -1) {
                    found = true;
                    return true;
                }

                return false;
            });

            return found;
        }));

        if (!this.originalCollection) {
            this.originalCollection = this.collection;
        }
        this.collection = this.filteredCollection;

        this.rerender();
    },

    rerender: function () {
        var _this = this;

        var rewrapTable = new AsyncNotificationManager(function () {
            _this.$table = _this.$el;
            _this.$container.children().replaceWith(_this.$table);
        });

        Kernel_View_Ui_Table.prototype.render.call(this, {
            anmgr: rewrapTable,
        });

        rewrapTable.notifyEnd();
    }
});
