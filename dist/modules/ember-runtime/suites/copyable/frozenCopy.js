define("ember-runtime/tests/suites/copyable/frozenCopy",
  ["ember-runtime/tests/suites/suite","ember-runtime/mixins/freezable","ember-metal/property_get","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var Freezable = __dependency2__.Freezable;
    var get = __dependency3__.get;

    var suite = SuiteModuleBuilder.create();

    suite.module('frozenCopy');

    suite.test("frozen objects should return same instance", function() {
      var obj, copy;

      obj = this.newObject();
      if (get(this, 'shouldBeFreezable')) {
        ok(!Freezable || Freezable.detect(obj), 'object should be freezable');

        copy = obj.frozenCopy();
        ok(this.isEqual(obj, copy), 'new copy should be equal');
        ok(get(copy, 'isFrozen'), 'returned value should be frozen');

        copy = obj.freeze().frozenCopy();
        equal(copy, obj, 'returns frozen object should be same');
        ok(get(copy, 'isFrozen'), 'returned object should be frozen');

      } else {
        ok(!Freezable || !Freezable.detect(obj), 'object should not be freezable');
      }
    });

    __exports__["default"] = suite;
  });