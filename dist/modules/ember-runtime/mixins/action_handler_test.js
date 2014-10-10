define("ember-runtime/tests/mixins/action_handler_test",
  ["ember-metal/run_loop","ember-runtime/controllers/controller"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var run = __dependency1__["default"];
    var Controller = __dependency2__.Controller;
    var ControllerMixin = __dependency2__.ControllerMixin;

    test("passing a function for the actions hash triggers an assertion", function() {
      expect(1);

      var controller = Controller.extend({
        actions: function(){}
      });

      expectAssertion(function(){
        run(function(){
          controller.create();
        });
      });
    });
  });