define("ember-runtime/ext/rsvp",
  ["ember-metal/core","ember-metal/logger","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Logger = __dependency2__["default"];

    var RSVP = requireModule("rsvp");
    var Test, testModuleName = 'ember-testing/test';

    RSVP.onerrorDefault = function(error) {
      if (error instanceof Error) {
        if (Ember.testing) {
          // ES6TODO: remove when possible
          if (!Test && Ember.__loader.registry[testModuleName]) {
            Test = requireModule(testModuleName)['default'];
          }

          if (Test && Test.adapter) {
            Test.adapter.exception(error);
          } else {
            throw error;
          }
        } else if (Ember.onerror) {
          Ember.onerror(error);
        } else {
          Logger.error(error.stack);
          Ember.assert(error, false);
        }
      }
    };

    RSVP.on('error', RSVP.onerrorDefault);

    __exports__["default"] = RSVP;
  });