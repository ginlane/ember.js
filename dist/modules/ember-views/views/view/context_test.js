define("ember-views/tests/views/view/context_test",
  ["ember-metal/core","ember-metal/run_loop","ember-views/views/view","ember-views/views/container_view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];

    var EmberView = __dependency3__.View;
    var ContainerView = __dependency4__["default"];

    module("EmberView - context property");

    test("setting a controller on an inner view should change it context", function() {
      var App = {};
      var a = { name: 'a' };
      var b = { name: 'b' };

      var innerView = EmberView.create();
      var middleView = ContainerView.create();
      var outerView = App.outerView = ContainerView.create({
        controller: a
      });

      run(function() {
        outerView.appendTo('#qunit-fixture');
      });

      run(function () {
        outerView.set('currentView', middleView);
      });

      run(function () {
        innerView.set('controller', b);
        middleView.set('currentView', innerView);
      });

      // assert
      equal(outerView.get('context'), a, 'outer context correct');
      equal(middleView.get('context'), a, 'middle context correct');
      equal(innerView.get('context'), b, 'inner context correct');

      run(function() {
        innerView.destroy();
        middleView.destroy();
        outerView.destroy();
      });
    });
  });