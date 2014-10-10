define("ember-runtime/tests/ext/mixin_test",
  ["ember-metal/property_set","ember-metal/property_get","ember-metal/mixin","ember-metal/platform","ember-metal/binding","ember-metal/run_loop"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var set = __dependency1__.set;
    var get = __dependency2__.get;
    var Mixin = __dependency3__.Mixin;
    var create = __dependency4__.create;
    var platform = __dependency4__.platform;
    var Binding = __dependency5__.Binding;
    var isGlobalPath = __dependency5__.isGlobalPath;
    var bind = __dependency5__.bind;
    var oneWay = __dependency5__.oneWay;
    var run = __dependency6__["default"];

    module('system/mixin/binding_test');

    test('Defining a property ending in Binding should setup binding when applied', function() {

      var MyMixin = Mixin.create({
        fooBinding: 'bar.baz'
      });

      var obj = { bar: { baz: 'BIFF' } };

      run(function() {
        MyMixin.apply(obj);
      });

      ok(get(obj, 'fooBinding') instanceof Binding, 'should be a binding object');
      equal(get(obj, 'foo'), 'BIFF', 'binding should be created and synced');

    });

    test('Defining a property ending in Binding should apply to prototype children', function() {
      var MyMixin, obj, obj2;

      run(function() {
        MyMixin = Mixin.create({
          fooBinding: 'bar.baz'
        });
      });

      obj = { bar: { baz: 'BIFF' } };

      run(function() {
        MyMixin.apply(obj);
      });


      obj2 = create(obj);
      run(function() {
        set(get(obj2, 'bar'), 'baz', 'BARG');
      });


      ok(get(obj2, 'fooBinding') instanceof Binding, 'should be a binding object');
      equal(get(obj2, 'foo'), 'BARG', 'binding should be created and synced');

    });
  });