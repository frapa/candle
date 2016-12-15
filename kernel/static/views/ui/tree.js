var Kernel_View_Ui_Tree = AbstractView.extend({
    initialize: function (options) {
        var _this = this;

        this.rows = [];
        this.childrenAttr = options.children;
        this.columns = options.columns;
        this.click = options.click;

        // transform tooltips into tooltip ui components
        this.actions = _.map(options.actions, function (action) {
            action.tooltip = new Kernel_View_Ui_Tooltip(action.tooltip);
            return action;
        });

        this.renderData = {
            columns: this.columns,
            headerTemplate: _.template('<th><%= header %></th>')
        };
    },

    initListenersAfterRender: function () {
        var _this = this;

        this.listenTo(this.collection, 'add', function (element) {
            // We need to wait until the element has been persisted
            // otherwise the Id is not yet available
            _this.listenToOnce(element, 'sync', function () {
                var newNode = {
                    model: element,
                    children: [],
                    childCollection: element.to(_this.childrenAttr)
                };
                _this.tree.push(newNode);

                this.$tbody.append(_.flatten(_this.generateRow(newNode)));
            });
        });

        this.listenTo(this.collection, "remove", function (element) {
            var deletedRow = _.find(_this.rows, function (row) {
                return row.model.get('Id') === element.get('Id');
            });
            deletedRow.remove();
        });
    },

    buildTree: function (callback) {
        var _this = this;

        this.tree = [];
        
        var numRemaining = 1;
        var appendCollection = function (array, callback, collection) {
            numRemaining -= 1;

            collection.forEach(function (model) {
                var childCollection = model.to(_this.childrenAttr);

                var modelObj = {
                    model: model,
                    children: [],
                    childCollection: childCollection
                };

                array.push(modelObj);

                numRemaining += 1
                childCollection.fetch({
                    success: appendCollection.bind(null,
                        modelObj.children, callback)
                });
            });

            if (numRemaining === 0) {
                callback();
            }
        };

        appendCollection(this.tree, callback, this.collection);
    },

    render: function (options) {
        AbstractView.prototype.render.call(this, {
            templateObj: this.renderData
        });

        var _this = this;
        this.$tbody = this.$('tbody');

        if (options.anmgr) {
            options.anmgr.waitForAction();
        }
        this.collection.fetch({
            success: function () {
                // Build tree structure
                _this.buildTree(_this.renderRows.bind(_this, options.anmgr));
            }
        });
        
        return this;
    },

    renderRows: function (anmgr) {
        if (this.tree.length) {
            //_.invoke(this.rows, 'remove');
            var $rows = _.flatten(this.tree.map(this.generateRow.bind(this)), true);
            this.$tbody.append($rows);
        } else {
            var colNum = this.renderData.columns.length;
            var $tr = $('<tr><td colspan="' + colNum + '">The tree is empty</td></tr>');
            this.$tbody.append($tr);
        }

        if (anmgr) {
            anmgr.notifyEnd();
        }
    },

    generateRow: function (node) {
        var row = new Kernel_View_Ui_Treerow({
            model: node.model,
            children: node.children,
            childCollection: node.childCollection,
            columns: this.columns,
            actions: this.actions,
            parent: null,
            childrenAttr: this.childrenAttr,
            click: this.click
        });
        this.rows.push(row);

        row.render();
        return [row.$el, row.$subRow];
    }
});
