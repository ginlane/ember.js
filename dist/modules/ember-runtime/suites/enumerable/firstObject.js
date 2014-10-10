define("ember-runtime/tests/suites/enumerable/firstObject",
  ["ember-runtime/tests/suites/suite","ember-metal/property_get","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var get = __dependency2__.get;

    var suite = SuiteModuleBuilder.create();

    suite.module('firstObject');

    suite.test('returns first item in enumerable', function() {
      var obj = this.newObject();
      equal(get(obj, 'firstObject'), this.toArray(obj)[0]);
    });

    suite.test('returns undefined if enumerable is empty', function() {
      var obj = this.newObject([]);
      equal(get(obj, 'firstObject'), undefined);
    });

    __exports__["default"] = suite;
  });