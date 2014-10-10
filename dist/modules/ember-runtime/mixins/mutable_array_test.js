define("ember-runtime/tests/mixins/mutable_array_test",
  ["ember-runtime/tests/suites/mutable_array","ember-runtime/mixins/mutable_array","ember-runtime/system/object","ember-metal/computed"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var MutableArrayTests = __dependency1__["default"];
    var MutableArray = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var computed = __dependency4__.computed;

    /*
      Implement a basic fake mutable array.  This validates that any non-native
      enumerable can impl this API.
    */
    var TestMutableArray = EmberObject.extend(MutableArray, {

      _content: null,

      init: function(ary) {
        this._content = Ember.A(ary || []);
      },

      replace: function(idx, amt, objects) {

        var args = objects ? objects.slice() : [],
            removeAmt = amt,
            addAmt    = args.length;

        this.arrayContentWillChange(idx, removeAmt, addAmt);

        args.unshift(amt);
        args.unshift(idx);
        this._content.splice.apply(this._content, args);
        this.arrayContentDidChange(idx, removeAmt, addAmt);
        return this;
      },

      objectAt: function(idx) {
        return this._content[idx];
      },

      length: computed(function() {
        return this._content.length;
      }),

      slice: function() {
        return this._content.slice();
      }

    });


    MutableArrayTests.extend({

      name: 'Basic Mutable Array',

      newObject: function(ary) {
        ary = ary ? ary.slice() : this.newFixture(3);
        return new TestMutableArray(ary);
      },

      // allows for testing of the basic enumerable after an internal mutation
      mutate: function(obj) {
        obj.addObject(this.getFixture(1)[0]);
      },

      toArray: function(obj) {
        return obj.slice();
      }

    }).run();
  });