define("ember-runtime/tests/suites/copyable/copy",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('copy');

    suite.test("should return an equivalent copy", function() {
      var obj = this.newObject();
      var copy = obj.copy();
      ok(this.isEqual(obj, copy), 'old object and new object should be equivalent');
    });

    __exports__["default"] = suite;
  });