define("ember-runtime/tests/suites/enumerable/invoke",
  ["ember-runtime/system/object","ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var EmberObject = __dependency1__["default"];
    var SuiteModuleBuilder = __dependency2__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('invoke');

    suite.test('invoke should call on each object that implements', function() {
      var cnt, ary, obj;

      function F(amt) {
        cnt += amt===undefined ? 1 : amt;
      }
      cnt = 0;
      ary = [
        { foo: F },
        EmberObject.create({ foo: F }),

        // NOTE: does not impl foo - invoke should just skip
        EmberObject.create({ bar: F }),

        { foo: F }
      ];

      obj = this.newObject(ary);
      obj.invoke('foo');
      equal(cnt, 3, 'should have invoked 3 times');

      cnt = 0;
      obj.invoke('foo', 2);
      equal(cnt, 6, 'should have invoked 3 times, passing param');
    });

    __exports__["default"] = suite;
  });