define("ember-runtime/tests/system/native_array/copyable_suite_test",
  ["ember-runtime/tests/suites/copyable","ember-metal/utils"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var CopyableTests = __dependency1__["default"];
    var generateGuid = __dependency2__.generateGuid;

    CopyableTests.extend({
      name: 'NativeArray Copyable',

      newObject: function() {
        return Ember.A([generateGuid()]);
      },

      isEqual: function(a,b) {
        if (!(a instanceof Array)) return false;
        if (!(b instanceof Array)) return false;
        if (a.length !== b.length) return false;
        return a[0]===b[0];
      },

      shouldBeFreezable: false
    }).run();

    module("NativeArray Copyable");

    test("deep copy is respected", function() {
      var array = Ember.A([ { id: 1 }, { id: 2 }, { id: 3 } ]);

      var copiedArray = array.copy(true);

      deepEqual(copiedArray, array, "copied array is equivalent");
      ok(copiedArray[0] !== array[0], "objects inside should be unique");
    });
  });