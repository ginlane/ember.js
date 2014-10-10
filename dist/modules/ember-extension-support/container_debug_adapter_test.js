define("ember-extension-support/tests/container_debug_adapter_test",
  ["ember-metal/core","ember-metal/run_loop","ember-runtime/system/object","ember-runtime/controllers/controller","ember-extension-support","ember-application/system/application"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var EmberController = __dependency4__.Controller;
    // Must be required to export Ember.ContainerDebugAdapter
    var Application = __dependency6__["default"];

    var adapter, App, Model = EmberObject.extend();


    function boot() {
      run(App, 'advanceReadiness');
    }

    module("Container Debug Adapter", {
      setup:function() {
        run(function() {
          App = Application.create();  // ES6TODO: this comes from the ember-application package NOT ember-runtime
          App.toString = function() { return 'App'; };
          App.deferReadiness();

        });
        boot();
        run(function() {
          adapter = App.__container__.lookup('container-debug-adapter:main');
        });
      },
      teardown: function() {
        run(function() {
          adapter.destroy();
          App.destroy();
          App = null;
        });
      }
    });

    test("the default ContainerDebugAdapter cannot catalog certain entries by type", function(){
      equal(adapter.canCatalogEntriesByType('model'), false, "canCatalogEntriesByType should return false for model");
      equal(adapter.canCatalogEntriesByType('template'), false, "canCatalogEntriesByType should return false for template");
    });

    test("the default ContainerDebugAdapter can catalog typical entries by type", function(){
      equal(adapter.canCatalogEntriesByType('controller'), true, "canCatalogEntriesByType should return true for controller");
      equal(adapter.canCatalogEntriesByType('route'), true, "canCatalogEntriesByType should return true for route");
      equal(adapter.canCatalogEntriesByType('view'), true, "canCatalogEntriesByType should return true for view");
    });

    test("the default ContainerDebugAdapter catalogs controller entries", function(){
      App.PostController = EmberController.extend();
      var controllerClasses = adapter.catalogEntriesByType('controller');

      equal(controllerClasses.length, 1, "found 1 class");
      equal(controllerClasses[0], 'post', "found the right class");
    });
  });