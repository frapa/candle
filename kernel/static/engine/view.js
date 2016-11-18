var AbstractView = Backbone.View.extend({
    render: function () {
        if (this.template !== undefined) {
            var templateObj = {};
            if (this.hasOwnProperty('model')) {
                templateObj = this.model.toJSON();
            } else if (this.hasOwnProperty('collection')) {
                templateObj = this.collection.toJSON();
            }

            this.setElement(this.template(templateObj));
            _.each(this.subviews, this.injectSubview.bind(this));
        }
        
        return this;
    },

    injectSubview: function (view, subview) {
        $subview = this.$('subview[name="' + subview + '"]');

        if ($subview.length) {
            $subview.replaceWith(view.render().$el);
        } else {
            console.error("View '" + subview + "' not found in template.");
        }
    },

    open: function(view, subview) {
        if (!this.hasOwnProperty('subviews')) {
            this.subviews = {};
        }

        currentView = this.subviews[subview];

        if (currentView && currentView.$el !== undefined) {
            // we already generated some html for this view.
            // we need to clean it up before going on.
            currentView.$el.replaceWith(view.render().$el);
            currentView.remove();
        } else {
            this.injectSubview(view, subview);
        }

        this.subviews[subview] = view;
    },

    close: function(subview) {
        if (!this.hasOwnProperty('subviews')) {
            this.subviews = {};
        }
        view = this.subviews[subview];

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
