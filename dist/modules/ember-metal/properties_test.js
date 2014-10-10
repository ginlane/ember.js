define("ember-metal/tests/properties_test",
  ["ember-metal/core","ember-metal/property_set","ember-metal/property_get","ember-metal/computed","ember-metal/properties"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var set = __dependency2__.set;
    var get = __dependency3__.get;
    var computed = __dependency4__.computed;
    var defineProperty = __dependency5__.defineProperty;

    module('Ember.defineProperty');

    test('toString', function() {

      var obj = {};
      defineProperty(obj, 'toString', undefined, function() { return 'FOO'; });
      equal(obj.toString(), 'FOO', 'should replace toString');
    });

    test("for data properties, didDefineProperty hook should be called if implemented", function() {
      expect(2);

      var obj = {
        didDefineProperty: function(obj, keyName, value) {
          equal(keyName, 'foo', "key name should be foo");
          equal(value, 'bar', "value should be bar");
        }
      };

      defineProperty(obj, 'foo', undefined, "bar");
    });

    test("for descriptor properties, didDefineProperty hook should be called if implemented", function() {
      expect(2);

      var computedProperty = computed(Ember.K);

      var obj = {
        didDefineProperty: function(obj, keyName, value) {
          equal(keyName, 'foo', "key name should be foo");
          strictEqual(value, computedProperty, "value should be passed descriptor");
        }
      };

      defineProperty(obj, 'foo', computedProperty);
    });
  });