define("ember-metal/tests/accessors/isGlobalPath_test",
  ["ember-metal/binding"],
  function(__dependency1__) {
    "use strict";
    var isGlobalPath = __dependency1__.isGlobalPath;

    module('Ember.isGlobalPath');

    test("global path's are recognized", function() {
      ok( isGlobalPath('App.myProperty') );
      ok( isGlobalPath('App.myProperty.subProperty') );
    });

    test("if there is a 'this' in the path, it's not a global path", function() {
      ok( !isGlobalPath('this.myProperty') );
      ok( !isGlobalPath('this') );
    });

    test("if the path starts with a lowercase character, it is not a global path", function() {
      ok( !isGlobalPath('myObj') );
      ok( !isGlobalPath('myObj.SecondProperty') );
    });
  });