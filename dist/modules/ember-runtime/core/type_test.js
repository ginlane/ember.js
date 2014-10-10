define("ember-runtime/tests/core/type_test",
  ["ember-metal/utils","ember-runtime/system/object"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var typeOf = __dependency1__.typeOf;
    var EmberObject = __dependency2__["default"];

    module("Ember Type Checking");

    test("Ember.typeOf", function() {
      var a = null,
          arr = [1,2,3],
          obj = {},
          object = EmberObject.create({ method: function() {} });

      equal(typeOf(undefined),     'undefined', "item of type undefined");
      equal(typeOf(a),             'null',      "item of type null");
      equal(typeOf(arr),           'array',     "item of type array");
      equal(typeOf(obj),           'object',    "item of type object");
      equal(typeOf(object),        'instance',  "item of type instance");
      equal(typeOf(object.method), 'function',  "item of type function") ;
      equal(typeOf(EmberObject),     'class',     "item of type class");
      equal(typeOf(new Error()),   'error',     "item of type error");
    });
  });