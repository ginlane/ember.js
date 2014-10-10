define("ember-testing/adapters/qunit",
  ["ember-testing/adapters/adapter","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Adapter = __dependency1__["default"];
    var inspect = __dependency2__.inspect;

    /**
      This class implements the methods defined by Ember.Test.Adapter for the
      QUnit testing framework.

      @class QUnitAdapter
      @namespace Ember.Test
      @extends Ember.Test.Adapter
    */
    var QUnitAdapter = Adapter.extend({
      asyncStart: function() {
        QUnit.stop();
      },
      asyncEnd: function() {
        QUnit.start();
      },
      exception: function(error) {
        ok(false, inspect(error));
      }
    });

    __exports__["default"] = QUnitAdapter;
  });