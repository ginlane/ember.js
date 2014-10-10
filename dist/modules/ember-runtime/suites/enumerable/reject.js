define("ember-runtime/tests/suites/enumerable/reject",
  ["ember-runtime/system/object","ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var EmberObject = __dependency1__["default"];
    var SuiteModuleBuilder = __dependency2__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    // ..........................................................
    // reject()
    //

    suite.module('reject');

    suite.test('should reject any item that does not meet the condition', function() {
      var obj = this.newObject([1,2,3,4]),
          result;

      result = obj.reject(function(i) { return i < 3; });
      deepEqual(result, [3,4], 'reject the correct items');
    });

    suite.test('should be the inverse of filter', function() {
      var obj = this.newObject([1,2,3,4]),
          isEven = function(i) { return i % 2 === 0; },
          filtered, rejected;

      filtered = obj.filter(isEven);
      rejected = obj.reject(isEven);

      deepEqual(filtered, [2,4], 'filtered evens');
      deepEqual(rejected, [1,3], 'rejected evens');
    });

    // ..........................................................
    // rejectBy()
    //

    suite.module('rejectBy');

    suite.test('should reject based on object', function() {
      var obj, ary;

      ary = [
        { foo: 'foo', bar: 'BAZ' },
        EmberObject.create({ foo: 'foo', bar: 'bar' })
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo', 'foo'), [], 'rejectBy(foo)');
      deepEqual(obj.rejectBy('bar', 'bar'), [ary[0]], 'rejectBy(bar)');
    });

    suite.test('should include in result if property is false', function() {
      var obj, ary;

      ary = [
        { foo: false, bar: true },
        EmberObject.create({ foo: false, bar: false })
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo'), ary, 'rejectBy(foo)');
      deepEqual(obj.rejectBy('bar'), [ary[1]], 'rejectBy(bar)');
    });

    suite.test('should reject on second argument if provided', function() {
      var obj, ary;

      ary = [
        { name: 'obj1', foo: 3},
        EmberObject.create({ name: 'obj2', foo: 2}),
        { name: 'obj3', foo: 2},
        EmberObject.create({ name: 'obj4', foo: 3})
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo', 3), [ary[1], ary[2]], "rejectBy('foo', 3)')");
    });

    suite.test('should correctly reject null second argument', function() {
      var obj, ary;

      ary = [
        { name: 'obj1', foo: 3},
        EmberObject.create({ name: 'obj2', foo: null}),
        { name: 'obj3', foo: null},
        EmberObject.create({ name: 'obj4', foo: 3})
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo', null), [ary[0], ary[3]], "rejectBy('foo', null)')");
    });

    suite.test('should correctly reject undefined second argument', function() {
      var obj, ary;

      ary = [
        { name: 'obj1', foo: 3},
        EmberObject.create({ name: 'obj2', foo: 2})
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('bar', undefined), [], "rejectBy('bar', undefined)')");
    });

    suite.test('should correctly reject explicit undefined second argument', function() {
      var obj, ary;

      ary = [
        { name: 'obj1', foo: 3},
        EmberObject.create({ name: 'obj2', foo: 3}),
        { name: 'obj3', foo: undefined},
        EmberObject.create({ name: 'obj4', foo: undefined}),
        { name: 'obj5'},
        EmberObject.create({ name: 'obj6'})
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo', undefined), ary.slice(0, 2), "rejectBy('foo', undefined)')");
    });

    suite.test('should match undefined, null, or false properties without second argument', function() {
      var obj, ary;

      ary = [
        { name: 'obj1', foo: 3},
        EmberObject.create({ name: 'obj2', foo: 3}),
        { name: 'obj3', foo: undefined},
        EmberObject.create({ name: 'obj4', foo: undefined}),
        { name: 'obj5'},
        EmberObject.create({ name: 'obj6'}),
        { name: 'obj7', foo: null },
        EmberObject.create({ name: 'obj8', foo: null }),
        { name: 'obj9', foo: false },
        EmberObject.create({ name: 'obj10', foo: false })
      ];

      obj = this.newObject(ary);

      deepEqual(obj.rejectBy('foo'), ary.slice(2), "rejectBy('foo')')");
    });

    suite.test('should be aliased to rejectProperty', function() {
      var ary =[];

      equal(ary.rejectProperty, ary.rejectBy);
    });

    __exports__["default"] = suite;
  });