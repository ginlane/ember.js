define("ember-runtime/tests/ext/rsvp_test",
  ["ember-metal/run_loop","ember-runtime/ext/rsvp"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var run = __dependency1__["default"];
    var RSVP = __dependency2__["default"];

    module('Ember.RSVP');

    test('Ensure that errors thrown from within a promise are sent to the console', function(){
      var error = new Error('Error thrown in a promise for testing purposes.');

      try {
        run(function(){
          new RSVP.Promise(function(resolve, reject){
            throw error;
          });
        });
        ok(false, 'expected assertion to be thrown');
      } catch (e) {
        equal(e, error, "error was re-thrown");
      }
    });
  });