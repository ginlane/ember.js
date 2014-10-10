define("ember-runtime/tests/mixins/comparable_test",
  ["ember-metal/property_get","ember-runtime/system/object","ember-runtime/compare","ember-runtime/mixins/comparable"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var get = __dependency1__.get;
    var EmberObject = __dependency2__["default"];
    var compare = __dependency3__["default"];
    var Comparable = __dependency4__["default"];

    var Rectangle = EmberObject.extend(Comparable, {
      length: 0,
      width: 0,

      area: function() {
        return get(this,'length') * get(this, 'width');
      },

      compare: function(a, b) {
        return compare(a.area(), b.area());
      }

    });

    var r1, r2;

    module("Comparable", {

      setup: function() {
        r1 = Rectangle.create({length: 6, width: 12});
        r2 = Rectangle.create({length: 6, width: 13});
      },

      teardown: function() {
      }

    });

    test("should be comparable and return the correct result", function() {
      equal(Comparable.detect(r1), true);
      equal(compare(r1, r1), 0);
      equal(compare(r1, r2), -1);
      equal(compare(r2, r1), 1);
    });
  });