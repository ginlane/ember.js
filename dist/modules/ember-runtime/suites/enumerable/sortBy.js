define("ember-runtime/tests/suites/enumerable/sortBy",
  ["ember-runtime/tests/suites/suite","ember-metal/property_get","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var get = __dependency2__.get;

    var suite = SuiteModuleBuilder.create();

    suite.module('sortBy');

    suite.test('sort by value of property', function() {
      var obj = this.newObject([{a: 2},{a: 1}]),
      sorted = obj.sortBy('a');
      equal(get(sorted[0], 'a'), 1);
      equal(get(sorted[1], 'a'), 2);
    });

    suite.test('supports multiple propertyNames', function() {
      var obj = this.newObject([{a: 1, b: 2},{a: 1, b: 1}]),
      sorted = obj.sortBy('a', 'b');
      equal(get(sorted[0], 'b'), 1);
      equal(get(sorted[1], 'b'), 2);
    });

    __exports__["default"] = suite;
  });