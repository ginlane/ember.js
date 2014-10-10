define("ember-runtime/tests/controllers/object_controller_tests",
  ["ember-runtime/controllers/object_controller"],
  function(__dependency1__) {
    "use strict";
    var ObjectController = __dependency1__["default"];

    module("Ember.ObjectController");


    test("should be able to set the target property of an ObjectController", function() {
      var controller = ObjectController.create();
      var target = {};

      controller.set('target', target);
      equal(controller.get('target'), target, "able to set the target property");
    });
  });