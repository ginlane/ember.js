define("ember-runtime/tests/mixins/mutable_enumerable_test",
  ["ember-runtime/tests/suites/mutable_enumerable","ember-runtime/mixins/mutable_enumerable","ember-metal/enumerable_utils","ember-runtime/system/object","ember-metal/computed","ember-metal/property_get","ember-metal/property_set"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__) {
    "use strict";
    var MutableEnumerableTests = __dependency1__["default"];
    var MutableEnumerable = __dependency2__["default"];
    var EnumerableUtils = __dependency3__["default"];
    var EmberObject = __dependency4__["default"];
    var computed = __dependency5__.computed;
    var get = __dependency6__.get;
    var set = __dependency7__.set;

    var indexOf = EnumerableUtils.indexOf;

    /*
      Implement a basic fake mutable array.  This validates that any non-native
      enumerable can impl this API.
    */
    var TestMutableEnumerable = EmberObject.extend(MutableEnumerable, {

      _content: null,

      addObject: function(obj) {
        if (indexOf(this._content, obj)>=0) return this;
        this.enumerableContentWillChange(null, [obj]);
        this._content.push(obj);
        this.enumerableContentDidChange(null, [obj]);
      },

      removeObject: function(obj) {
        var idx = indexOf(this._content, obj);
        if (idx<0) return this;

        this.enumerableContentWillChange([obj], null);
        this._content.splice(idx, 1);
        this.enumerableContentDidChange([obj], null);
        return this;
      },

      init: function(ary) {
        this._content = ary || [];
      },

      nextObject: function(idx) {
        return idx>=get(this, 'length') ? undefined : this._content[idx];
      },

      length: computed(function() {
        return this._content.length;
      }),

      slice: function() {
        return this._content.slice();
      }
    });


    MutableEnumerableTests.extend({

      name: 'Basic Mutable Array',

      newObject: function(ary) {
        ary = ary ? ary.slice() : this.newFixture(3);
        return new TestMutableEnumerable(ary);
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