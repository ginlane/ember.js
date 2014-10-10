define("ember-runtime/tests/suites/mutable_array/pushObjects",
  ["ember-runtime/tests/suites/suite","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;

    var suite = SuiteModuleBuilder.create();

    suite.module('pushObjects');

    suite.test("should raise exception if not Ember.Enumerable is passed to pushObjects", function() {
      var obj = this.newObject([]);

      raises(function() {
        obj.pushObjects( "string" );
      });
    });

    __exports__["default"] = suite;
  });