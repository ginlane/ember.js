define("ember-views/tests/views/view/controller_test",
  ["ember-metal/core","ember-metal/run_loop","ember-views/views/container_view"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];

    var ContainerView = __dependency3__["default"];

    module("Ember.View - controller property");

    test("controller property should be inherited from nearest ancestor with controller", function() {
      var grandparent = ContainerView.create();
      var parent = ContainerView.create();
      var child = ContainerView.create();
      var grandchild = ContainerView.create();

      var grandparentController = {};
      var parentController = {};

      run(function() {
        grandparent.set('controller', grandparentController);
        parent.set('controller', parentController);

        grandparent.pushObject(parent);
        parent.pushObject(child);
      });

      strictEqual(grandparent.get('controller'), grandparentController);
      strictEqual(parent.get('controller'), parentController);
      strictEqual(child.get('controller'), parentController);
      strictEqual(grandchild.get('controller'), null);

      run(function() {
        child.pushObject(grandchild);
      });

      strictEqual(grandchild.get('controller'), parentController);

      var newController = {};
      run(function() {
        parent.set('controller', newController);
      });

      strictEqual(parent.get('controller'), newController);
      strictEqual(child.get('controller'), newController);
      strictEqual(grandchild.get('controller'), newController);

      run(function() {
        grandparent.destroy();
        parent.destroy();
        child.destroy();
        grandchild.destroy();
      });
    });
  });