define("ember-testing/tests/helper_registration_test",
  ["ember-metal/run_loop","ember-testing/test","ember-application/system/application"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var run = __dependency1__["default"];
    var Test = __dependency2__["default"];
    var EmberApplication = __dependency3__["default"];

    var App, appBooted, helperContainer;

    function registerHelper(){
      Test.registerHelper('boot', function(app) {
        run(app, app.advanceReadiness);
        appBooted = true;
        return app.testHelpers.wait();
      });
    }

    function unregisterHelper(){
      Test.unregisterHelper('boot');
    }

    var originalAdapter = Test.adapter;

    function setupApp(){
      appBooted = false;
      helperContainer = {};

      run(function() {
        App = EmberApplication.create();
        App.setupForTesting();
        App.injectTestHelpers(helperContainer);
      });
    }

    function destroyApp(){
      if (App) {
        run(App, 'destroy');
        App = null;
      }
    }

    module("Test - registerHelper/unregisterHelper", {
      teardown: function(){
        Test.adapter = originalAdapter;
        destroyApp();
      }
    });

    test("Helper gets registered", function() {
      expect(2);

      registerHelper();
      setupApp();

      ok(App.testHelpers.boot);
      ok(helperContainer.boot);
    });

    test("Helper is ran when called", function(){
      expect(1);

      registerHelper();
      setupApp();

      App.testHelpers.boot().then(function() {
        ok(appBooted);
      });
    });

    test("Helper can be unregistered", function(){
      expect(4);

      registerHelper();
      setupApp();

      ok(App.testHelpers.boot);
      ok(helperContainer.boot);

      unregisterHelper();

      setupApp();

      ok(!App.testHelpers.boot, "once unregistered the helper is not added to App.testHelpers");
      ok(!helperContainer.boot, "once unregistered the helper is not added to the helperContainer");
    });
  });