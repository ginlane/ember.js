define("ember-runtime/tests/suites/enumerable/reduce",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('reduce');

    suite.test('collectes a summary value from an enumeration', function() {
      var obj = this.newObject([1, 2, 3]);
      var res = obj.reduce(function(previousValue, item, index, enumerable) { return previousValue + item; }, 0);
      equal(res, 6);
    });

    suite.test('passes index of item to callback', function() {
      var obj = this.newObject([1, 2, 3]);
      var res = obj.reduce(function(previousValue, item, index, enumerable) { return previousValue + index; }, 0);
      equal(res, 3);
    });

    suite.test('passes enumerable object to callback', function() {
      var obj = this.newObject([1, 2, 3]);
      var res = obj.reduce(function(previousValue, item, index, enumerable) { return enumerable; }, 0);
      equal(res, obj);
    });

    __exports__["default"] = suite;
  });