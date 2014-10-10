define("ember-metal/tests/performance_test",
  ["ember-metal/property_set","ember-metal/property_get","ember-metal/computed","ember-metal/properties","ember-metal/property_events","ember-metal/observer"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var set = __dependency1__.set;
    var get = __dependency2__.get;
    var computed = __dependency3__.computed;
    var defineProperty = __dependency4__.defineProperty;
    var propertyDidChange = __dependency5__.propertyDidChange;
    var beginPropertyChanges = __dependency5__.beginPropertyChanges;
    var endPropertyChanges = __dependency5__.endPropertyChanges;
    var addObserver = __dependency6__.addObserver;

    /*
      This test file is designed to capture performance regressions related to
      deferred computation. Things like run loops, computed properties, and bindings
      should run the minimum amount of times to achieve best performance, so any
      bugs that cause them to get evaluated more than necessary should be put here.
    */

    module("Computed Properties - Number of times evaluated");

    test("computed properties that depend on multiple properties should run only once per run loop", function() {
      var obj = {a: 'a', b: 'b', c: 'c'};
      var cpCount = 0, obsCount = 0;

      defineProperty(obj, 'abc', computed(function(key) {
        cpCount++;
        return 'computed '+key;
      }).property('a', 'b', 'c'));

      get(obj, 'abc');

      cpCount = 0;

      addObserver(obj, 'abc', function() {
        obsCount++;
      });

      beginPropertyChanges();
      set(obj, 'a', 'aa');
      set(obj, 'b', 'bb');
      set(obj, 'c', 'cc');
      endPropertyChanges();

      get(obj, 'abc');

      equal(cpCount, 1, "The computed property is only invoked once");
      equal(obsCount, 1, "The observer is only invoked once");
    });

    test("computed properties are not executed if they are the last segment of an observer chain pain", function() {
      var foo = { bar: { baz: { } } };

      var count = 0;

      defineProperty(foo.bar.baz, 'bam', computed(function() {
        count++;
      }));

      addObserver(foo, 'bar.baz.bam', function() {});

      propertyDidChange(get(foo, 'bar.baz'), 'bam');

      equal(count, 0, "should not have recomputed property");
    });
  });