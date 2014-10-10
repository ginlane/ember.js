define("ember-metal/tests/binding/connect_test",
  ["ember-metal/core","ember-metal/tests/props_helper","ember-metal/binding","ember-metal/run_loop","ember-metal/platform","ember-metal/property_set","ember-metal/property_get","ember-metal/watching"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var testBoth = __dependency2__["default"];
    var Binding = __dependency3__.Binding;
    var bind = __dependency3__.bind;
    var run = __dependency4__["default"];
    var create = __dependency5__.create;
    var set = __dependency6__.set;
    var get = __dependency7__.get;
    var rewatch = __dependency8__.rewatch;

    function performTest(binding, a, b, get, set, connect) {
      if (connect === undefined) connect = function() {binding.connect(a);};

      ok(!run.currentRunLoop, 'performTest should not have a currentRunLoop');

      equal(get(a, 'foo'), 'FOO', 'a should not have changed');
      equal(get(b, 'bar'), 'BAR', 'b should not have changed');

      connect();

      equal(get(a, 'foo'), 'BAR', 'a should have changed');
      equal(get(b, 'bar'), 'BAR', 'b should have changed');
      //
      // make sure changes sync both ways
      run(function () {
        set(b, 'bar', 'BAZZ');
      });
      equal(get(a, 'foo'), 'BAZZ', 'a should have changed');

      run(function () {
        set(a, 'foo', 'BARF');
      });
      equal(get(b, 'bar'), 'BARF', 'a should have changed');
    }

    var originalLookup, lookup, GlobalB;

    module("Ember.Binding", {
      setup: function(){
        originalLookup = Ember.lookup;
        Ember.lookup = lookup = {};
      },
      teardown: function(){
        lookup = null;
        Ember.lookup = originalLookup;
      }
    });

    testBoth('Connecting a binding between two properties', function(get, set) {
      var a = { foo: 'FOO', bar: 'BAR' };

      // a.bar -> a.foo
      var binding = new Binding('foo', 'bar');

      performTest(binding, a, a, get, set);
    });

    testBoth('Connecting a binding between two objects', function(get, set) {
      var b = { bar: 'BAR' };
      var a = { foo: 'FOO', b: b };

      // b.bar -> a.foo
      var binding = new Binding('foo', 'b.bar');

      performTest(binding, a, b, get, set);
    });

    testBoth('Connecting a binding to path', function(get, set) {
      var a = { foo: 'FOO' };
      lookup['GlobalB'] = GlobalB = {
        b: { bar: 'BAR' }
      };

      var b = get(GlobalB, 'b');

      // globalB.b.bar -> a.foo
      var binding = new Binding('foo', 'GlobalB.b.bar');

      performTest(binding, a, b, get, set);

      // make sure modifications update
      b = { bar: 'BIFF' };

      run(function() {
        set(GlobalB, 'b', b);
      });

      equal(get(a, 'foo'), 'BIFF', 'a should have changed');
    });

    testBoth('Calling connect more than once', function(get, set) {
      var b = { bar: 'BAR' };
      var a = { foo: 'FOO', b: b };

      // b.bar -> a.foo
      var binding = new Binding('foo', 'b.bar');

      performTest(binding, a, b, get, set, function () {
        binding.connect(a);

        binding.connect(a);
      });
    });

    testBoth('Bindings should be inherited', function(get, set) {

      var a = { foo: 'FOO', b: { bar: 'BAR' } };
      var binding = new Binding('foo', 'b.bar');
      var a2;

      run(function () {
        binding.connect(a);

        a2 = create(a);
        rewatch(a2);
      });

      equal(get(a2, 'foo'), "BAR", "Should have synced binding on child");
      equal(get(a,  'foo'), "BAR", "Should NOT have synced binding on parent");

      run(function () {
        set(a2, 'b', { bar: 'BAZZ' });
      });

      equal(get(a2, 'foo'), "BAZZ", "Should have synced binding on child");
      equal(get(a,  'foo'), "BAR", "Should NOT have synced binding on parent");

    });

    test('inherited bindings should sync on create', function() {
      var a;
      run(function () {
        var A = function() {
          bind(this, 'foo', 'bar.baz');
        };

        a = new A();
        set(a, 'bar', { baz: 'BAZ' });
      });

      equal(get(a, 'foo'), 'BAZ', 'should have synced binding on new obj');
    });
  });