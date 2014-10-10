define("ember-views/tests/views/view/child_views_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/run_loop","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var run = __dependency3__["default"];

    var EmberView = __dependency4__.View;

    var parentView, childView, childViews;

    module('tests/views/view/child_views_tests.js', {
      setup: function() {
        parentView = EmberView.create({
          render: function(buffer) {
            buffer.push('Em');
            this.appendChild(childView);
          }
        });

        childView = EmberView.create({
          template: function() { return 'ber'; }
        });
      },

      teardown: function() {
        run(function() {
          parentView.destroy();
          childView.destroy();
        });

        childViews = null;
      }
    });

    // no parent element, buffer, no element
    // parent element

    // no parent element, no buffer, no element
    test("should render an inserted child view when the child is inserted before a DOM element is created", function() {
      run(function() {
        parentView.append();
      });

      equal(parentView.$().text(), 'Ember', 'renders the child view after the parent view');
    });

    test("should not duplicate childViews when rerendering in buffer", function() {

      var Inner = EmberView.extend({
        template: function() { return ''; }
      });

      var Inner2 = EmberView.extend({
        template: function() { return ''; }
      });

      var Middle = EmberView.extend({
        render: function(buffer) {
          this.appendChild(Inner);
          this.appendChild(Inner2);
        }
      });

      var outer = EmberView.create({
        render: function(buffer) {
          this.middle = this.appendChild(Middle);
        }
      });

      run(function() {
        outer.renderToBuffer();
      });

      equal(outer.get('middle.childViews.length'), 2, 'precond middle has 2 child views rendered to buffer');

      raises(function() {
        run(function() {
          outer.middle.rerender();
        });
      }, /Something you did caused a view to re-render after it rendered but before it was inserted into the DOM./);

      equal(outer.get('middle.childViews.length'), 2, 'middle has 2 child views rendered to buffer');

      run(function() {
        outer.destroy();
      });
    });
  });