define("ember-runtime/tests/system/set/copyable_suite_test",
  ["ember-runtime/tests/suites/copyable","ember-runtime/system/set","ember-metal/utils","ember-metal/property_get"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var CopyableTests = __dependency1__["default"];
    var Set = __dependency2__["default"];
    var generateGuid = __dependency3__.generateGuid;
    var get = __dependency4__.get;

    CopyableTests.extend({
      name: 'Ember.Set Copyable',

      newObject: function() {
        var set = new Set();
        set.addObject(generateGuid());
        return set;
      },

      isEqual: function(a,b) {
        if (!(a instanceof Set)) return false;
        if (!(b instanceof Set)) return false;
        return get(a, 'firstObject') === get(b, 'firstObject');
      },

      shouldBeFreezable: true
    }).run();
  });