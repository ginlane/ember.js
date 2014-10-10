define("ember-metal/tests/mixin/required_test",
  ["ember-metal/mixin","ember-metal/property_get"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    /*globals setup raises */
    var mixin = __dependency1__.mixin;
    var Mixin = __dependency1__.Mixin;
    var required = __dependency1__.required;
    var get = __dependency2__.get;

    var PartialMixin, FinalMixin, obj;

    module('Module.required', {
      setup: function() {
        PartialMixin = Mixin.create({
          foo: required(),
          bar: 'BAR'
        });

        FinalMixin = Mixin.create({
          foo: 'FOO'
        });

        obj = {};
      },

      teardown: function() {
        PartialMixin = FinalMixin = obj = null;
      }
    });

    test('applying a mixin to meet requirement', function() {
      FinalMixin.apply(obj);
      PartialMixin.apply(obj);
      equal(get(obj, 'foo'), 'FOO', 'should now be defined');
    });

    test('combined mixins to meet requirement', function() {
      Mixin.create(PartialMixin, FinalMixin).apply(obj);
      equal(get(obj, 'foo'), 'FOO', 'should now be defined');
    });

    test('merged mixin', function() {
      Mixin.create(PartialMixin, { foo: 'FOO' }).apply(obj);
      equal(get(obj, 'foo'), 'FOO', 'should now be defined');
    });

    test('define property on source object', function() {
      obj.foo = 'FOO';
      PartialMixin.apply(obj);
      equal(get(obj, 'foo'), 'FOO', 'should now be defined');
    });

    test('using apply', function() {
      mixin(obj, PartialMixin, { foo: 'FOO' });
      equal(get(obj, 'foo'), 'FOO', 'should now be defined');
    });
  });