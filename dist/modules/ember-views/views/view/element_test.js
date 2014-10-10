define("ember-views/tests/views/view/element_test",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-views/system/jquery","ember-views/views/view","ember-views/views/container_view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var run = __dependency3__["default"];

    var jQuery = __dependency4__["default"];
    var EmberView = __dependency5__.View;
    var ContainerView = __dependency6__["default"];

    var parentView, child, parentDom, childDom, view;

    module("Ember.View#element", {
      teardown: function() {
        run(function() {
          if (parentView) { parentView.destroy(); }
          view.destroy();
        });
      }
    });

    test("returns null if the view has no element and no parent view", function() {
      view = EmberView.create() ;
      equal(get(view, 'parentView'), null, 'precond - has no parentView');
      equal(get(view, 'element'), null, 'has no element');
    });

    test("returns null if the view has no element and parent view has no element", function() {
      parentView = ContainerView.create({
        childViews: [ EmberView.extend() ]
      });
      view = get(parentView, 'childViews').objectAt(0);

      equal(get(view, 'parentView'), parentView, 'precond - has parent view');
      equal(get(parentView, 'element'), null, 'parentView has no element');
      equal(get(view, 'element'), null, ' has no element');
    });

    test("returns element if you set the value", function() {
      view = EmberView.create();
      equal(get(view, 'element'), null, 'precond- has no element');

      var dom = document.createElement('div');
      set(view, 'element', dom);

      equal(get(view, 'element'), dom, 'now has set element');
    });


    module("Ember.View#element - autodiscovery", {
      setup: function() {
        parentView = ContainerView.create({
          childViews: [ EmberView.extend({
            elementId: 'child-view'
          }) ]
        });

        child = get(parentView, 'childViews').objectAt(0);

        // setup parent/child dom
        parentDom = jQuery("<div><div id='child-view'></div></div>")[0];

        // set parent element...
        set(parentView, 'element', parentDom);
      },

      teardown: function() {
        run(function() {
          parentView.destroy();
          if (view) { view.destroy(); }
        });
        parentView = child = parentDom = childDom = null ;
      }
    });

    test("discovers element if has no element but parent view does have element", function() {
      equal(get(parentView, 'element'), parentDom, 'precond - parent has element');
      ok(parentDom.firstChild, 'precond - parentDom has first child');

      equal(child.$().attr('id'), 'child-view', 'view discovered child');
    });

    test("should not allow the elementId to be changed after inserted", function() {
      view = EmberView.create({
        elementId: 'one'
      });

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      raises(function() {
        view.set('elementId', 'two');
      }, "raises elementId changed exception");

      equal(view.get('elementId'), 'one', 'elementId is still "one"');
    });
  });