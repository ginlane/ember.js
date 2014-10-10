define("ember-metal/tests/run_loop/debounce_test",
  ["ember-metal/run_loop"],
  function(__dependency1__) {
    "use strict";
    var run = __dependency1__["default"];

    var originalDebounce = run.backburner.debounce;
    var wasCalled = false;
    module('Ember.run.debounce',{
      setup: function() {
        run.backburner.debounce = function() { wasCalled = true; };
      },
      teardown: function() {
        run.backburner.debounce = originalDebounce;
      }
    });

    test('Ember.run.debounce uses Backburner.debounce', function() {
      run.debounce(function() {});
      ok(wasCalled, 'Ember.run.debounce used');
    });
  });