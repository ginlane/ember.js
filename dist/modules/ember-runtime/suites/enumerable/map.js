define("ember-runtime/tests/suites/enumerable/map",
  ["ember-runtime/tests/suites/suite","ember-metal/enumerable_utils","ember-metal/property_get","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var EnumerableUtils = __dependency2__["default"];
    var get = __dependency3__.get;
    var guidFor = __dependency4__.guidFor;

    var suite = SuiteModuleBuilder.create(), global = this;

    suite.module('map');

    function mapFunc(item) { return item ? item.toString() : null; }

    suite.test('map should iterate over list', function() {
      var obj = this.newObject(),
          ary = EnumerableUtils.map(this.toArray(obj), mapFunc),
          found = [];

      found = obj.map(mapFunc);
      deepEqual(found, ary, 'mapped arrays should match');
    });


    suite.test('map should iterate over list after mutation', function() {
      if (get(this, 'canTestMutation')) {
        expect(0);
        return ;
      }

      var obj = this.newObject(),
          ary = this.toArray(obj).map(mapFunc),
          found;

      found = obj.map(mapFunc);
      deepEqual(found, ary, 'items passed during forEach should match');

      this.mutate(obj);
      ary = this.toArray(obj).map(mapFunc);
      found = obj.map(mapFunc);
      deepEqual(found, ary, 'items passed during forEach should match');
    });

    suite.test('2nd target parameter', function() {
      var obj = this.newObject(), target = this;


      obj.map(function() {
        // ES6TODO: When transpiled we will end up with "use strict" which disables automatically binding to the global context.
        // Therefore, the following test can never pass in strict mode unless we modify the `map` function implementation to
        // use `Ember.lookup` if target is not specified.
        //
        // equal(guidFor(this), guidFor(global), 'should pass the global object as this if no context');
      });

      obj.map(function() {
        equal(guidFor(this), guidFor(target), 'should pass target as this if context');
      }, target);

    });


    suite.test('callback params', function() {
      var obj = this.newObject(),
          ary = this.toArray(obj),
          loc = 0;


      obj.map(function(item, idx, enumerable) {
        equal(item, ary[loc], 'item param');
        equal(idx, loc, 'idx param');
        equal(guidFor(enumerable), guidFor(obj), 'enumerable param');
        loc++;
      });

    });

    __exports__["default"] = suite;
  });