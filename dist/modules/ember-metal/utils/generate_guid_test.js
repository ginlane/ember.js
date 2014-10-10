define("ember-metal/tests/utils/generate_guid_test",
  ["ember-metal/utils"],
  function(__dependency1__) {
    "use strict";
    var generateGuid = __dependency1__.generateGuid;

    module("Ember.generateGuid");

    test("Prefix", function() {
      var a = {};

      ok( generateGuid(a, 'tyrell').indexOf('tyrell') > -1, "guid can be prefixed" );
    });
  });