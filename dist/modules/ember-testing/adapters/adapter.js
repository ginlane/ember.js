define("ember-testing/adapters/adapter",
  ["ember-metal/core","ember-metal/utils","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K
    var inspect = __dependency2__.inspect;
    var EmberObject = __dependency3__["default"];

    /**
     @module ember
     @submodule ember-testing
    */

    /**
      The primary purpose of this class is to create hooks that can be implemented
      by an adapter for various test frameworks.

      @class Adapter
      @namespace Ember.Test
    */
    var Adapter = EmberObject.extend({
      /**
        This callback will be called whenever an async operation is about to start.

        Override this to call your framework's methods that handle async
        operations.

        @public
        @method asyncStart
      */
      asyncStart: Ember.K,

      /**
        This callback will be called whenever an async operation has completed.

        @public
        @method asyncEnd
      */
      asyncEnd: Ember.K,

      /**
        Override this method with your testing framework's false assertion.
        This function is called whenever an exception occurs causing the testing
        promise to fail.

        QUnit example:

        ```javascript
          exception: function(error) {
            ok(false, error);
          };
        ```

        @public
        @method exception
        @param {String} error The exception to be raised.
      */
      exception: function(error) {
        throw error;
      }
    });

    __exports__["default"] = Adapter;
  });