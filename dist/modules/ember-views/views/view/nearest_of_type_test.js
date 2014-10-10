define("ember-views/tests/views/view/nearest_of_type_test",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-metal/mixin","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var run = __dependency3__["default"];
    var EmberMixin = __dependency4__.Mixin;
    var View = __dependency5__.View;

    var parentView, view;

    module("View#nearest*", {
      teardown: function() {
        run(function() {
          if (parentView) { parentView.destroy(); }
          if (view) { view.destroy(); }
        });
      }
    });

    (function() {
      var Mixin = EmberMixin.create({}),
          Parent = View.extend(Mixin, {
            render: function(buffer) {
              this.appendChild( View.create() );
            }
          });

      test("nearestOfType should find the closest view by view class", function() {
        var child;

        run(function() {
          parentView = Parent.create();
          parentView.appendTo('#qunit-fixture');
        });

        child = parentView.get('childViews')[0];
        equal(child.nearestOfType(Parent), parentView, "finds closest view in the hierarchy by class");
      });

      test("nearestOfType should find the closest view by mixin", function() {
        var child;

        run(function() {
          parentView = Parent.create();
          parentView.appendTo('#qunit-fixture');
        });

        child = parentView.get('childViews')[0];
        equal(child.nearestOfType(Mixin), parentView, "finds closest view in the hierarchy by class");
      });

    test("nearestWithProperty should search immediate parent", function() {
      var childView;

      view = View.create({
        myProp: true,

        render: function(buffer) {
          this.appendChild(View.create());
        }
      });

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      childView = view.get('childViews')[0];
      equal(childView.nearestWithProperty('myProp'), view);

    });

    }());
  });