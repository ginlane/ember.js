define("ember-handlebars-compiler/tests/make_view_helper_test",
  ["ember-handlebars-compiler"],
  function(__dependency1__) {
    "use strict";
    var EmberHandlebars = __dependency1__["default"];

    module("Ember.Handlebars.makeViewHelper");

    test("makes helpful assertion when called with invalid arguments", function(){
      var viewClass = {toString: function(){ return 'Some Random Class';}};

      var helper = EmberHandlebars.makeViewHelper(viewClass);

      expectAssertion(function(){
        helper({foo: 'bar'}, this);
      }, "You can only pass attributes (such as name=value) not bare values to a helper for a View found in 'Some Random Class'");
    });
  });