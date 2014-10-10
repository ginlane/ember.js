define("ember-runtime/tests/legacy_1x/system/object/concatenated_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-runtime/system/string","ember-runtime/system/object"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var EmberStringUtils = __dependency4__["default"];
    var EmberObject = __dependency5__["default"];

    /*
      NOTE: This test is adapted from the 1.x series of unit tests.  The tests
      are the same except for places where we intend to break the API we instead
      validate that we warn the developer appropriately.

      CHANGES FROM 1.6:

      * changed get(obj, ) and set(obj, ) to Ember.get() and Ember.set()
      * converted uses of obj.isEqual() to use deepEqual() test since isEqual is not
        always defined
    */



      var klass;

      module("EmberObject Concatenated Properties", {
        setup: function() {
          klass = EmberObject.extend({
            concatenatedProperties: ['values', 'functions'],
            values: ['a', 'b', 'c'],
            functions: [Ember.K]
          });
        }
      });

      test("concatenates instances", function() {
        var obj = klass.create({
          values: ['d', 'e', 'f']
        });

        var values = get(obj, 'values'),
            expected = ['a', 'b', 'c', 'd', 'e', 'f'];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate values property (expected: %@, got: %@)", [expected, values]));
      });

      test("concatenates subclasses", function() {
        var subKlass = klass.extend({
          values: ['d', 'e', 'f']
        });
        var obj = subKlass.create();

        var values = get(obj, 'values'),
            expected = ['a', 'b', 'c', 'd', 'e', 'f'];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate values property (expected: %@, got: %@)", [expected, values]));
      });

      test("concatenates reopen", function() {
        klass.reopen({
          values: ['d', 'e', 'f']
        });
        var obj = klass.create();

        var values = get(obj, 'values'),
            expected = ['a', 'b', 'c', 'd', 'e', 'f'];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate values property (expected: %@, got: %@)", [expected, values]));
      });

      test("concatenates mixin", function() {
        var mixin = {
          values: ['d', 'e']
        };
        var subKlass = klass.extend(mixin, {
          values: ['f']
        });
        var obj = subKlass.create();

        var values = get(obj, 'values'),
            expected = ['a', 'b', 'c', 'd', 'e', 'f'];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate values property (expected: %@, got: %@)", [expected, values]));
      });

      test("concatenates reopen, subclass, and instance", function() {
        klass.reopen({ values: ['d'] });
        var subKlass = klass.extend({ values: ['e'] });
        var obj = subKlass.create({ values: ['f'] });

        var values = get(obj, 'values'),
            expected = ['a', 'b', 'c', 'd', 'e', 'f'];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate values property (expected: %@, got: %@)", [expected, values]));
      });

      test("concatenates subclasses when the values are functions", function() {
        var subKlass = klass.extend({
          functions: Ember.K
        });
        var obj = subKlass.create();

        var values = get(obj, 'functions'),
            expected = [Ember.K, Ember.K];
        deepEqual(values, expected, EmberStringUtils.fmt("should concatenate functions property (expected: %@, got: %@)", [expected, values]));
      });
  });