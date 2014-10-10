define("ember-metal/tests/watching/unwatch_test",
  ["ember-metal/tests/props_helper","ember-metal/watching","ember-metal/property_events","ember-metal/properties","ember-metal/events","ember-metal/computed","ember-metal/property_get","ember-metal/property_set"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__) {
    "use strict";
    var testBoth = __dependency1__["default"];
    var watch = __dependency2__.watch;
    var unwatch = __dependency2__.unwatch;
    var propertyWillChange = __dependency3__.propertyWillChange;
    var propertyDidChange = __dependency3__.propertyDidChange;
    var defineProperty = __dependency4__.defineProperty;
    var addListener = __dependency5__.addListener;
    var computed = __dependency6__.computed;
    var get = __dependency7__.get;
    var set = __dependency8__.set;

    var willCount, didCount;

    module('unwatch', {
      setup: function() {
        willCount = didCount = 0;
      }
    });

    function addListeners(obj, keyPath) {
      addListener(obj, keyPath + ':before', function() {
        willCount++;
      });
      addListener(obj, keyPath + ':change', function() {
        didCount++;
      });
    }

    testBoth('unwatching a computed property - regular get/set', function(get, set) {

      var obj = {};
      defineProperty(obj, 'foo', computed(function(keyName, value) {
        if (value !== undefined) this.__foo = value;
        return this.__foo;
      }));
      addListeners(obj, 'foo');

      watch(obj, 'foo');
      set(obj, 'foo', 'bar');
      equal(willCount, 1, 'should have invoked willCount');
      equal(didCount, 1, 'should have invoked didCount');

      unwatch(obj, 'foo');
      willCount = didCount = 0;
      set(obj, 'foo', 'BAZ');
      equal(willCount, 0, 'should NOT have invoked willCount');
      equal(didCount, 0, 'should NOT have invoked didCount');
    });


    testBoth('unwatching a regular property - regular get/set', function(get, set) {

      var obj = { foo: 'BIFF' };
      addListeners(obj, 'foo');

      watch(obj, 'foo');
      set(obj, 'foo', 'bar');
      equal(willCount, 1, 'should have invoked willCount');
      equal(didCount, 1, 'should have invoked didCount');

      unwatch(obj, 'foo');
      willCount = didCount = 0;
      set(obj, 'foo', 'BAZ');
      equal(willCount, 0, 'should NOT have invoked willCount');
      equal(didCount, 0, 'should NOT have invoked didCount');
    });

    test('unwatching should be nested', function() {

      var obj = { foo: 'BIFF' };
      addListeners(obj, 'foo');

      watch(obj, 'foo');
      watch(obj, 'foo');
      set(obj, 'foo', 'bar');
      equal(willCount, 1, 'should have invoked willCount');
      equal(didCount, 1, 'should have invoked didCount');

      unwatch(obj, 'foo');
      willCount = didCount = 0;
      set(obj, 'foo', 'BAZ');
      equal(willCount, 1, 'should NOT have invoked willCount');
      equal(didCount, 1, 'should NOT have invoked didCount');

      unwatch(obj, 'foo');
      willCount = didCount = 0;
      set(obj, 'foo', 'BAZ');
      equal(willCount, 0, 'should NOT have invoked willCount');
      equal(didCount, 0, 'should NOT have invoked didCount');
    });

    testBoth('unwatching "length" property on an object', function(get, set) {

      var obj = { foo: 'RUN' };
      addListeners(obj, 'length');

      // Can watch length when it is undefined
      watch(obj, 'length');
      set(obj, 'length', '10k');
      equal(willCount, 1, 'should have invoked willCount');
      equal(didCount, 1, 'should have invoked didCount');

      // Should stop watching despite length now being defined (making object 'array-like')
      unwatch(obj, 'length');
      willCount = didCount = 0;
      set(obj, 'length', '5k');
      equal(willCount, 0, 'should NOT have invoked willCount');
      equal(didCount, 0, 'should NOT have invoked didCount');

    });
  });