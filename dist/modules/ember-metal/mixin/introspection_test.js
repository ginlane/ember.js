define("ember-metal/tests/mixin/introspection_test",
  ["ember-metal/utils","ember-metal/mixin","ember-metal/enumerable_utils"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    // NOTE: A previous iteration differentiated between public and private props
    // as well as methods vs props.  We are just keeping these for testing; the
    // current impl doesn't care about the differences as much...

    var guidFor = __dependency1__.guidFor;
    var mixin = __dependency2__.mixin;
    var Mixin = __dependency2__.Mixin;
    var EnumerableUtils = __dependency3__["default"];

    var PrivateProperty = Mixin.create({
      _foo: '_FOO'
    });

    var PublicProperty = Mixin.create({
      foo: 'FOO'
    });

    var PrivateMethod = Mixin.create({
      _fooMethod: function() {}
    });

    var PublicMethod = Mixin.create({
      fooMethod: function() {}
    });

    var BarProperties = Mixin.create({
      _bar: '_BAR',
      bar: 'bar'
    });

    var BarMethods = Mixin.create({
      _barMethod: function() {},
      barMethod: function() {}
    });

    var Combined = Mixin.create(BarProperties, BarMethods);

    var obj ;

    module('Basic introspection', {
      setup: function() {
        obj = {};
        mixin(obj, PrivateProperty, PublicProperty, PrivateMethod, PublicMethod, Combined);
      }
    });

    test('Ember.mixins()', function() {

      function mapGuids(ary) {
        return EnumerableUtils.map(ary, function(x) { return guidFor(x); });
      }

      deepEqual(mapGuids(Mixin.mixins(obj)), mapGuids([PrivateProperty, PublicProperty, PrivateMethod, PublicMethod, Combined, BarProperties, BarMethods]), 'should return included mixins');
    });
  });