define("ember-testing/setup_for_testing",
  ["ember-metal/core","ember-testing/adapters/qunit","ember-views/system/jquery","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // import Test from "ember-testing/test";  // ES6TODO: fix when cycles are supported
    var QUnitAdapter = __dependency2__["default"];
    var jQuery = __dependency3__["default"];

    var Test;

    function incrementAjaxPendingRequests(){
      Test.pendingAjaxRequests++;
    }

    function decrementAjaxPendingRequests(){
      Ember.assert("An ajaxComplete event which would cause the number of pending AJAX " +
                   "requests to be negative has been triggered. This is most likely " +
                   "caused by AJAX events that were started before calling " +
                   "`injectTestHelpers()`.", Test.pendingAjaxRequests !== 0);
      Test.pendingAjaxRequests--;
    }

    /**
      Sets Ember up for testing. This is useful to perform
      basic setup steps in order to unit test.

      Use `App.setupForTesting` to perform integration tests (full
      application testing).

      @method setupForTesting
      @namespace Ember
      @since 1.5.0
    */
    function setupForTesting() {
      if (!Test) { Test = requireModule('ember-testing/test')['default']; }

      Ember.testing = true;

      // if adapter is not manually set default to QUnit
      if (!Test.adapter) {
        Test.adapter = QUnitAdapter.create();
      }

      if (!Test.pendingAjaxRequests) {
        Test.pendingAjaxRequests = 0;
      }

      jQuery(document).off('ajaxSend', incrementAjaxPendingRequests);
      jQuery(document).off('ajaxComplete', decrementAjaxPendingRequests);
      jQuery(document).on('ajaxSend', incrementAjaxPendingRequests);
      jQuery(document).on('ajaxComplete', decrementAjaxPendingRequests);
    };

    __exports__["default"] = setupForTesting;
  });