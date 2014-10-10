define("ember-metal/tests/mixin/without_test",
  ["ember-metal/mixin"],
  function(__dependency1__) {
    "use strict";
    var Mixin = __dependency1__.Mixin;

    test('without should create a new mixin excluding named properties', function() {

      var MixinA = Mixin.create({
        foo: 'FOO',
        bar: 'BAR'
      });

      var MixinB = MixinA.without('bar');

      var obj = {};
      MixinB.apply(obj);

      equal(obj.foo, 'FOO', 'should defined foo');
      equal(obj.bar, undefined, 'should not define bar');

    });
  });