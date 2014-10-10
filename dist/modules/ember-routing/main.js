define("ember-routing",
  ["ember-handlebars","ember-metal/core","ember-routing/ext/run_loop","ember-routing/ext/controller","ember-routing/ext/view","ember-routing/helpers/shared","ember-routing/helpers/link_to","ember-routing/location/api","ember-routing/location/none_location","ember-routing/location/hash_location","ember-routing/location/history_location","ember-routing/location/auto_location","ember-routing/system/controller_for","ember-routing/system/dsl","ember-routing/system/router","ember-routing/system/route","ember-routing/helpers/outlet","ember-routing/helpers/render","ember-routing/helpers/action","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __exports__) {
    "use strict";
    // require('ember-runtime');
    // require('ember-views');
    // require('ember-handlebars');

    /**
    Ember Routing

    @module ember
    @submodule ember-routing
    @requires ember-views
    */

    var EmberHandlebars = __dependency1__["default"];
    var Ember = __dependency2__["default"];

    // ES6TODO: Cleanup modules with side-effects below

    var resolvePaths = __dependency6__.resolvePaths;
    var resolveParams = __dependency6__.resolveParams;
    var deprecatedLinkToHelper = __dependency7__.deprecatedLinkToHelper;
    var linkToHelper = __dependency7__.linkToHelper;
    var LinkView = __dependency7__.LinkView;


    // require('ember-views');
    var EmberLocation = __dependency8__["default"];
    var NoneLocation = __dependency9__["default"];
    var HashLocation = __dependency10__["default"];
    var HistoryLocation = __dependency11__["default"];
    var AutoLocation = __dependency12__["default"];

    var controllerFor = __dependency13__.controllerFor;
    var generateControllerFactory = __dependency13__.generateControllerFactory;
    var generateController = __dependency13__.generateController;
    var RouterDSL = __dependency14__["default"];
    var Router = __dependency15__["default"];
    var Route = __dependency16__["default"];
    var outletHelper = __dependency17__.outletHelper;
    var OutletView = __dependency17__.OutletView;
    var renderHelper = __dependency18__["default"];
    var ActionHelper = __dependency19__.ActionHelper;
    var actionHelper = __dependency19__.actionHelper;


    Ember.Location = EmberLocation;
    Ember.AutoLocation = AutoLocation;
    Ember.HashLocation = HashLocation;
    Ember.HistoryLocation = HistoryLocation;
    Ember.NoneLocation = NoneLocation;

    Ember.controllerFor = controllerFor;
    Ember.generateControllerFactory = generateControllerFactory;
    Ember.generateController = generateController;
    Ember.RouterDSL = RouterDSL;
    Ember.Router = Router;
    Ember.Route = Route;
    Ember.LinkView = LinkView;

    Router.resolveParams = resolveParams;
    Router.resolvePaths = resolvePaths;

    EmberHandlebars.ActionHelper = ActionHelper;
    EmberHandlebars.OutletView = OutletView;

    EmberHandlebars.registerHelper('render', renderHelper)
    EmberHandlebars.registerHelper('action', actionHelper);
    EmberHandlebars.registerHelper('outlet', outletHelper);
    EmberHandlebars.registerHelper('link-to', linkToHelper);
    EmberHandlebars.registerHelper('linkTo', deprecatedLinkToHelper);

    __exports__["default"] = Ember;
  });