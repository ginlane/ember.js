define("ember-runtime/tests/suites/mutable_array/reverseObjects",
  ["ember-runtime/tests/suites/suite","ember-metal/property_get","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var get = __dependency2__.get;

    var suite = SuiteModuleBuilder.create();

    suite.module('reverseObjects');

    suite.test("[A,B,C].reverseObjects() => [] + notify", function () {
      var obj, before, after, observer;

      before = this.newFixture(3);
      after  = [before[2], before[1], before[0]];
      obj = this.newObject(before);
      observer = this.newObserver(obj, '[]', '@each', 'length', 'firstObject', 'lastObject');
      obj.getProperties('firstObject', 'lastObject'); /* Prime the cache */

      equal(obj.reverseObjects(), obj, 'return self');

      deepEqual(this.toArray(obj), after, 'post item results');
      equal(get(obj, 'length'), after.length, 'length');

      equal(observer.timesCalled('[]'), 1, 'should have notified [] once');
      equal(observer.timesCalled('@each'), 1, 'should have notified @each once');
      equal(observer.timesCalled('length'), 0, 'should have notified length once');
      equal(observer.timesCalled('firstObject'), 1, 'should have notified firstObject once');
      equal(observer.timesCalled('lastObject'), 1, 'should have notified lastObject once');
    });

    __exports__["default"] = suite;
  });