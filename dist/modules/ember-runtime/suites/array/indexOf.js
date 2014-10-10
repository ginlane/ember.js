define("ember-runtime/tests/suites/array/indexOf",
  ["ember-runtime/tests/suites/suite","ember-runtime/system/string","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var fmt = __dependency2__.fmt;

    var suite = SuiteModuleBuilder.create();

    suite.module('indexOf');

    suite.test("should return index of object", function() {
      var expected = this.newFixture(3),
          obj      = this.newObject(expected),
          len      = 3,
          idx;

      for(idx=0;idx<len;idx++) {
        equal(obj.indexOf(expected[idx]), idx, fmt('obj.indexOf(%@) should match idx', [expected[idx]]));
      }

    });

    suite.test("should return -1 when requesting object not in index", function() {
      var obj = this.newObject(this.newFixture(3)), foo = {};
      equal(obj.indexOf(foo), -1, 'obj.indexOf(foo) should be < 0');
    });

    __exports__["default"] = suite;
  });