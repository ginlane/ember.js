define("ember-testing/tests/adapters_test",
  ["ember-metal/run_loop","ember-testing/test","ember-testing/adapters/adapter","ember-testing/adapters/qunit","ember-application/system/application"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var run = __dependency1__["default"];
    var Test = __dependency2__["default"];
    var Adapter = __dependency3__["default"];
    var QUnitAdapter = __dependency4__["default"];
    var EmberApplication = __dependency5__["default"];

    var App, originalAdapter;

    module("ember-testing Adapters", {
      setup: function() {
        originalAdapter = Test.adapter;
      },
      teardown: function() {
        run(App, App.destroy);
        App.removeTestHelpers();
        App = null;

        Test.adapter = originalAdapter;
      }
    });

    test("Setting a test adapter manually", function() {
      expect(1);
      var CustomAdapter;

      CustomAdapter = Adapter.extend({
        asyncStart: function() {
          ok(true, "Correct adapter was used");
        }
      });

      run(function() {
        App = EmberApplication.create();
        Test.adapter = CustomAdapter.create();
        App.setupForTesting();
      });

      Test.adapter.asyncStart();
    });

    test("QUnitAdapter is used by default", function() {
      expect(1);

      Test.adapter = null;

      run(function() {
        App = EmberApplication.create();
        App.setupForTesting();
      });

      ok(Test.adapter instanceof QUnitAdapter);
    });
  });