define([
    'underscore', 'jquery', 'backbone', "model/application", "model/app-tree", "model/location",
    "view/home", "view/application-explorer", "view/catalog"
], function (_, $, Backbone, Application, AppTree, Location, HomeView, ExplorerView, CatalogView) {

    // add close method to all views for clean-up
	// (NB we have to update the prototype _here_ before any views are instantiated;
	//  see "close" called below in "showView") 
    Backbone.View.prototype.close = function () {
        // call user defined close method if exists
        if (this.beforeClose) {
            this.beforeClose()
        }
        for (var index in this._periodicFunctions) {
            clearInterval(this._periodicFunctions[index])
        }
        this.remove()
        this.unbind()
    }
    
    // registers a callback (cf setInterval) but it cleanly gets unregistered when view closes
    Backbone.View.prototype.callPeriodically = function (callback, interval) {
        if (!this._periodicFunctions) {
            this._periodicFunctions = []
        }
        this._periodicFunctions.push(setInterval(callback, interval))
    }


    var Router = Backbone.Router.extend({
        routes:{
            'v1/home':'homePage',
            'v1/applications':'applicationsPage',
            'v1/locations':'catalogPage',
            'v1/catalog':'catalogPage',
            '*path':'defaultRoute'
        },
        showView:function (selector, view) {
            // close the previous view - does binding clean-up and avoids memory leaks
            if (this.currentView) this.currentView.close()
            // render the view inside the selector element
            $(selector).html(view.render().el)
            this.currentView = view
            return view
        },
        
        defaultRoute:function () {
            this.homePage()
        },
        
        applications:new Application.Collection,
        appTree:new AppTree.Collection,
        locations:new Location.Collection,
        
        homePage:function () {
            var that = this;
            // render the page after we fetch the collection -- no rendering on error
            this.applications.fetch({success:function () {
                var homeView = new HomeView({
                    collection:that.applications,
                    locations:that.locations,
                    appRouter:that
                })
                that.showView("#application-content", homeView);
            }})
        },
        applicationsPage:function () {
            var that = this
            this.appTree.fetch({success:function () {
                var appExplorer = new ExplorerView({
                    collection:that.appTree,
                    appRouter:that
                })
                that.showView("#application-content", appExplorer)
            }})
        },
        catalogPage:function () {
            var that = this
            this.locations.fetch({ success:function () {
                var catalogResource = new CatalogView({
                    model:that.locations,
                    appRouter:that
                })
                catalogResource.fetchModels()
                that.showView("#application-content", catalogResource)
            }})
        }
    })

    return Router
})