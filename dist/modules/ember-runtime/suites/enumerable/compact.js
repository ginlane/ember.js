define("ember-runtime/tests/suites/enumerable/compact",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('compact');

    suite.test('removes null and undefined values from enumerable', function() {
      var obj = this.newObject([null, 1, false, '', undefined, 0, null]);
      var ary = obj.compact();
      deepEqual(ary, [1, false, '', 0]);
    });

    __exports__["default"] = suite;
  });