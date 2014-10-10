define("ember-routing/tests/system/dsl_test",
  ["ember-routing/system/router"],
  function(__dependency1__) {
    "use strict";
    var EmberRouter = __dependency1__["default"];

    var Router;

    module("Ember Router DSL", {
      setup: function() {
        Router = EmberRouter.extend();
      },
      teardown: function() {
        Router = null;
      }
    });

    test("should fail when using a reserved route name", function() {
      expect(2);

      expectAssertion(function() {
        Router.map(function() {
          this.route('basic');
        });
      }, "'basic' cannot be used as a route name.");

      expectAssertion(function() {
        Router.map(function() {
          this.resource('basic');
        });
      }, "'basic' cannot be used as a resource name.");
    });
  });