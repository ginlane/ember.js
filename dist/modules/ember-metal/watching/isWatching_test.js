define("ember-metal/tests/watching/isWatching_test",
  ["ember-metal/property_get","ember-metal/properties","ember-metal/mixin","ember-metal/observer","ember-metal/watching"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var get = __dependency1__.get;
    var defineProperty = __dependency2__.defineProperty;
    var Mixin = __dependency3__.Mixin;
    var observer = __dependency3__.observer;
    var addObserver = __dependency4__.addObserver;
    var removeObserver = __dependency4__.removeObserver;
    var isWatching = __dependency5__.isWatching;

    module('isWatching');

    var testObserver = function(setup, teardown, key) {
      var obj = {}, fn = function() {};
      key = key || 'foo';

      equal(isWatching(obj, key), false, "precond - isWatching is false by default");
      setup(obj, key, fn);
      equal(isWatching(obj, key), true, "isWatching is true when observers are added");
      teardown(obj, key, fn);
      equal(isWatching(obj, key), false, "isWatching is false after observers are removed");
    };

    test("isWatching is true for regular local observers", function() {
      testObserver(function(obj, key, fn) {
        Mixin.create({
          didChange: observer(key, fn)
        }).apply(obj);
      }, function(obj, key, fn) {
        removeObserver(obj, key, obj, fn);
      });
    });

    test("isWatching is true for nonlocal observers", function() {
      testObserver(function(obj, key, fn) {
        addObserver(obj, key, obj, fn);
      }, function(obj, key, fn) {
        removeObserver(obj, key, obj, fn);
      });
    });

    test("isWatching is true for chained observers", function() {
      testObserver(function(obj, key, fn) {
        addObserver(obj, key + '.bar', obj, fn);
      }, function(obj, key, fn) {
        removeObserver(obj, key + '.bar', obj, fn);
      });
    });

    test("isWatching is true for computed properties", function() {
      testObserver(function(obj, key, fn) {
        defineProperty(obj, 'computed', Ember.computed(fn).property(key));
        get(obj, 'computed');
      }, function(obj, key, fn) {
        defineProperty(obj, 'computed', null);
      });
    });

    test("isWatching is true for chained computed properties", function() {
      testObserver(function(obj, key, fn) {
        defineProperty(obj, 'computed', Ember.computed(fn).property(key + '.bar'));
        get(obj, 'computed');
      }, function(obj, key, fn) {
        defineProperty(obj, 'computed', null);
      });
    });

    // can't watch length on Array - it is special...
    // But you should be able to watch a length property of an object
    test("isWatching is true for 'length' property on object", function() {
      testObserver(function(obj, key, fn) {
        defineProperty(obj, 'length', null, '26.2 miles');
        addObserver(obj, 'length', obj, fn);
      }, function(obj, key, fn) {
        removeObserver(obj, 'length', obj, fn);
      }, 'length');
    });
  });