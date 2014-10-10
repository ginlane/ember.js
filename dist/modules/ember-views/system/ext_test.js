define("ember-views/tests/system/ext_test",
  ["ember-metal/run_loop","ember-views/views/view"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var run = __dependency1__["default"];
    var View = __dependency2__.View;

    module("Ember.View additions to run queue");

    test("View hierarchy is done rendering to DOM when functions queued in afterRender execute", function() {
      var lookup1, lookup2;
      var childView = View.create({
        elementId: 'child_view',
        render: function(buffer) {
          buffer.push('child');
        },
        didInsertElement: function() {
          this.$().addClass('extra-class');
        }
      });
      var parentView = View.create({
        elementId: 'parent_view',
        render: function(buffer) {
          buffer.push('parent');
          this.appendChild(childView);
        },
        didInsertElement: function() {
          lookup1 = this.$('.extra-class');
          run.scheduleOnce('afterRender', this, function() {
            lookup2 = this.$('.extra-class');
          });
        }
      });

      run(function() {
        parentView.appendTo('#qunit-fixture');
      });

      equal(lookup1.length, 0, "doesn't not find child in DOM on didInsertElement");
      equal(lookup2.length, 1, "finds child in DOM afterRender");

      run(function() {
        parentView.destroy();
      });
    });
  });