define("ember-handlebars/tests/helpers/debug_test",
  ["ember-metal/core","ember-metal/logger","ember-metal/run_loop","ember-views/views/view","ember-handlebars-compiler","ember-handlebars/helpers/debug"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.lookup
    var EmberLogger = __dependency2__["default"];
    var run = __dependency3__["default"];
    var EmberView = __dependency4__.View;
    var EmberHandlebars = __dependency5__["default"];
    var logHelper = __dependency6__.logHelper;

    var originalLookup = Ember.lookup, lookup;
    var originalLog, logCalls;
    var originalLogHelper;
    var view;

    var appendView = function() {
      run(function() { view.appendTo('#qunit-fixture'); });
    };


    module("Handlebars {{log}} helper", {
      setup: function() {
        Ember.lookup = lookup = { Ember: Ember };

        originalLogHelper = EmberHandlebars.helpers.log;
        EmberHandlebars.registerHelper("log", logHelper);

        originalLog = EmberLogger.log;
        logCalls = [];
        EmberLogger.log = function() { logCalls.push.apply(logCalls, arguments); };
      },

      teardown: function() {
        if (view) {
          run(function() {
            view.destroy();
          });
          view = null;
        }

        EmberLogger.log = originalLog;
        EmberHandlebars.helpers.log = originalLogHelper;
        Ember.lookup = originalLookup;
      }
    });

    test("should be able to log multiple properties", function() {
      var context = {
        value: 'one',
        valueTwo: 'two'
      };

      view = EmberView.create({
        context: context,
        template: EmberHandlebars.compile('{{log value valueTwo}}')
      });

      appendView();

      equal(view.$().text(), "", "shouldn't render any text");
      equal(logCalls[0], 'one');
      equal(logCalls[1], 'two');
    });

    test("should be able to log primitives", function() {
      var context = {
        value: 'one',
        valueTwo: 'two'
      };

      view = EmberView.create({
        context: context,
        template: EmberHandlebars.compile('{{log value "foo" 0 valueTwo true}}')
      });

      appendView();

      equal(view.$().text(), "", "shouldn't render any text");
      strictEqual(logCalls[0], 'one');
      strictEqual(logCalls[1], 'foo');
      strictEqual(logCalls[2], 0);
      strictEqual(logCalls[3], 'two');
      strictEqual(logCalls[4], true);
    });
  });