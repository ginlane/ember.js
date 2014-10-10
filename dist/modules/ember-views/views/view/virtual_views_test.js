define("ember-views/tests/views/view/virtual_views_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/run_loop","ember-runtime/system/object","ember-views/system/jquery","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var run = __dependency3__["default"];
    var EmberObject = __dependency4__["default"];
    var jQuery = __dependency5__["default"];
    var EmberView = __dependency6__.View;

    var rootView, childView;

    module("virtual views", {
      teardown: function() {
        run(function() {
          rootView.destroy();
          childView.destroy();
        });
      }
    });

    test("a virtual view does not appear as a view's parentView", function() {
      rootView = EmberView.create({
        elementId: 'root-view',

        render: function(buffer) {
          buffer.push("<h1>Hi</h1>");
          this.appendChild(virtualView);
        }
      });

      var virtualView = EmberView.create({
        isVirtual: true,
        tagName: '',

        render: function(buffer) {
          buffer.push("<h2>Virtual</h2>");
          this.appendChild(childView);
        }
      });

      childView = EmberView.create({
        render: function(buffer) {
          buffer.push("<p>Bye!</p>");
        }
      });

      run(function() {
        jQuery("#qunit-fixture").empty();
        rootView.appendTo("#qunit-fixture");
      });

      equal(jQuery("#root-view > h2").length, 1, "nodes with '' tagName do not create wrappers");
      equal(get(childView, 'parentView'), rootView);

      var children = get(rootView, 'childViews');

      equal(get(children, 'length'), 1, "there is one child element");
      equal(children.objectAt(0), childView, "the child element skips through the virtual view");
    });

    test("when a virtual view's child views change, the parent's childViews should reflect", function() {
      rootView = EmberView.create({
        elementId: 'root-view',

        render: function(buffer) {
          buffer.push("<h1>Hi</h1>");
          this.appendChild(virtualView);
        }
      });

      var virtualView = EmberView.create({
        isVirtual: true,
        tagName: '',

        render: function(buffer) {
          buffer.push("<h2>Virtual</h2>");
          this.appendChild(childView);
        }
      });

      childView = EmberView.create({
        render: function(buffer) {
          buffer.push("<p>Bye!</p>");
        }
      });

      run(function() {
        jQuery("#qunit-fixture").empty();
        rootView.appendTo("#qunit-fixture");
      });

      equal(virtualView.get('childViews.length'), 1, "has childView - precond");
      equal(rootView.get('childViews.length'), 1, "has childView - precond");

      run(function() {
        childView.removeFromParent();
      });

      equal(virtualView.get('childViews.length'), 0, "has no childView");
      equal(rootView.get('childViews.length'), 0, "has no childView");
    });
  });