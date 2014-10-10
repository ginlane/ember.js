define("ember-runtime/tests/system/deferred_test",
  ["ember-metal/core","ember-metal/run_loop","ember-runtime/system/deferred"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];
    var Deferred = __dependency3__["default"];

    module("Ember.Deferred all-in-one");

    asyncTest("Can resolve a promise", function() {
      var value = { value: true };

      var promise = Deferred.promise(function(deferred) {
        setTimeout(function() {
          run(function() { deferred.resolve(value); });
        });
      });

      promise.then(function(resolveValue) {
        QUnit.start();
        equal(resolveValue, value, "The resolved value should be correct");
      });
    });

    asyncTest("Can reject a promise", function() {
      var rejected = { rejected: true };

      var promise = Deferred.promise(function(deferred) {
        setTimeout(function() {
          run(function() { deferred.reject(rejected); });
        });
      });

      promise.then(null, function(rejectedValue) {
        QUnit.start();
        equal(rejectedValue, rejected, "The resolved value should be correct");
      });
    });
  });