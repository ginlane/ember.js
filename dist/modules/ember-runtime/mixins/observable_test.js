define("ember-runtime/tests/mixins/observable_test",
  ["ember-metal/computed","ember-metal/observer","ember-runtime/system/object","ember-runtime/tests/props_helper"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var computed = __dependency1__.computed;
    var addObserver = __dependency2__.addObserver;
    var EmberObject = __dependency3__["default"];
    var testBoth = __dependency4__.testBoth;

    module('mixins/observable');

    test('should be able to use getProperties to get a POJO of provided keys', function() {
      var obj = EmberObject.create({
        firstName: "Steve",
        lastName: "Jobs",
        companyName: "Apple, Inc."
      });

      var pojo = obj.getProperties("firstName", "lastName");
      equal("Steve", pojo.firstName);
      equal("Jobs", pojo.lastName);
    });

    test('should be able to use getProperties with array parameter to get a POJO of provided keys', function() {
      var obj = EmberObject.create({
        firstName: "Steve",
        lastName: "Jobs",
        companyName: "Apple, Inc."
      });

      var pojo = obj.getProperties(["firstName", "lastName"]);
      equal("Steve", pojo.firstName);
      equal("Jobs", pojo.lastName);
    });

    test('should be able to use setProperties to set multiple properties at once', function() {
      var obj = EmberObject.create({
        firstName: "Steve",
        lastName: "Jobs",
        companyName: "Apple, Inc."
      });

      obj.setProperties({firstName: "Tim", lastName: "Cook"});
      equal("Tim", obj.get("firstName"));
      equal("Cook", obj.get("lastName"));
    });

    testBoth('calling setProperties completes safely despite exceptions', function(get,set) {
      var exc = new Error("Something unexpected happened!");
      var obj = EmberObject.createWithMixins({
        firstName: "Steve",
        lastName: "Jobs",
        companyName: computed(function(key, value) {
          if (value !== undefined) {
            throw exc;
          }
          return "Apple, Inc.";
        })
      });

      var firstNameChangedCount = 0;

      addObserver(obj, 'firstName', function() { firstNameChangedCount++; });

      try {
        obj.setProperties({
          firstName: 'Tim',
          lastName: 'Cook',
          companyName: 'Fruit Co., Inc.'
        });
      } catch(err) {
        if (err !== exc) {
          throw err;
        }
      }

      equal(firstNameChangedCount, 1, 'firstName should have fired once');
    });

    testBoth("should be able to retrieve cached values of computed properties without invoking the computed property", function(get) {
      var obj = EmberObject.createWithMixins({
        foo: computed(function() {
          return "foo";
        }),

        bar: "bar"
      });

      equal(obj.cacheFor('foo'), undefined, "should return undefined if no value has been cached");
      get(obj, 'foo');

      equal(get(obj, 'foo'), "foo", "precond - should cache the value");
      equal(obj.cacheFor('foo'), "foo", "should return the cached value after it is invoked");

      equal(obj.cacheFor('bar'), undefined, "returns undefined if the value is not a computed property");
    });

    test('incrementProperty should work even if value is number in string', function() {
      var obj = EmberObject.create({
        age: "24"
      });
      obj.incrementProperty('age');
      equal(25, obj.get('age'));
    });
  });