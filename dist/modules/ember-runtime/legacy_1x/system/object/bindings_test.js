define("ember-runtime/tests/legacy_1x/system/object/bindings_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-metal/watching","ember-runtime/system/object"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];
    var destroy = __dependency5__.destroy;
    var EmberObject = __dependency6__["default"];

    /*
      NOTE: This test is adapted from the 1.x series of unit tests.  The tests
      are the same except for places where we intend to break the API we instead
      validate that we warn the developer appropriately.

      CHANGES FROM 1.6:

      * changed Ember.Bending.flushPendingChanges() -> run.sync();
      * changes obj.set() and obj.get() to Ember.set() and Ember.get()
      * Fixed an actual bug in unit tests around line 133
      * fixed 'bindings should disconnect on destroy' test to use destroy.
    */

    // ========================================================================
    // EmberObject bindings Tests
    // ========================================================================

    var testObject, fromObject, extraObject, TestObject;
    var TestNamespace, originalLookup, lookup;

    var bindModuleOpts = {

      setup: function() {
        originalLookup = Ember.lookup;
        Ember.lookup = lookup = {};

        testObject = EmberObject.create({
          foo: "bar",
          bar: "foo",
          extraObject: null
        });

        fromObject = EmberObject.create({
          bar: "foo",
          extraObject: null
        }) ;

        extraObject = EmberObject.create({
          foo: "extraObjectValue"
        }) ;

        lookup['TestNamespace'] = TestNamespace = {
          fromObject: fromObject,
          testObject: testObject
        } ;
      },

      teardown: function() {
        testObject = fromObject = extraObject = null ;
        Ember.lookup = originalLookup;
      }

    };

    module("bind() method", bindModuleOpts);

    test("bind(TestNamespace.fromObject.bar) should follow absolute path", function() {
      run(function() {
        // create binding
        testObject.bind("foo", "TestNamespace.fromObject.bar");

        // now make a change to see if the binding triggers.
        set(fromObject, "bar", "changedValue");
      });

      equal("changedValue", get(testObject, "foo"), "testObject.foo");
    });

    test("bind(.bar) should bind to relative path", function() {
      run(function() {
        // create binding
        testObject.bind("foo", "bar") ;

        // now make a change to see if the binding triggers.
        set(testObject, "bar", "changedValue") ;
      });

      equal("changedValue", get(testObject, "foo"), "testObject.foo");
    });

    var fooBindingModuleOpts = {

      setup: function() {
        originalLookup = Ember.lookup;
        Ember.lookup = lookup = {};

        TestObject = EmberObject.extend({
          foo: "bar",
          bar: "foo",
          extraObject: null
        });

        fromObject = EmberObject.create({
          bar: "foo",
          extraObject: null
        }) ;

        extraObject = EmberObject.create({
          foo: "extraObjectValue"
        }) ;

        lookup['TestNamespace'] = TestNamespace = {
          fromObject: fromObject,
          testObject: TestObject
        } ;
      },

      teardown: function() {
        Ember.lookup = originalLookup;
        TestObject = fromObject = extraObject = null ;
      //  delete TestNamespace ;
      }

    };

    module("fooBinding method", fooBindingModuleOpts);


    test("fooBinding: TestNamespace.fromObject.bar should follow absolute path", function() {
      // create binding
      run(function() {
        testObject = TestObject.createWithMixins({
          fooBinding: "TestNamespace.fromObject.bar"
        }) ;

        // now make a change to see if the binding triggers.
        set(fromObject, "bar", "changedValue") ;
      });

      equal("changedValue", get(testObject, "foo"), "testObject.foo");
    });

    test("fooBinding: .bar should bind to relative path", function() {
      run(function() {
        testObject = TestObject.createWithMixins({
          fooBinding: "bar"
        });
        // now make a change to see if the binding triggers.
        set(testObject, "bar", "changedValue");
      });

      equal("changedValue", get(testObject, "foo"), "testObject.foo");
    });

    test('fooBinding: should disconnect bindings when destroyed', function () {
      run(function() {
        testObject = TestObject.createWithMixins({
          fooBinding: "TestNamespace.fromObject.bar"
        });

        set(TestNamespace.fromObject, 'bar', 'BAZ');
      });

      equal(get(testObject, 'foo'), 'BAZ', 'binding should have synced');

      destroy(testObject);

      run(function() {
        set(TestNamespace.fromObject, 'bar', 'BIFF');
      });

      ok(get(testObject, 'foo') !== 'bar', 'binding should not have synced');
    });
  });