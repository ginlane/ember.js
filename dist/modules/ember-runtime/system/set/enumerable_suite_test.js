define("ember-runtime/tests/system/set/enumerable_suite_test",
  ["ember-runtime/tests/suites/mutable_enumerable","ember-runtime/system/set","ember-metal/property_get"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var MutableEnumerableTests = __dependency1__["default"];
    var Set = __dependency2__["default"];
    var get = __dependency3__.get;

    MutableEnumerableTests.extend({

      name: 'Ember.Set',

      newObject: function(ary) {
        ary = ary ? ary.slice() : this.newFixture(3);
        var ret = new Set();
        ret.addObjects(ary);
        return ret;
      },

      mutate: function(obj) {
        obj.addObject(get(obj, 'length')+1);
      },

      toArray: function(obj) {
        return obj.toArray ? obj.toArray() : obj.slice(); // make a copy.
      }

    }).run();
  });