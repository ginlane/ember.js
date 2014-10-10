define("ember-runtime/tests/system/string/w_test",
  ["ember-metal/core","ember-runtime/system/string"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var w = __dependency2__.w;

    module('EmberStringUtils.w');

    if (!Ember.EXTEND_PROTOTYPES && !Ember.EXTEND_PROTOTYPES.String) {
      test("String.prototype.w is not available without EXTEND_PROTOTYPES", function() {
        ok("undefined" === typeof String.prototype.w, 'String.prototype helper disabled');
      });
    }

    test("'one two three'.w() => ['one','two','three']", function() {
      deepEqual(w('one two three'), ['one','two','three']);
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('one two three'.w(), ['one','two','three']);
      }
    });

    test("'one    two    three'.w() with extra spaces between words => ['one','two','three']", function() {
      deepEqual(w('one   two  three'), ['one','two','three']);
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('one   two  three'.w(), ['one','two','three']);
      }
    });

    test("'one two three'.w() with tabs", function() {
      deepEqual(w('one\ttwo  three'), ['one','two','three']);
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('one\ttwo  three'.w(), ['one','two','three']);
      }
    });
  });