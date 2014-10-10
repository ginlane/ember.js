define("ember-metal/tests/run_loop/run_bind_test",
  ["ember-metal/run_loop"],
  function(__dependency1__) {
    "use strict";
    var run = __dependency1__["default"];

    module('system/run_loop/run_bind_test');

    test('Ember.run.bind builds a run-loop wrapped callback handler', function() {
      expect(3);

      var obj = {
        value: 0,
        increment: function(increment) {
          ok(run.currentRunLoop, 'expected a run-loop');
          return this.value += increment;
        }
      };

      var proxiedFunction = run.bind(obj, obj.increment, 1);
      equal(proxiedFunction(), 1);
      equal(obj.value, 1);
    });

    test('Ember.run.bind keeps the async callback arguments', function() {

      var asyncCallback = function(increment, increment2, increment3) {
        ok(run.currentRunLoop, 'expected a run-loop');
        equal(increment, 1);
        equal(increment2, 2);
        equal(increment3, 3);
      };

      var asyncFunction = function(fn) {
        fn(2, 3);
      };

      asyncFunction(run.bind(asyncCallback, asyncCallback, 1));
    });
  });