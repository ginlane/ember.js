define("ember-runtime/tests/legacy_1x/mixins/observable/chained_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-runtime/system/object","ember-metal/observer"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];
    var EmberObject = __dependency5__["default"];
    var addObserver = __dependency6__.addObserver;

    /*
      NOTE: This test is adapted from the 1.x series of unit tests.  The tests
      are the same except for places where we intend to break the API we instead
      validate that we warn the developer appropriately.

      CHANGES FROM 1.6:

      * changed obj.set() and obj.get() to Ember.set() and Ember.get()
      * changed obj.addObserver() to addObserver()
    */

    module("Ember.Observable - Observing with @each");

    test("chained observers on enumerable properties are triggered when the observed property of any item changes", function() {
      var family = EmberObject.create({ momma: null });
      var momma = EmberObject.create({ children: [] });

      var child1 = EmberObject.create({ name: "Bartholomew" });
      var child2 = EmberObject.create({ name: "Agnes" });
      var child3 = EmberObject.create({ name: "Dan" });
      var child4 = EmberObject.create({ name: "Nancy" });

      set(family, 'momma', momma);
      set(momma, 'children', Ember.A([child1, child2, child3]));

      var observerFiredCount = 0;
      addObserver(family, 'momma.children.@each.name', this, function() {
        observerFiredCount++;
      });

      observerFiredCount = 0;
      run(function() { get(momma, 'children').setEach('name', 'Juan'); });
      equal(observerFiredCount, 3, "observer fired after changing child names");

      observerFiredCount = 0;
      run(function() { get(momma, 'children').pushObject(child4); });
      equal(observerFiredCount, 1, "observer fired after adding a new item");

      observerFiredCount = 0;
      run(function() { set(child4, 'name', "Herbert"); });
      equal(observerFiredCount, 1, "observer fired after changing property on new object");

      set(momma, 'children', []);

      observerFiredCount = 0;
      run(function() { set(child1, 'name', "Hanna"); });
      equal(observerFiredCount, 0, "observer did not fire after removing changing property on a removed object");
    });
  });