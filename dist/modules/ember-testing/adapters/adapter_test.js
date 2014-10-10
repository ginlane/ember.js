define("ember-testing/tests/adapters/adapter_test",
  ["ember-metal/core","ember-metal/run_loop","ember-testing/adapters/adapter"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K
    var run = __dependency2__["default"];
    var Adapter = __dependency3__["default"];

    var adapter;

    module("ember-testing Adapter", {
      setup: function() {
        adapter = new Adapter();
      },
      teardown: function() {
        run(adapter, adapter.destroy);
      }
    });

    test("asyncStart is a noop", function() {
      equal(adapter.asyncStart, Ember.K);
    });

    test("asyncEnd is a noop", function() {
      equal(adapter.asyncEnd, Ember.K);
    });

    test("exception throws", function() {
      var error = "Hai", thrown;
      try {
        adapter.exception(error);
      } catch (e) {
        thrown = e;
      }
      equal(thrown, error);
    });
  });