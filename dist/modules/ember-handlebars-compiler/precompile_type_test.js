define("ember-handlebars-compiler/tests/precompile_type_test",
  ["ember-handlebars-compiler"],
  function(__dependency1__) {
    "use strict";
    var EmberHandlebars = __dependency1__["default"];
    var precompile = EmberHandlebars.precompile,
        template = 'Hello World',
        result;

    module("Ember.Handlebars.precompileType");

    test("precompile creates a function when asObject isn't defined", function(){
      result = precompile(template);
      equal(typeof(result), "function");
    });

    test("precompile creates a function when asObject is true", function(){
      result = precompile(template, true);
      equal(typeof(result), "function");
    });

    test("precompile creates a string when asObject is false", function(){
      result = precompile(template, false);
      equal(typeof(result), "string");
    });
  });