define("ember-runtime/tests/system/set/extra_test",
  ["ember-metal/enumerable_utils","ember-metal/property_get","ember-metal/property_set","ember-metal/observer","ember-runtime/system/set"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var EnumerableUtils = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var addObserver = __dependency4__.addObserver;
    var Set = __dependency5__["default"];

    module('Set.init');

    test('passing an array to new Set() should instantiate w/ items', function() {

      var ary  = [1,2,3];
      var aSet = new Set(ary);
      var count = 0;

      equal(get(aSet, 'length'), 3, 'should have three items');
      aSet.forEach(function(x) {
        ok(EnumerableUtils.indexOf(ary, x)>=0, 'should find passed item in array');
        count++;
      });
      equal(count, 3, 'iterating should have returned three objects');
    });

    module('Set.clear');

    test('should clear a set of its content', function() {

      var aSet = new Set([1,2,3]);
      var count = 0;

      equal(get(aSet, 'length'), 3, 'should have three items');
      ok(get(aSet, 'firstObject'), 'firstObject should return an object');
      ok(get(aSet, 'lastObject'), 'lastObject should return an object');
      addObserver(aSet, '[]', function() { count++; });

      aSet.clear();
      equal(get(aSet, 'length'), 0, 'should have 0 items');
      equal(count, 1, 'should have notified of content change');
      equal(get(aSet, 'firstObject'), null, 'firstObject should return nothing');
      equal(get(aSet, 'lastObject'), null, 'lastObject should return nothing');

      count = 0;
      aSet.forEach(function() { count++; });
      equal(count, 0, 'iterating over items should not invoke callback');

    });

    // ..........................................................
    // Set.pop
    //

    module('Set.pop');

    test('calling pop should return an object and remove it', function() {

      var aSet = new Set([1,2,3]);
      var count = 0, obj;
      while(count<10 && (obj = aSet.pop())) {
        equal(aSet.contains(obj), false, 'set should no longer contain object');
        count++;
        equal(get(aSet, 'length'), 3-count, 'length should be shorter');
      }

      equal(count, 3, 'should only pop 3 objects');
      equal(get(aSet, 'length'), 0, 'final length should be zero');
      equal(aSet.pop(), null, 'extra pops should do nothing');
    });

    // ..........................................................
    // Set.aliases
    //

    module('Set aliases');

    test('method aliases', function() {
      var aSet = new Set();
      equal(aSet.add, aSet.addObject, 'add -> addObject');
      equal(aSet.remove, aSet.removeObject, 'remove -> removeObject');
      equal(aSet.addEach, aSet.addObjects, 'addEach -> addObjects');
      equal(aSet.removeEach, aSet.removeObjects, 'removeEach -> removeObjects');

      equal(aSet.push, aSet.addObject, 'push -> addObject');
      equal(aSet.unshift, aSet.addObject, 'unshift -> addObject');
      equal(aSet.shift, aSet.pop, 'shift -> pop');
    });
  });