define("ember-metal/tests/props_helper",
  ["ember-metal/property_get","ember-metal/property_set","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /*global testBoth:true */

    var get = __dependency1__.get;
    var set = __dependency2__.set;

    // used by unit tests to test both accessor mode and non-accessor mode
    __exports__["default"] = function(testname, callback) {
      test(testname+' using Ember.get()/Ember.set()', function() {
        callback(get, set);
      });

      // test(testname+' using accessors', function() {
      //   if (Ember.USES_ACCESSORS) callback(aget, aset);
      //   else ok('SKIPPING ACCESSORS');
      // });
    };
  });