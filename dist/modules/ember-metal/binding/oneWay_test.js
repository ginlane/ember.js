define("ember-metal/tests/binding/oneWay_test",
  ["ember-metal/property_set","ember-metal/property_get","ember-metal/run_loop","ember-metal/binding"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var set = __dependency1__.set;
    var get = __dependency2__.get;
    var run = __dependency3__["default"];
    var oneWay = __dependency4__.oneWay;


    var MyApp;

    module('system/mixin/binding/oneWay_test', {
      setup: function() {
        MyApp = {
          foo: { value: 'FOO' },
          bar: { value: 'BAR' }
        };
      },

      teardown: function() {
        MyApp = null;
      }
    });

    test('oneWay(true) should only sync one way', function() {
      var binding;
      run(function() {
        binding = oneWay(MyApp, 'bar.value', 'foo.value');
      });

      equal(get(MyApp, 'foo.value'), 'FOO', 'foo synced');
      equal(get(MyApp, 'bar.value'), 'FOO', 'bar synced');

      run(function() {
        set(MyApp, 'bar.value', 'BAZ');
      });

      equal(get(MyApp, 'foo.value'), 'FOO', 'foo synced');
      equal(get(MyApp, 'bar.value'), 'BAZ', 'bar not synced');

      run(function() {
        set(MyApp, 'foo.value', 'BIFF');
      });

      equal(get(MyApp, 'foo.value'), 'BIFF', 'foo synced');
      equal(get(MyApp, 'bar.value'), 'BIFF', 'foo synced');

    });
  });