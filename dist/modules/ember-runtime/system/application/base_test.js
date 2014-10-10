define("ember-runtime/tests/system/application/base_test",
  ["ember-runtime/system/namespace","ember-runtime/system/application"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Namespace = __dependency1__["default"];
    var Application = __dependency2__["default"];

    module('Ember.Application');

    test('Ember.Application should be a subclass of Ember.Namespace', function() {

      ok(Namespace.detect(Application), 'Ember.Application subclass of Ember.Namespace');
    });
  });