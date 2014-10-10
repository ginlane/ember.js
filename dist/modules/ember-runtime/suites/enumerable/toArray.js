define("ember-runtime/tests/suites/enumerable/toArray",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('toArray');

    suite.test('toArray should convert to an array', function() {
      var obj = this.newObject();
      deepEqual(obj.toArray(), this.toArray(obj));
    });

    __exports__["default"] = suite;
  });