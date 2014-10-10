define("ember-runtime/tests/suites/enumerable/lastObject",
  ["ember-runtime/tests/suites/suite","ember-metal/property_get","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var get = __dependency2__.get;

    var suite = SuiteModuleBuilder.create();

    suite.module('lastObject');

    suite.test('returns last item in enumerable', function() {
      var obj = this.newObject(),
          ary = this.toArray(obj);
      equal(get(obj, 'lastObject'), ary[ary.length-1]);
    });

    suite.test('returns undefined if enumerable is empty', function() {
      var obj = this.newObject([]);
      equal(get(obj, 'lastObject'), undefined);
    });

    __exports__["default"] = suite;
  });