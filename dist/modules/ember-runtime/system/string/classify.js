define("ember-runtime/tests/system/string/classify",
  ["ember-metal/core","ember-runtime/system/string"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var classify = __dependency2__.classify;

    module('EmberStringUtils.classify');

    if (!Ember.EXTEND_PROTOTYPES && !Ember.EXTEND_PROTOTYPES.String) {
      test("String.prototype.classify is not modified without EXTEND_PROTOTYPES", function() {
        ok("undefined" === typeof String.prototype.classify, 'String.prototype helper disabled');
      });
    }

    test("classify normal string", function() {
      deepEqual(classify('my favorite items'), 'MyFavoriteItems');
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('my favorite items'.classify(), 'MyFavoriteItems');
      }
    });

    test("classify dasherized string", function() {
      deepEqual(classify('css-class-name'), 'CssClassName');
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('css-class-name'.classify(), 'CssClassName');
      }
    });

    test("classify underscored string", function() {
      deepEqual(classify('action_name'), 'ActionName');
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('action_name'.classify(), 'ActionName');
      }
    });

    test("does nothing with classified string", function() {
      deepEqual(classify('InnerHTML'), 'InnerHTML');
      if (Ember.EXTEND_PROTOTYPES) {
        deepEqual('InnerHTML'.classify(), 'InnerHTML');
      }
    });
  });