define("ember-runtime/tests/system/native_array/suite_test",
  ["ember-runtime/tests/suites/mutable_array"],
  function(__dependency1__) {
    "use strict";
    var MutableArrayTests = __dependency1__["default"];

    MutableArrayTests.extend({

      name: 'Native Array',

      newObject: function(ary) {
        return Ember.A(ary ? ary.slice() : this.newFixture(3));
      },

      mutate: function(obj) {
        obj.pushObject(obj.length+1);
      },

      toArray: function(obj) {
        return obj.slice(); // make a copy.
      }

    }).run();
  });