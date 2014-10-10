define("ember-metal/tests/mixin/reopen_test",
  ["ember-metal/mixin"],
  function(__dependency1__) {
    "use strict";
    var Mixin = __dependency1__.Mixin;

    module('Ember.Mixin#reopen');

    test('using reopen() to add more properties to a simple', function() {
      var MixinA = Mixin.create({ foo: 'FOO', baz: 'BAZ' });
      MixinA.reopen({ bar: 'BAR', foo: 'FOO2' });
      var obj = {};
      MixinA.apply(obj);

      equal(Ember.get(obj, 'foo'), 'FOO2', 'mixin() should override');
      equal(Ember.get(obj, 'baz'), 'BAZ', 'preserve MixinA props');
      equal(Ember.get(obj, 'bar'), 'BAR', 'include MixinB props');
    });
  });