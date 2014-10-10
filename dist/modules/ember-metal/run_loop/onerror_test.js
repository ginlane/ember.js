define("ember-metal/tests/run_loop/onerror_test",
  ["ember-metal","ember-metal/run_loop"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];

    module('system/run_loop/onerror_test');

    test('With Ember.onerror undefined, errors in Ember.run are thrown', function () {
      var thrown = new Error('Boom!'),
          caught;

      try {
        run(function() { throw thrown; });
      } catch (error) {
        caught = error;
      }

      deepEqual(caught, thrown);
    });

    test('With Ember.onerror set, errors in Ember.run are caught', function () {
      var thrown = new Error('Boom!'),
          caught;

      Ember.onerror = function(error) { caught = error; };

      run(function() { throw thrown; });

      deepEqual(caught, thrown);

      Ember.onerror = undefined;
    });
  });