define("ember-testing",
  ["ember-metal/core","ember-testing/initializers","ember-testing/support","ember-testing/setup_for_testing","ember-testing/test","ember-testing/adapters/adapter","ember-testing/adapters/qunit","ember-testing/helpers"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__) {
    "use strict";
    var Ember = __dependency1__["default"];

    // to setup initializer
         // to handle various edge cases

    var setupForTesting = __dependency4__["default"];
    var Test = __dependency5__["default"];
    var Adapter = __dependency6__["default"];
    var QUnitAdapter = __dependency7__["default"];
         // adds helpers to helpers object in Test

    /**
      Ember Testing

      @module ember
      @submodule ember-testing
      @requires ember-application
    */

    Ember.Test = Test;
    Ember.Test.Adapter = Adapter;
    Ember.Test.QUnitAdapter = QUnitAdapter;
    Ember.setupForTesting = setupForTesting;
  });