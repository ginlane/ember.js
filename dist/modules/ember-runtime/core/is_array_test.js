define("ember-runtime/tests/core/is_array_test",
  ["ember-metal/core","ember-metal/utils","ember-runtime/system/array_proxy"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var isArray = __dependency2__.isArray;
    var ArrayProxy = __dependency3__["default"];

    module("Ember Type Checking");

    test("Ember.isArray" ,function() {
      var arrayProxy = ArrayProxy.create({ content: Ember.A() });

      equal(isArray(arrayProxy), true, "[]");
    });
  });