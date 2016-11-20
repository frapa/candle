var AbstractView = Backbone.View.extend({
    render: function (templateObj) {
        if (this.template !== undefined) {
            if (templateObj === undefined) {
                templateObj = {}
                if (this.hasOwnProperty('model')) {
                    templateObj = this.model.toJSON();
                } else if (this.hasOwnProperty('collection')) {
                    templateObj = this.collection.toJSON();
                }
            } 

            this.setElement(this.template(templateObj));

            if (this.subviews === undefined) {
                this.subviews = {};
            }
            _.each(this.subviews, this.injectSubview.bind(this));
        } else {
            console.info("TEMPLATE NOT FOUND");
        }
        
        this.rendered = true;
        return this;
    },

    injectSubview: function (view, subview) {
        var $subview = this.$('subview[name="' + subview + '"]');

        if ($subview.length) {
            view.render()
            $subview.replaceWith(view.$el);
        } else {
            console.error("View '" + subview + "' not found in template.");
        }
    },

    open: function(view, subview) {
        if (this.subviews === undefined) {
            this.subviews = {};
        }

        var currentView = this.subviews[subview];

        if (currentView && currentView.rendered) {
            // we already generated some html for this view.
            // we need to clean it up before going on.
            view.render()
            currentView.$el.replaceWith(view.$el);
            currentView.remove();
        } else {
            this.injectSubview(view, subview);
        }

        this.subviews[subview] = view;
    },

    close: function(subview) {
        if (this.subviews === undefined) {
            this.subviews = {};
        }
        var view = this.subviews[subview];

        if (view && view.$el !== undefined) {
            view.remove();
        }
    },

    remove: function() {
        Backbone.View.prototype.remove.call(this);

        // Remove subviews before removing current view
        _.each(this.subviews, function (view, subview) {
            view.remove();
        });
    }
});
