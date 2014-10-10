define("ember-runtime/tests/computed/computed_macros_test",
  ["ember-metal/computed","ember-runtime/system/object","ember-runtime/tests/props_helper"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var computed = __dependency1__.computed;
    var EmberObject = __dependency2__["default"];
    var testBoth = __dependency3__.testBoth;

    module('CP macros');

    testBoth('Ember.computed.empty', function (get, set) {
      var obj = EmberObject.extend({
        bestLannister: null,
        lannisters: null,

        bestLannisterUnspecified: computed.empty('bestLannister'),
        noLannistersKnown: computed.empty('lannisters')
      }).create({
        lannisters: Ember.A([])
      });

      equal(get(obj, 'bestLannisterUnspecified'), true, "bestLannister initially empty");
      equal(get(obj, 'noLannistersKnown'), true, "lannisters initially empty");

      get(obj, 'lannisters').pushObject('Tyrion');
      set(obj, 'bestLannister', 'Tyrion');

      equal(get(obj, 'bestLannisterUnspecified'), false, "empty respects strings");
      equal(get(obj, 'noLannistersKnown'), false, "empty respects array mutations");
    });
  });