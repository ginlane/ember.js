define("ember-metal/tests/mixin/detect_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/mixin","ember-metal/computed","ember-metal/properties"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var Mixin = __dependency4__.Mixin;
    var computed = __dependency5__.computed;
    var defineProperty = __dependency6__.defineProperty;

    module('Mixin.detect');

    test('detect() finds a directly applied mixin', function() {

      var MixinA = Mixin.create();
      var obj = {};

      equal(MixinA.detect(obj), false, 'MixinA.detect(obj) before apply()');

      MixinA.apply(obj);
      equal(MixinA.detect(obj), true, 'MixinA.detect(obj) after apply()');
    });

    test('detect() finds nested mixins', function() {
      var MixinA = Mixin.create({});
      var MixinB = Mixin.create(MixinA);
      var obj = {};

      equal(MixinA.detect(obj), false, 'MixinA.detect(obj) before apply()');

      MixinB.apply(obj);
      equal(MixinA.detect(obj), true, 'MixinA.detect(obj) after apply()');
    });

    test('detect() finds mixins on other mixins', function() {
      var MixinA = Mixin.create({});
      var MixinB = Mixin.create(MixinA);
      equal(MixinA.detect(MixinB), true, 'MixinA is part of MixinB');
      equal(MixinB.detect(MixinA), false, 'MixinB is not part of MixinA');
    });

    test('detect handles null values', function() {
      var MixinA = Mixin.create();
      equal(MixinA.detect(null), false);
    });
  });