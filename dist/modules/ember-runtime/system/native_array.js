define("ember-runtime/system/native_array",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/enumerable_utils","ember-metal/mixin","ember-runtime/mixins/array","ember-runtime/mixins/mutable_array","ember-runtime/mixins/observable","ember-runtime/mixins/copyable","ember-runtime/mixins/freezable","ember-runtime/copy","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.EXTEND_PROTOTYPES

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var EnumerableUtils = __dependency4__["default"];
    var Mixin = __dependency5__.Mixin;
    var EmberArray = __dependency6__["default"];
    var MutableArray = __dependency7__["default"];
    var Observable = __dependency8__["default"];
    var Copyable = __dependency9__["default"];
    var FROZEN_ERROR = __dependency10__.FROZEN_ERROR;
    var copy = __dependency11__["default"];

    var replace = EnumerableUtils._replace,
        forEach = EnumerableUtils.forEach;

    // Add Ember.Array to Array.prototype. Remove methods with native
    // implementations and supply some more optimized versions of generic methods
    // because they are so common.

    /**
      The NativeArray mixin contains the properties needed to to make the native
      Array support Ember.MutableArray and all of its dependent APIs. Unless you
      have `Ember.EXTEND_PROTOTYPES` or `Ember.EXTEND_PROTOTYPES.Array` set to
      false, this will be applied automatically. Otherwise you can apply the mixin
      at anytime by calling `Ember.NativeArray.activate`.

      @class NativeArray
      @namespace Ember
      @uses Ember.MutableArray
      @uses Ember.Observable
      @uses Ember.Copyable
    */
    var NativeArray = Mixin.create(MutableArray, Observable, Copyable, {

      // because length is a built-in property we need to know to just get the
      // original property.
      get: function(key) {
        if (key==='length') return this.length;
        else if ('number' === typeof key) return this[key];
        else return this._super(key);
      },

      objectAt: function(idx) {
        return this[idx];
      },

      // primitive for array support.
      replace: function(idx, amt, objects) {

        if (this.isFrozen) throw FROZEN_ERROR;

        // if we replaced exactly the same number of items, then pass only the
        // replaced range. Otherwise, pass the full remaining array length
        // since everything has shifted
        var len = objects ? get(objects, 'length') : 0;
        this.arrayContentWillChange(idx, amt, len);

        if (len === 0) {
          this.splice(idx, amt);
        } else {
          replace(this, idx, amt, objects);
        }

        this.arrayContentDidChange(idx, amt, len);
        return this;
      },

      // If you ask for an unknown property, then try to collect the value
      // from member items.
      unknownProperty: function(key, value) {
        var ret;// = this.reducedProperty(key, value) ;
        if ((value !== undefined) && ret === undefined) {
          ret = this[key] = value;
        }
        return ret ;
      },

      // If browser did not implement indexOf natively, then override with
      // specialized version
      indexOf: function(object, startAt) {
        var idx, len = this.length;

        if (startAt === undefined) startAt = 0;
        else startAt = (startAt < 0) ? Math.ceil(startAt) : Math.floor(startAt);
        if (startAt < 0) startAt += len;

        for(idx=startAt;idx<len;idx++) {
          if (this[idx] === object) return idx ;
        }
        return -1;
      },

      lastIndexOf: function(object, startAt) {
        var idx, len = this.length;

        if (startAt === undefined) startAt = len-1;
        else startAt = (startAt < 0) ? Math.ceil(startAt) : Math.floor(startAt);
        if (startAt < 0) startAt += len;

        for(idx=startAt;idx>=0;idx--) {
          if (this[idx] === object) return idx ;
        }
        return -1;
      },

      copy: function(deep) {
        if (deep) {
          return this.map(function(item) { return copy(item, true); });
        }

        return this.slice();
      }
    });

    // Remove any methods implemented natively so we don't override them
    var ignore = ['length'];
    forEach(NativeArray.keys(), function(methodName) {
      if (Array.prototype[methodName]) ignore.push(methodName);
    });

    if (ignore.length>0) {
      NativeArray = NativeArray.without.apply(NativeArray, ignore);
    }

    /**
      Creates an `Ember.NativeArray` from an Array like object.
      Does not modify the original object. Ember.A is not needed if
      `Ember.EXTEND_PROTOTYPES` is `true` (the default value). However,
      it is recommended that you use Ember.A when creating addons for
      ember or when you can not guarantee that `Ember.EXTEND_PROTOTYPES`
      will be `true`.

      Example

      ```js
      var Pagination = Ember.CollectionView.extend({
        tagName: 'ul',
        classNames: ['pagination'],

        init: function() {
          this._super();
          if (!this.get('content')) {
            this.set('content', Ember.A());
          }
        }
      });
      ```

      @method A
      @for Ember
      @return {Ember.NativeArray}
    */
    var A = function(arr) {
      if (arr === undefined) { arr = []; }
      return EmberArray.detect(arr) ? arr : NativeArray.apply(arr);
    };

    /**
      Activates the mixin on the Array.prototype if not already applied. Calling
      this method more than once is safe. This will be called when ember is loaded
      unless you have `Ember.EXTEND_PROTOTYPES` or `Ember.EXTEND_PROTOTYPES.Array`
      set to `false`.

      Example

      ```js
      if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Array) {
        Ember.NativeArray.activate();
      }
      ```

      @method activate
      @for Ember.NativeArray
      @static
      @return {void}
    */
    NativeArray.activate = function() {
      NativeArray.apply(Array.prototype);

      A = function(arr) { return arr || []; };
    };

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Array) {
      NativeArray.activate();
    }

    Ember.A = A; // ES6TODO: Setting A onto the object returned by ember-metal/core to avoid circles
    __exports__.A = A;
    __exports__.NativeArray = NativeArray;__exports__["default"] = NativeArray;
  });