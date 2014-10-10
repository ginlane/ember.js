define("ember-metal/tests/utils/can_invoke_test",
  ["ember-metal/utils"],
  function(__dependency1__) {
    "use strict";
    var canInvoke = __dependency1__.canInvoke;

    var obj;

    module("Ember.canInvoke", {
      setup: function() {
        obj = {
          foobar: "foobar",
          aMethodThatExists: function() {}
        };
      },

      teardown: function() {
        obj = undefined;
      }
    });

    test("should return false if the object doesn't exist", function() {
      equal(canInvoke(undefined, 'aMethodThatDoesNotExist'), false);
    });

    test("should return true if the method exists on the object", function() {
      equal(canInvoke(obj, 'aMethodThatExists'), true);
    });

    test("should return false if the method doesn't exist on the object", function() {
      equal(canInvoke(obj, 'aMethodThatDoesNotExist'), false);
    });

    test("should return false if the property exists on the object but is a non-function", function() {
      equal(canInvoke(obj, 'foobar'), false);
    });
  });