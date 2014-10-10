define("ember-views/tests/views/view/init_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/run_loop","ember-metal/computed","ember-runtime/system/object","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var run = __dependency3__["default"];
    var computed = __dependency4__.computed;
    var EmberObject = __dependency5__["default"];
    var EmberView = __dependency6__.View;

    var originalLookup = Ember.lookup, lookup, view;

    module("EmberView.create", {
      setup: function() {
        Ember.lookup = lookup = {};
      },
      teardown: function() {
        run(function() {
          view.destroy();
        });

        Ember.lookup = originalLookup;
      }
    });

    test("registers view in the global views hash using layerId for event targeted", function() {
      view = EmberView.create();
      run(function() {
        view.appendTo('#qunit-fixture');
      });
      equal(EmberView.views[get(view, 'elementId')], view, 'registers view');
    });

    module("EmberView.createWithMixins");

    test("should warn if a non-array is used for classNames", function() {
      expectAssertion(function() {
        EmberView.createWithMixins({
          elementId: 'test',
          classNames: computed(function() {
            return ['className'];
          }).volatile()
        });
      }, /Only arrays are allowed/i);
    });

    test("should warn if a non-array is used for classNamesBindings", function() {
      expectAssertion(function() {
        EmberView.createWithMixins({
          elementId: 'test',
          classNameBindings: computed(function() {
            return ['className'];
          }).volatile()
        });
      }, /Only arrays are allowed/i);
    });
  });