define("ember-views/tests/views/view/create_element_test",
  ["ember-metal/property_get","ember-metal/run_loop","ember-views/views/view","ember-views/views/container_view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var get = __dependency1__.get;
    var run = __dependency2__["default"];
    var EmberView = __dependency3__.View;
    var ContainerView = __dependency4__["default"];

    var view;

    module("Ember.View#createElement", {
      teardown: function() {
        run(function() {
          view.destroy();
        });
      }
    });

    test("returns the receiver", function() {
      var ret;

      view = EmberView.create();

      run(function() {
        ret = view.createElement();
      });

      equal(ret, view, 'returns receiver');
    });

    test("calls render and turns resultant string into element", function() {
      view = EmberView.create({
        tagName: 'span',

        render: function(buffer) {
          buffer.push("foo");
        }
      });

      equal(get(view, 'element'), null, 'precondition - has no element');
      run(function() {
        view.createElement();
      });


      var elem = get(view, 'element');
      ok(elem, 'has element now');
      equal(elem.innerHTML, 'foo', 'has innerHTML from context');
      equal(elem.tagName.toString().toLowerCase(), 'span', 'has tagName from view');
    });

    test("generated element include HTML from child views as well", function() {
      view = ContainerView.create({
        childViews: [ EmberView.create({ elementId: "foo" })]
      });

      run(function() {
        view.createElement();
      });

      ok(view.$('#foo').length, 'has element with child elementId');
    });
  });