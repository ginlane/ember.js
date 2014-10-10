define("ember-runtime/tests/suites/enumerable/mapBy",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('mapBy');

    suite.test('get value of each property', function() {
      var obj = this.newObject([{a: 1},{a: 2}]);
      equal(obj.mapBy('a').join(''), '12');
    });

    suite.test('should work also through getEach alias', function() {
      var obj = this.newObject([{a: 1},{a: 2}]);
      equal(obj.getEach('a').join(''), '12');
    });

    suite.test('should be aliased to mapProperty', function() {
      var obj = this.newObject([]);
      equal(obj.mapProperty, obj.mapBy);
    });

    __exports__["default"] = suite;
  });