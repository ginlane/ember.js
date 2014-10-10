define("ember-views/tests/views/view/destroy_test",
  ["ember-metal/property_get","ember-metal/run_loop","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var get = __dependency1__.get;
    var run = __dependency2__["default"];
    var EmberView = __dependency3__.View;

    module("Ember.View#destroy");

    test("should teardown viewName on parentView when childView is destroyed", function() {
      var viewName = "someChildView",
          parentView = EmberView.create(),
          childView = parentView.createChildView(EmberView, {viewName: viewName});

      equal(get(parentView, viewName), childView, "Precond - child view was registered on parent");

      run(function() {
        childView.destroy();
      });

      equal(get(parentView, viewName), null, "viewName reference was removed on parent");

      run(function() {
        parentView.destroy();
      });
    });
  });