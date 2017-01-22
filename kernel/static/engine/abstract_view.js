var AbstractView = Backbone.View.extend({
    render: function (options) {
        if (options === undefined) {
            options = {};
        }

        if (this.template !== undefined) {
            var templateObj = options.templateObj
            if (templateObj === undefined) {
                templateObj = {}
                if (this.hasOwnProperty('model')) {
                    templateObj = this.model.toJSON();
                } else if (this.hasOwnProperty('collection')) {
                    templateObj = this.collection.toJSON();
                }
            }

            this.setElement(this.template(templateObj));
            if (this.className) {
                this.$el.addClass(this.className);
            }

            if (this.subviews === undefined) {
                this.subviews = {};
            }
            
            _.each(this.subviews,
                this.injectSubview.bind(this, options.anmgr, undefined));
        } else {
            console.info("TEMPLATE NOT FOUND");
        }
        
        this.rendered = true;
        this.trigger('render');
        return this;
    },

    injectSubview: function (anmgr, loadingIndicator, view, subview) {
        var $subview = this.$('subview[name="' + subview + '"]');

        if ($subview.length) {
            view.renderedInto = subview;
            view.parentView = this;

            var newAnmgr = new AsyncNotificationManager(
                function () {
                    if (loadingIndicator === undefined)  {
                        $subview.replaceWith(view.$el);
                    } else {
                        loadingIndicator.$el.replaceWith(view.$el);
                        loadingIndicator.remove();
                    }
                }, anmgr
            );

            // show loading indicator before starting
            if (loadingIndicator !== undefined) {
                loadingIndicator.render();
                $subview.replaceWith(loadingIndicator.$el);
            }

            view.render({anmgr: newAnmgr});

            newAnmgr.notifyEnd();
        } else {
            console.error("View '" + subview + "' not found in template.");
        }
    },

    open: function (view, subview) {
        if (this.subviews === undefined) {
            this.subviews = {};
        }

        var currentView = this.subviews[subview];

        // Do nothing if the same action was just undertaken!
        if (currentView == view) {
            return;
        }

        if (currentView && currentView.rendered) {
            // we already generated some html for this view.
            // we need to clean it up before going on.
            
            // show that loading is in progress
            var loadingIndicator = new loadingIndicators.empty();

            var anmgr = new AsyncNotificationManager(function () {
                loadingIndicator.$el.replaceWith(view.$el);
                loadingIndicator.remove();
            });

            loadingIndicator.render();
            currentView.$el.replaceWith(loadingIndicator.$el);

            view.render({anmgr: anmgr});

            // I put this here because the content is already invisible
            // and view.render may contain asyncronous calls.
            // Therefore I try to parallelize things!
            currentView.remove();

            anmgr.notifyEnd();
        } else {
            this.injectSubview(undefined,
                new loadingIndicators.empty(), view, subview);
        }

        this.subviews[subview] = view;
    },

    close: function (subview) {
        if (this.subviews === undefined) {
            this.subviews = {};
        }
        var view = this.subviews[subview];

        if (view && view.$el !== undefined) {
            $subview = $('<subview name="' + subview + '"></subview>');
            view.$el.replaceWith($subview);        

            view.remove();

            delete this.subviews[subview];
        }
    },

    remove: function () {
        this.rendered = false;

        Backbone.View.prototype.remove.call(this);

        // Remove subviews before removing current view
        _.each(this.subviews, function (view, subview) {
            view.remove();
        });
    },

    rerender: function () {
        if (this.parentView) {
            this.parentView.close(this.renderedInto);
            this.parentView.open(this, this.renderedInto);
        } else {
            console.error("Cannot rerender: parent missing.");
        }
    }
});
