define("ember-application",
  ["ember-metal/core","ember-runtime/system/lazy_load","ember-application/system/dag","ember-application/system/resolver","ember-application/system/application","ember-application/ext/controller"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var runLoadHooks = __dependency2__.runLoadHooks;

    /**
    Ember Application

    @module ember
    @submodule ember-application
    @requires ember-views, ember-routing
    */

    var DAG = __dependency3__["default"];var Resolver = __dependency4__.Resolver;
    var DefaultResolver = __dependency4__.DefaultResolver;
    var Application = __dependency5__["default"];
    // side effect of extending ControllerMixin

    Ember.Application = Application;
    Ember.DAG = DAG;
    Ember.Resolver = Resolver;
    Ember.DefaultResolver = DefaultResolver;

    runLoadHooks('Ember.Application', Application);
  });