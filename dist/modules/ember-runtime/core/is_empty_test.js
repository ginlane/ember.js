define("ember-runtime/tests/core/is_empty_test",
  ["ember-metal/core","ember-metal/is_empty","ember-runtime/system/array_proxy"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var isEmpty = __dependency2__.isEmpty;
    var ArrayProxy = __dependency3__["default"];

    module("Ember.isEmpty");

    test("Ember.isEmpty", function() {
      var arrayProxy = ArrayProxy.create({ content: Ember.A() });

      equal(true,  isEmpty(arrayProxy), "for an ArrayProxy that has empty content");
    });
  });