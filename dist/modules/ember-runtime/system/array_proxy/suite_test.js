define("ember-runtime/tests/system/array_proxy/suite_test",
  ["ember-metal/core","ember-runtime/tests/suites/mutable_array","ember-runtime/system/array_proxy","ember-metal/property_get"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var MutableArrayTests = __dependency2__["default"];
    var ArrayProxy = __dependency3__["default"];
    var get = __dependency4__.get;

    MutableArrayTests.extend({

      name: 'Ember.ArrayProxy',

      newObject: function(ary) {
        var ret = ary ? ary.slice() : this.newFixture(3);
        return ArrayProxy.create({ content: Ember.A(ret) });
      },

      mutate: function(obj) {
        obj.pushObject(get(obj, 'length')+1);
      },

      toArray: function(obj) {
        return obj.toArray ? obj.toArray() : obj.slice();
      }

    }).run();
  });