(function() {
define("ember-runtime/compare",
  ["ember-metal/core","ember-metal/utils","ember-runtime/mixins/comparable","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
     // for Ember.ORDER_DEFINITION
    var typeOf = __dependency2__.typeOf;
    var Comparable = __dependency3__["default"];

    // Used by Ember.compare
    Ember.ORDER_DEFINITION = Ember.ENV.ORDER_DEFINITION || [
      'undefined',
      'null',
      'boolean',
      'number',
      'string',
      'array',
      'object',
      'instance',
      'function',
      'class',
      'date'
    ];

    /**
     This will compare two javascript values of possibly different types.
     It will tell you which one is greater than the other by returning:

      - -1 if the first is smaller than the second,
      - 0 if both are equal,
      - 1 if the first is greater than the second.

     The order is calculated based on `Ember.ORDER_DEFINITION`, if types are different.
     In case they have the same type an appropriate comparison for this type is made.

      ```javascript
      Ember.compare('hello', 'hello');  // 0
      Ember.compare('abc', 'dfg');      // -1
      Ember.compare(2, 1);              // 1
      ```

     @method compare
     @for Ember
     @param {Object} v First value to compare
     @param {Object} w Second value to compare
     @return {Number} -1 if v < w, 0 if v = w and 1 if v > w.
    */
    function compare(v, w) {
      if (v === w) { return 0; }

      var type1 = typeOf(v);
      var type2 = typeOf(w);

      if (Comparable) {
        if (type1==='instance' && Comparable.detect(v.constructor)) {
          return v.constructor.compare(v, w);
        }

        if (type2 === 'instance' && Comparable.detect(w.constructor)) {
          return 1-w.constructor.compare(w, v);
        }
      }

      // If we haven't yet generated a reverse-mapping of Ember.ORDER_DEFINITION,
      // do so now.
      var mapping = Ember.ORDER_DEFINITION_MAPPING;
      if (!mapping) {
        var order = Ember.ORDER_DEFINITION;
        mapping = Ember.ORDER_DEFINITION_MAPPING = {};
        var idx, len;
        for (idx = 0, len = order.length; idx < len;  ++idx) {
          mapping[order[idx]] = idx;
        }

        // We no longer need Ember.ORDER_DEFINITION.
        delete Ember.ORDER_DEFINITION;
      }

      var type1Index = mapping[type1];
      var type2Index = mapping[type2];

      if (type1Index < type2Index) { return -1; }
      if (type1Index > type2Index) { return 1; }

      // types are equal - so we have to check values now
      switch (type1) {
        case 'boolean':
        case 'number':
          if (v < w) { return -1; }
          if (v > w) { return 1; }
          return 0;

        case 'string':
          var comp = v.localeCompare(w);
          if (comp < 0) { return -1; }
          if (comp > 0) { return 1; }
          return 0;

        case 'array':
          var vLen = v.length;
          var wLen = w.length;
          var l = Math.min(vLen, wLen);
          var r = 0;
          var i = 0;
          while (r === 0 && i < l) {
            r = compare(v[i],w[i]);
            i++;
          }
          if (r !== 0) { return r; }

          // all elements are equal now
          // shorter array should be ordered first
          if (vLen < wLen) { return -1; }
          if (vLen > wLen) { return 1; }
          // arrays are equal now
          return 0;

        case 'instance':
          if (Comparable && Comparable.detect(v)) {
            return v.compare(v, w);
          }
          return 0;

        case 'date':
          var vNum = v.getTime();
          var wNum = w.getTime();
          if (vNum < wNum) { return -1; }
          if (vNum > wNum) { return 1; }
          return 0;

        default:
          return 0;
      }
    };

    __exports__["default"] = compare;
  });
define("ember-runtime/computed/array_computed",
  ["ember-metal/core","ember-runtime/computed/reduce_computed","ember-metal/enumerable_utils","ember-metal/platform","ember-metal/observer","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var reduceComputed = __dependency2__.reduceComputed;
    var ReduceComputedProperty = __dependency2__.ReduceComputedProperty;
    var EnumerableUtils = __dependency3__["default"];
    var create = __dependency4__.create;
    var addObserver = __dependency5__.addObserver;
    var EmberError = __dependency6__["default"];

    var a_slice = [].slice,
        o_create = create,
        forEach = EnumerableUtils.forEach;

    function ArrayComputedProperty() {
      var cp = this;

      ReduceComputedProperty.apply(this, arguments);

      this.func = (function(reduceFunc) {
        return function (propertyName) {
          if (!cp._hasInstanceMeta(this, propertyName)) {
            // When we recompute an array computed property, we need already
            // retrieved arrays to be updated; we can't simply empty the cache and
            // hope the array is re-retrieved.
            forEach(cp._dependentKeys, function(dependentKey) {
              addObserver(this, dependentKey, function() {
                cp.recomputeOnce.call(this, propertyName);
              });
            }, this);
          }

          return reduceFunc.apply(this, arguments);
        };
      })(this.func);

      return this;
    }

    ArrayComputedProperty.prototype = o_create(ReduceComputedProperty.prototype);
    ArrayComputedProperty.prototype.initialValue = function () {
      return Ember.A();
    };
    ArrayComputedProperty.prototype.resetValue = function (array) {
      array.clear();
      return array;
    };

    // This is a stopgap to keep the reference counts correct with lazy CPs.
    ArrayComputedProperty.prototype.didChange = function (obj, keyName) {
      return;
    };

    /**
      Creates a computed property which operates on dependent arrays and
      is updated with "one at a time" semantics. When items are added or
      removed from the dependent array(s) an array computed only operates
      on the change instead of re-evaluating the entire array. This should
      return an array, if you'd like to use "one at a time" semantics and
      compute some value other then an array look at
      `Ember.reduceComputed`.

      If there are more than one arguments the first arguments are
      considered to be dependent property keys. The last argument is
      required to be an options object. The options object can have the
      following three properties.

      `initialize` - An optional initialize function. Typically this will be used
      to set up state on the instanceMeta object.

      `removedItem` - A function that is called each time an element is
      removed from the array.

      `addedItem` - A function that is called each time an element is
      added to the array.


      The `initialize` function has the following signature:

      ```javascript
      function(array, changeMeta, instanceMeta)
      ```

      `array` - The initial value of the arrayComputed, an empty array.

      `changeMeta` - An object which contains meta information about the
      computed. It contains the following properties:

         - `property` the computed property
         - `propertyName` the name of the property on the object

      `instanceMeta` - An object that can be used to store meta
      information needed for calculating your computed. For example a
      unique computed might use this to store the number of times a given
      element is found in the dependent array.


      The `removedItem` and `addedItem` functions both have the following signature:

      ```javascript
      function(accumulatedValue, item, changeMeta, instanceMeta)
      ```

      `accumulatedValue` - The value returned from the last time
      `removedItem` or `addedItem` was called or an empty array.

      `item` - the element added or removed from the array

      `changeMeta` - An object which contains meta information about the
      change. It contains the following properties:

        - `property` the computed property
        - `propertyName` the name of the property on the object
        - `index` the index of the added or removed item
        - `item` the added or removed item: this is exactly the same as
          the second arg
        - `arrayChanged` the array that triggered the change. Can be
          useful when depending on multiple arrays.

      For property changes triggered on an item property change (when
      depKey is something like `someArray.@each.someProperty`),
      `changeMeta` will also contain the following property:

        - `previousValues` an object whose keys are the properties that changed on
        the item, and whose values are the item's previous values.

      `previousValues` is important Ember coalesces item property changes via
      Ember.run.once. This means that by the time removedItem gets called, item has
      the new values, but you may need the previous value (eg for sorting &
      filtering).

      `instanceMeta` - An object that can be used to store meta
      information needed for calculating your computed. For example a
      unique computed might use this to store the number of times a given
      element is found in the dependent array.

      The `removedItem` and `addedItem` functions should return the accumulated
      value. It is acceptable to not return anything (ie return undefined)
      to invalidate the computation. This is generally not a good idea for
      arrayComputed but it's used in eg max and min.

      Example

      ```javascript
      Ember.computed.map = function(dependentKey, callback) {
        var options = {
          addedItem: function(array, item, changeMeta, instanceMeta) {
            var mapped = callback(item);
            array.insertAt(changeMeta.index, mapped);
            return array;
          },
          removedItem: function(array, item, changeMeta, instanceMeta) {
            array.removeAt(changeMeta.index, 1);
            return array;
          }
        };

        return Ember.arrayComputed(dependentKey, options);
      };
      ```

      @method arrayComputed
      @for Ember
      @param {String} [dependentKeys*]
      @param {Object} options
      @return {Ember.ComputedProperty}
    */
    function arrayComputed (options) {
      var args;

      if (arguments.length > 1) {
        args = a_slice.call(arguments, 0, -1);
        options = a_slice.call(arguments, -1)[0];
      }

      if (typeof options !== "object") {
        throw new EmberError("Array Computed Property declared without an options hash");
      }

      var cp = new ArrayComputedProperty(options);

      if (args) {
        cp.property.apply(cp, args);
      }

      return cp;
    };

    __exports__.arrayComputed = arrayComputed;
    __exports__.ArrayComputedProperty = ArrayComputedProperty;
  });
define("ember-runtime/computed/reduce_computed",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/error","ember-metal/property_events","ember-metal/expand_properties","ember-metal/observer","ember-metal/computed","ember-metal/platform","ember-metal/enumerable_utils","ember-runtime/system/tracked_array","ember-runtime/mixins/array","ember-metal/run_loop","ember-runtime/system/set","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.assert
    var e_get = __dependency2__.get;
    var set = __dependency3__.set;
    var guidFor = __dependency4__.guidFor;
    var metaFor = __dependency4__.meta;
    var EmberError = __dependency5__["default"];
    var propertyWillChange = __dependency6__.propertyWillChange;
    var propertyDidChange = __dependency6__.propertyDidChange;
    var expandProperties = __dependency7__["default"];
    var addObserver = __dependency8__.addObserver;
    var observersFor = __dependency8__.observersFor;
    var removeObserver = __dependency8__.removeObserver;
    var addBeforeObserver = __dependency8__.addBeforeObserver;
    var removeBeforeObserver = __dependency8__.removeBeforeObserver;
    var ComputedProperty = __dependency9__.ComputedProperty;
    var cacheFor = __dependency9__.cacheFor;
    var create = __dependency10__.create;
    var EnumerableUtils = __dependency11__["default"];
    var TrackedArray = __dependency12__["default"];
    var EmberArray = __dependency13__["default"];
    var run = __dependency14__["default"];
    var Set = __dependency15__["default"];
    var isArray = __dependency4__.isArray;

    var cacheSet = cacheFor.set,
        cacheGet = cacheFor.get,
        cacheRemove = cacheFor.remove,
        a_slice = [].slice,
        o_create = create,
        forEach = EnumerableUtils.forEach,
        // Here we explicitly don't allow `@each.foo`; it would require some special
        // testing, but there's no particular reason why it should be disallowed.
        eachPropertyPattern = /^(.*)\.@each\.(.*)/,
        doubleEachPropertyPattern = /(.*\.@each){2,}/,
        arrayBracketPattern = /\.\[\]$/;

    function get(obj, key) {
      if (key === '@this') {
        return obj;
      }

      return e_get(obj, key);
    }

    /*
      Tracks changes to dependent arrays, as well as to properties of items in
      dependent arrays.

      @class DependentArraysObserver
    */
    function DependentArraysObserver(callbacks, cp, instanceMeta, context, propertyName, sugarMeta) {
      // user specified callbacks for `addedItem` and `removedItem`
      this.callbacks = callbacks;

      // the computed property: remember these are shared across instances
      this.cp = cp;

      // the ReduceComputedPropertyInstanceMeta this DependentArraysObserver is
      // associated with
      this.instanceMeta = instanceMeta;

      // A map of array guids to dependentKeys, for the given context.  We track
      // this because we want to set up the computed property potentially before the
      // dependent array even exists, but when the array observer fires, we lack
      // enough context to know what to update: we can recover that context by
      // getting the dependentKey.
      this.dependentKeysByGuid = {};

      // a map of dependent array guids -> TrackedArray instances.  We use
      // this to lazily recompute indexes for item property observers.
      this.trackedArraysByGuid = {};

      // We suspend observers to ignore replacements from `reset` when totally
      // recomputing.  Unfortunately we cannot properly suspend the observers
      // because we only have the key; instead we make the observers no-ops
      this.suspended = false;

      // This is used to coalesce item changes from property observers within a
      // single item.
      this.changedItems = {};
      // This is used to coalesce item changes for multiple items that depend on
      // some shared state.
      this.changedItemCount = 0;
    }

    function ItemPropertyObserverContext (dependentArray, index, trackedArray) {
      Ember.assert("Internal error: trackedArray is null or undefined", trackedArray);

      this.dependentArray = dependentArray;
      this.index = index;
      this.item = dependentArray.objectAt(index);
      this.trackedArray = trackedArray;
      this.beforeObserver = null;
      this.observer = null;

      this.destroyed = false;
    }

    DependentArraysObserver.prototype = {
      setValue: function (newValue) {
        this.instanceMeta.setValue(newValue, true);
      },
      getValue: function () {
        return this.instanceMeta.getValue();
      },

      setupObservers: function (dependentArray, dependentKey) {
        this.dependentKeysByGuid[guidFor(dependentArray)] = dependentKey;

        dependentArray.addArrayObserver(this, {
          willChange: 'dependentArrayWillChange',
          didChange: 'dependentArrayDidChange'
        });

        if (this.cp._itemPropertyKeys[dependentKey]) {
          this.setupPropertyObservers(dependentKey, this.cp._itemPropertyKeys[dependentKey]);
        }
      },

      teardownObservers: function (dependentArray, dependentKey) {
        var itemPropertyKeys = this.cp._itemPropertyKeys[dependentKey] || [];

        delete this.dependentKeysByGuid[guidFor(dependentArray)];

        this.teardownPropertyObservers(dependentKey, itemPropertyKeys);

        dependentArray.removeArrayObserver(this, {
          willChange: 'dependentArrayWillChange',
          didChange: 'dependentArrayDidChange'
        });
      },

      suspendArrayObservers: function (callback, binding) {
        var oldSuspended = this.suspended;
        this.suspended = true;
        callback.call(binding);
        this.suspended = oldSuspended;
      },

      setupPropertyObservers: function (dependentKey, itemPropertyKeys) {
        var dependentArray = get(this.instanceMeta.context, dependentKey),
            length = get(dependentArray, 'length'),
            observerContexts = new Array(length);

        this.resetTransformations(dependentKey, observerContexts);

        forEach(dependentArray, function (item, index) {
          var observerContext = this.createPropertyObserverContext(dependentArray, index, this.trackedArraysByGuid[dependentKey]);
          observerContexts[index] = observerContext;

          forEach(itemPropertyKeys, function (propertyKey) {
            addBeforeObserver(item, propertyKey, this, observerContext.beforeObserver);
            addObserver(item, propertyKey, this, observerContext.observer);
          }, this);
        }, this);
      },

      teardownPropertyObservers: function (dependentKey, itemPropertyKeys) {
        var dependentArrayObserver = this,
            trackedArray = this.trackedArraysByGuid[dependentKey],
            beforeObserver,
            observer,
            item;

        if (!trackedArray) { return; }

        trackedArray.apply(function (observerContexts, offset, operation) {
          if (operation === TrackedArray.DELETE) { return; }

          forEach(observerContexts, function (observerContext) {
            observerContext.destroyed = true;
            beforeObserver = observerContext.beforeObserver;
            observer = observerContext.observer;
            item = observerContext.item;

            forEach(itemPropertyKeys, function (propertyKey) {
              removeBeforeObserver(item, propertyKey, dependentArrayObserver, beforeObserver);
              removeObserver(item, propertyKey, dependentArrayObserver, observer);
            });
          });
        });
      },

      createPropertyObserverContext: function (dependentArray, index, trackedArray) {
        var observerContext = new ItemPropertyObserverContext(dependentArray, index, trackedArray);

        this.createPropertyObserver(observerContext);

        return observerContext;
      },

      createPropertyObserver: function (observerContext) {
        var dependentArrayObserver = this;

        observerContext.beforeObserver = function (obj, keyName) {
          return dependentArrayObserver.itemPropertyWillChange(obj, keyName, observerContext.dependentArray, observerContext);
        };
        observerContext.observer = function (obj, keyName) {
          return dependentArrayObserver.itemPropertyDidChange(obj, keyName, observerContext.dependentArray, observerContext);
        };
      },

      resetTransformations: function (dependentKey, observerContexts) {
        this.trackedArraysByGuid[dependentKey] = new TrackedArray(observerContexts);
      },

      trackAdd: function (dependentKey, index, newItems) {
        var trackedArray = this.trackedArraysByGuid[dependentKey];
        if (trackedArray) {
          trackedArray.addItems(index, newItems);
        }
      },

      trackRemove: function (dependentKey, index, removedCount) {
        var trackedArray = this.trackedArraysByGuid[dependentKey];

        if (trackedArray) {
          return trackedArray.removeItems(index, removedCount);
        }

        return [];
      },

      updateIndexes: function (trackedArray, array) {
        var length = get(array, 'length');
        // OPTIMIZE: we could stop updating once we hit the object whose observer
        // fired; ie partially apply the transformations
        trackedArray.apply(function (observerContexts, offset, operation, operationIndex) {
          // we don't even have observer contexts for removed items, even if we did,
          // they no longer have any index in the array
          if (operation === TrackedArray.DELETE) { return; }
          if (operationIndex === 0 && operation === TrackedArray.RETAIN && observerContexts.length === length && offset === 0) {
            // If we update many items we don't want to walk the array each time: we
            // only need to update the indexes at most once per run loop.
            return;
          }

          forEach(observerContexts, function (context, index) {
            context.index = index + offset;
          });
        });
      },

      dependentArrayWillChange: function (dependentArray, index, removedCount, addedCount) {
        if (this.suspended) { return; }

        var removedItem = this.callbacks.removedItem,
            changeMeta,
            guid = guidFor(dependentArray),
            dependentKey = this.dependentKeysByGuid[guid],
            itemPropertyKeys = this.cp._itemPropertyKeys[dependentKey] || [],
            length = get(dependentArray, 'length'),
            normalizedIndex = normalizeIndex(index, length, 0),
            normalizedRemoveCount = normalizeRemoveCount(normalizedIndex, length, removedCount),
            item,
            itemIndex,
            sliceIndex,
            observerContexts;

        observerContexts = this.trackRemove(dependentKey, normalizedIndex, normalizedRemoveCount);

        function removeObservers(propertyKey) {
          observerContexts[sliceIndex].destroyed = true;
          removeBeforeObserver(item, propertyKey, this, observerContexts[sliceIndex].beforeObserver);
          removeObserver(item, propertyKey, this, observerContexts[sliceIndex].observer);
        }

        for (sliceIndex = normalizedRemoveCount - 1; sliceIndex >= 0; --sliceIndex) {
          itemIndex = normalizedIndex + sliceIndex;
          if (itemIndex >= length) { break; }

          item = dependentArray.objectAt(itemIndex);

          forEach(itemPropertyKeys, removeObservers, this);

          changeMeta = createChangeMeta(dependentArray, item, itemIndex, this.instanceMeta.propertyName, this.cp);
          this.setValue( removedItem.call(
            this.instanceMeta.context, this.getValue(), item, changeMeta, this.instanceMeta.sugarMeta));
        }
      },

      dependentArrayDidChange: function (dependentArray, index, removedCount, addedCount) {
        if (this.suspended) { return; }

        var addedItem = this.callbacks.addedItem,
            guid = guidFor(dependentArray),
            dependentKey = this.dependentKeysByGuid[guid],
            observerContexts = new Array(addedCount),
            itemPropertyKeys = this.cp._itemPropertyKeys[dependentKey],
            length = get(dependentArray, 'length'),
            normalizedIndex = normalizeIndex(index, length, addedCount),
            changeMeta,
            observerContext;

        forEach(dependentArray.slice(normalizedIndex, normalizedIndex + addedCount), function (item, sliceIndex) {
          if (itemPropertyKeys) {
            observerContext =
              observerContexts[sliceIndex] =
              this.createPropertyObserverContext(dependentArray, normalizedIndex + sliceIndex, this.trackedArraysByGuid[dependentKey]);
            forEach(itemPropertyKeys, function (propertyKey) {
              addBeforeObserver(item, propertyKey, this, observerContext.beforeObserver);
              addObserver(item, propertyKey, this, observerContext.observer);
            }, this);
          }

          changeMeta = createChangeMeta(dependentArray, item, normalizedIndex + sliceIndex, this.instanceMeta.propertyName, this.cp);
          this.setValue( addedItem.call(
            this.instanceMeta.context, this.getValue(), item, changeMeta, this.instanceMeta.sugarMeta));
        }, this);

        this.trackAdd(dependentKey, normalizedIndex, observerContexts);
      },

      itemPropertyWillChange: function (obj, keyName, array, observerContext) {
        var guid = guidFor(obj);

        if (!this.changedItems[guid]) {
          this.changedItems[guid] = {
            array:            array,
            observerContext:  observerContext,
            obj:              obj,
            previousValues:   {}
          };
        }
        ++this.changedItemCount;

        this.changedItems[guid].previousValues[keyName] = get(obj, keyName);
      },

      itemPropertyDidChange: function(obj, keyName, array, observerContext) {
        if (--this.changedItemCount === 0) {
          this.flushChanges();
        }
      },

      flushChanges: function() {
        var changedItems = this.changedItems, key, c, changeMeta;

        for (key in changedItems) {
          c = changedItems[key];
          if (c.observerContext.destroyed) { continue; }

          this.updateIndexes(c.observerContext.trackedArray, c.observerContext.dependentArray);

          changeMeta = createChangeMeta(c.array, c.obj, c.observerContext.index, this.instanceMeta.propertyName, this.cp, c.previousValues);
          this.setValue(
            this.callbacks.removedItem.call(this.instanceMeta.context, this.getValue(), c.obj, changeMeta, this.instanceMeta.sugarMeta));
          this.setValue(
            this.callbacks.addedItem.call(this.instanceMeta.context, this.getValue(), c.obj, changeMeta, this.instanceMeta.sugarMeta));
        }
        this.changedItems = {};
      }
    };

    function normalizeIndex(index, length, newItemsOffset) {
      if (index < 0) {
        return Math.max(0, length + index);
      } else if (index < length) {
        return index;
      } else /* index > length */ {
        return Math.min(length - newItemsOffset, index);
      }
    }

    function normalizeRemoveCount(index, length, removedCount) {
      return Math.min(removedCount, length - index);
    }

    function createChangeMeta(dependentArray, item, index, propertyName, property, previousValues) {
      var meta = {
        arrayChanged: dependentArray,
        index: index,
        item: item,
        propertyName: propertyName,
        property: property
      };

      if (previousValues) {
        // previous values only available for item property changes
        meta.previousValues = previousValues;
      }

      return meta;
    }

    function addItems (dependentArray, callbacks, cp, propertyName, meta) {
      forEach(dependentArray, function (item, index) {
        meta.setValue( callbacks.addedItem.call(
          this, meta.getValue(), item, createChangeMeta(dependentArray, item, index, propertyName, cp), meta.sugarMeta));
      }, this);
    }

    function reset(cp, propertyName) {
      var callbacks = cp._callbacks(),
          meta;

      if (cp._hasInstanceMeta(this, propertyName)) {
        meta = cp._instanceMeta(this, propertyName);
        meta.setValue(cp.resetValue(meta.getValue()));
      } else {
        meta = cp._instanceMeta(this, propertyName);
      }

      if (cp.options.initialize) {
        cp.options.initialize.call(this, meta.getValue(), { property: cp, propertyName: propertyName }, meta.sugarMeta);
      }
    }

    function partiallyRecomputeFor(obj, dependentKey) {
      if (arrayBracketPattern.test(dependentKey)) {
        return false;
      }

      var value = get(obj, dependentKey);
      return EmberArray.detect(value);
    }

    function ReduceComputedPropertyInstanceMeta(context, propertyName, initialValue) {
      this.context = context;
      this.propertyName = propertyName;
      this.cache = metaFor(context).cache;

      this.dependentArrays = {};
      this.sugarMeta = {};

      this.initialValue = initialValue;
    }

    ReduceComputedPropertyInstanceMeta.prototype = {
      getValue: function () {
        var value = cacheGet(this.cache, this.propertyName);
        if (value !== undefined) {
          return value;
        } else {
          return this.initialValue;
        }
      },

      setValue: function(newValue, triggerObservers) {
        // This lets sugars force a recomputation, handy for very simple
        // implementations of eg max.
        if (newValue === cacheGet(this.cache, this.propertyName)) {
          return;
        }

        if (triggerObservers) {
          propertyWillChange(this.context, this.propertyName);
        }

        if (newValue === undefined) {
          cacheRemove(this.cache, this.propertyName);
        } else {
          cacheSet(this.cache, this.propertyName, newValue);
        }

        if (triggerObservers) {
          propertyDidChange(this.context, this.propertyName);
        }
      }
    };

    /**
      A computed property whose dependent keys are arrays and which is updated with
      "one at a time" semantics.

      @class ReduceComputedProperty
      @namespace Ember
      @extends Ember.ComputedProperty
      @constructor
    */
    function ReduceComputedProperty(options) {
      var cp = this;

      this.options = options;

      this._dependentKeys = null;
      // A map of dependentKey -> [itemProperty, ...] that tracks what properties of
      // items in the array we must track to update this property.
      this._itemPropertyKeys = {};
      this._previousItemPropertyKeys = {};

      this.readOnly();
      this.cacheable();

      this.recomputeOnce = function(propertyName) {
        // What we really want to do is coalesce by <cp, propertyName>.
        // We need a form of `scheduleOnce` that accepts an arbitrary token to
        // coalesce by, in addition to the target and method.
        run.once(this, recompute, propertyName);
      };
      var recompute = function(propertyName) {
        var dependentKeys = cp._dependentKeys,
            meta = cp._instanceMeta(this, propertyName),
            callbacks = cp._callbacks();

        reset.call(this, cp, propertyName);

        meta.dependentArraysObserver.suspendArrayObservers(function () {
          forEach(cp._dependentKeys, function (dependentKey) {
            Ember.assert(
              "dependent array " + dependentKey + " must be an `Ember.Array`.  " +
              "If you are not extending arrays, you will need to wrap native arrays with `Ember.A`",
              !(isArray(get(this, dependentKey)) && !EmberArray.detect(get(this, dependentKey))));

            if (!partiallyRecomputeFor(this, dependentKey)) { return; }

            var dependentArray = get(this, dependentKey),
                previousDependentArray = meta.dependentArrays[dependentKey];

            if (dependentArray === previousDependentArray) {
              // The array may be the same, but our item property keys may have
              // changed, so we set them up again.  We can't easily tell if they've
              // changed: the array may be the same object, but with different
              // contents.
              if (cp._previousItemPropertyKeys[dependentKey]) {
                delete cp._previousItemPropertyKeys[dependentKey];
                meta.dependentArraysObserver.setupPropertyObservers(dependentKey, cp._itemPropertyKeys[dependentKey]);
              }
            } else {
              meta.dependentArrays[dependentKey] = dependentArray;

              if (previousDependentArray) {
                meta.dependentArraysObserver.teardownObservers(previousDependentArray, dependentKey);
              }

              if (dependentArray) {
                meta.dependentArraysObserver.setupObservers(dependentArray, dependentKey);
              }
            }
          }, this);
        }, this);

        forEach(cp._dependentKeys, function(dependentKey) {
          if (!partiallyRecomputeFor(this, dependentKey)) { return; }

          var dependentArray = get(this, dependentKey);
          if (dependentArray) {
            addItems.call(this, dependentArray, callbacks, cp, propertyName, meta);
          }
        }, this);
      };


      this.func = function (propertyName) {
        Ember.assert("Computed reduce values require at least one dependent key", cp._dependentKeys);

        recompute.call(this, propertyName);

        return cp._instanceMeta(this, propertyName).getValue();
      };
    }

    ReduceComputedProperty.prototype = o_create(ComputedProperty.prototype);

    function defaultCallback(computedValue) {
      return computedValue;
    }

    ReduceComputedProperty.prototype._callbacks = function () {
      if (!this.callbacks) {
        var options = this.options;
        this.callbacks = {
          removedItem: options.removedItem || defaultCallback,
          addedItem: options.addedItem || defaultCallback
        };
      }
      return this.callbacks;
    };

    ReduceComputedProperty.prototype._hasInstanceMeta = function (context, propertyName) {
      return !!metaFor(context).cacheMeta[propertyName];
    };

    ReduceComputedProperty.prototype._instanceMeta = function (context, propertyName) {
      var cacheMeta = metaFor(context).cacheMeta,
          meta = cacheMeta[propertyName];

      if (!meta) {
        meta = cacheMeta[propertyName] = new ReduceComputedPropertyInstanceMeta(context, propertyName, this.initialValue());
        meta.dependentArraysObserver = new DependentArraysObserver(this._callbacks(), this, meta, context, propertyName, meta.sugarMeta);
      }

      return meta;
    };

    ReduceComputedProperty.prototype.initialValue = function () {
      if (typeof this.options.initialValue === 'function') {
        return this.options.initialValue();
      }
      else {
        return this.options.initialValue;
      }
    };

    ReduceComputedProperty.prototype.resetValue = function (value) {
      return this.initialValue();
    };

    ReduceComputedProperty.prototype.itemPropertyKey = function (dependentArrayKey, itemPropertyKey) {
      this._itemPropertyKeys[dependentArrayKey] = this._itemPropertyKeys[dependentArrayKey] || [];
      this._itemPropertyKeys[dependentArrayKey].push(itemPropertyKey);
    };

    ReduceComputedProperty.prototype.clearItemPropertyKeys = function (dependentArrayKey) {
      if (this._itemPropertyKeys[dependentArrayKey]) {
        this._previousItemPropertyKeys[dependentArrayKey] = this._itemPropertyKeys[dependentArrayKey];
        this._itemPropertyKeys[dependentArrayKey] = [];
      }
    };

    ReduceComputedProperty.prototype.property = function () {
      var cp = this,
          args = a_slice.call(arguments),
          propertyArgs = new Set(),
          match,
          dependentArrayKey,
          itemPropertyKey;

      forEach(args, function (dependentKey) {
        if (doubleEachPropertyPattern.test(dependentKey)) {
          throw new EmberError("Nested @each properties not supported: " + dependentKey);
        } else if (match = eachPropertyPattern.exec(dependentKey)) {
          dependentArrayKey = match[1];

          var itemPropertyKeyPattern = match[2],
              addItemPropertyKey = function (itemPropertyKey) {
                cp.itemPropertyKey(dependentArrayKey, itemPropertyKey);
              };

          expandProperties(itemPropertyKeyPattern, addItemPropertyKey);
          propertyArgs.add(dependentArrayKey);
        } else {
          propertyArgs.add(dependentKey);
        }
      });

      return ComputedProperty.prototype.property.apply(this, propertyArgs.toArray());

    };

    /**
      Creates a computed property which operates on dependent arrays and
      is updated with "one at a time" semantics. When items are added or
      removed from the dependent array(s) a reduce computed only operates
      on the change instead of re-evaluating the entire array.

      If there are more than one arguments the first arguments are
      considered to be dependent property keys. The last argument is
      required to be an options object. The options object can have the
      following four properties:

      `initialValue` - A value or function that will be used as the initial
      value for the computed. If this property is a function the result of calling
      the function will be used as the initial value. This property is required.

      `initialize` - An optional initialize function. Typically this will be used
      to set up state on the instanceMeta object.

      `removedItem` - A function that is called each time an element is removed
      from the array.

      `addedItem` - A function that is called each time an element is added to
      the array.


      The `initialize` function has the following signature:

      ```javascript
      function(initialValue, changeMeta, instanceMeta)
      ```

      `initialValue` - The value of the `initialValue` property from the
      options object.

      `changeMeta` - An object which contains meta information about the
      computed. It contains the following properties:

         - `property` the computed property
         - `propertyName` the name of the property on the object

      `instanceMeta` - An object that can be used to store meta
      information needed for calculating your computed. For example a
      unique computed might use this to store the number of times a given
      element is found in the dependent array.


      The `removedItem` and `addedItem` functions both have the following signature:

      ```javascript
      function(accumulatedValue, item, changeMeta, instanceMeta)
      ```

      `accumulatedValue` - The value returned from the last time
      `removedItem` or `addedItem` was called or `initialValue`.

      `item` - the element added or removed from the array

      `changeMeta` - An object which contains meta information about the
      change. It contains the following properties:

        - `property` the computed property
        - `propertyName` the name of the property on the object
        - `index` the index of the added or removed item
        - `item` the added or removed item: this is exactly the same as
          the second arg
        - `arrayChanged` the array that triggered the change. Can be
          useful when depending on multiple arrays.

      For property changes triggered on an item property change (when
      depKey is something like `someArray.@each.someProperty`),
      `changeMeta` will also contain the following property:

        - `previousValues` an object whose keys are the properties that changed on
        the item, and whose values are the item's previous values.

      `previousValues` is important Ember coalesces item property changes via
      Ember.run.once. This means that by the time removedItem gets called, item has
      the new values, but you may need the previous value (eg for sorting &
      filtering).

      `instanceMeta` - An object that can be used to store meta
      information needed for calculating your computed. For example a
      unique computed might use this to store the number of times a given
      element is found in the dependent array.

      The `removedItem` and `addedItem` functions should return the accumulated
      value. It is acceptable to not return anything (ie return undefined)
      to invalidate the computation. This is generally not a good idea for
      arrayComputed but it's used in eg max and min.

      Note that observers will be fired if either of these functions return a value
      that differs from the accumulated value.  When returning an object that
      mutates in response to array changes, for example an array that maps
      everything from some other array (see `Ember.computed.map`), it is usually
      important that the *same* array be returned to avoid accidentally triggering observers.

      Example

      ```javascript
      Ember.computed.max = function(dependentKey) {
        return Ember.reduceComputed(dependentKey, {
          initialValue: -Infinity,

          addedItem: function(accumulatedValue, item, changeMeta, instanceMeta) {
            return Math.max(accumulatedValue, item);
          },

          removedItem: function(accumulatedValue, item, changeMeta, instanceMeta) {
            if (item < accumulatedValue) {
              return accumulatedValue;
            }
          }
        });
      };
      ```

      Dependent keys may refer to `@this` to observe changes to the object itself,
      which must be array-like, rather than a property of the object.  This is
      mostly useful for array proxies, to ensure objects are retrieved via
      `objectAtContent`.  This is how you could sort items by properties defined on an item controller.

      Example

      ```javascript
      App.PeopleController = Ember.ArrayController.extend({
        itemController: 'person',

        sortedPeople: Ember.computed.sort('@this.@each.reversedName', function(personA, personB) {
          // `reversedName` isn't defined on Person, but we have access to it via
          // the item controller App.PersonController.  If we'd used
          // `content.@each.reversedName` above, we would be getting the objects
          // directly and not have access to `reversedName`.
          //
          var reversedNameA = get(personA, 'reversedName'),
              reversedNameB = get(personB, 'reversedName');

          return Ember.compare(reversedNameA, reversedNameB);
        })
      });

      App.PersonController = Ember.ObjectController.extend({
        reversedName: function() {
          return reverse(get(this, 'name'));
        }.property('name')
      });
      ```

      Dependent keys whose values are not arrays are treated as regular
      dependencies: when they change, the computed property is completely
      recalculated.  It is sometimes useful to have dependent arrays with similar
      semantics.  Dependent keys which end in `.[]` do not use "one at a time"
      semantics.  When an item is added or removed from such a dependency, the
      computed property is completely recomputed.

      When the computed property is completely recomputed, the `accumulatedValue`
      is discarded, it starts with `initialValue` again, and each item is passed
      to `addedItem` in turn.

      Example

      ```javascript
      Ember.Object.extend({
        // When `string` is changed, `computed` is completely recomputed.
        string: 'a string',

        // When an item is added to `array`, `addedItem` is called.
        array: [],

        // When an item is added to `anotherArray`, `computed` is completely
        // recomputed.
        anotherArray: [],

        computed: Ember.reduceComputed('string', 'array', 'anotherArray.[]', {
          addedItem: addedItemCallback,
          removedItem: removedItemCallback
        })
      });
      ```

      @method reduceComputed
      @for Ember
      @param {String} [dependentKeys*]
      @param {Object} options
      @return {Ember.ComputedProperty}
    */
    function reduceComputed(options) {
      var args;

      if (arguments.length > 1) {
        args = a_slice.call(arguments, 0, -1);
        options = a_slice.call(arguments, -1)[0];
      }

      if (typeof options !== "object") {
        throw new EmberError("Reduce Computed Property declared without an options hash");
      }

      if (!('initialValue' in options)) {
        throw new EmberError("Reduce Computed Property declared without an initial value");
      }

      var cp = new ReduceComputedProperty(options);

      if (args) {
        cp.property.apply(cp, args);
      }

      return cp;
    }

    __exports__.reduceComputed = reduceComputed;
    __exports__.ReduceComputedProperty = ReduceComputedProperty;
  });
define("ember-runtime/computed/reduce_computed_macros",
  ["ember-metal/core","ember-metal/merge","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/error","ember-metal/enumerable_utils","ember-metal/run_loop","ember-metal/observer","ember-runtime/computed/array_computed","ember-runtime/computed/reduce_computed","ember-runtime/system/object_proxy","ember-runtime/system/subarray","ember-runtime/keys","ember-runtime/compare","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.assert
    var merge = __dependency2__["default"];
    var get = __dependency3__.get;
    var set = __dependency4__.set;
    var isArray = __dependency5__.isArray;
    var guidFor = __dependency5__.guidFor;
    var EmberError = __dependency6__["default"];
    var EnumerableUtils = __dependency7__["default"];
    var run = __dependency8__["default"];
    var addObserver = __dependency9__.addObserver;
    var arrayComputed = __dependency10__.arrayComputed;
    var reduceComputed = __dependency11__.reduceComputed;
    var ObjectProxy = __dependency12__["default"];
    var SubArray = __dependency13__["default"];
    var keys = __dependency14__["default"];
    var compare = __dependency15__["default"];

    var a_slice = [].slice,
        forEach = EnumerableUtils.forEach,
        SearchProxy;

    /**
     A computed property that returns the sum of the value
     in the dependent array.

     @method computed.sum
     @for Ember
     @param {String} dependentKey
     @return {Ember.ComputedProperty} computes the sum of all values in the dependentKey's array
     @since 1.4.0
    */

    function sum(dependentKey){
      return reduceComputed(dependentKey, {
        initialValue: 0,

        addedItem: function(accumulatedValue, item, changeMeta, instanceMeta){
          return accumulatedValue + item;
        },

        removedItem: function(accumulatedValue, item, changeMeta, instanceMeta){
          return accumulatedValue - item;
        }
      });
    };

    /**
      A computed property that calculates the maximum value in the
      dependent array. This will return `-Infinity` when the dependent
      array is empty.

      ```javascript
      var Person = Ember.Object.extend({
        childAges: Ember.computed.mapBy('children', 'age'),
        maxChildAge: Ember.computed.max('childAges')
      });

      var lordByron = Person.create({ children: [] });

      lordByron.get('maxChildAge'); // -Infinity
      lordByron.get('children').pushObject({
        name: 'Augusta Ada Byron', age: 7
      });
      lordByron.get('maxChildAge'); // 7
      lordByron.get('children').pushObjects([{
        name: 'Allegra Byron',
        age: 5
      }, {
        name: 'Elizabeth Medora Leigh',
        age: 8
      }]);
      lordByron.get('maxChildAge'); // 8
      ```

      @method computed.max
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computes the largest value in the dependentKey's array
    */
    function max (dependentKey) {
      return reduceComputed(dependentKey, {
        initialValue: -Infinity,

        addedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
          return Math.max(accumulatedValue, item);
        },

        removedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
          if (item < accumulatedValue) {
            return accumulatedValue;
          }
        }
      });
    };

    /**
      A computed property that calculates the minimum value in the
      dependent array. This will return `Infinity` when the dependent
      array is empty.

      ```javascript
      var Person = Ember.Object.extend({
        childAges: Ember.computed.mapBy('children', 'age'),
        minChildAge: Ember.computed.min('childAges')
      });

      var lordByron = Person.create({ children: [] });

      lordByron.get('minChildAge'); // Infinity
      lordByron.get('children').pushObject({
        name: 'Augusta Ada Byron', age: 7
      });
      lordByron.get('minChildAge'); // 7
      lordByron.get('children').pushObjects([{
        name: 'Allegra Byron',
        age: 5
      }, {
        name: 'Elizabeth Medora Leigh',
        age: 8
      }]);
      lordByron.get('minChildAge'); // 5
      ```

      @method computed.min
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computes the smallest value in the dependentKey's array
    */
    function min(dependentKey) {
      return reduceComputed(dependentKey, {
        initialValue: Infinity,

        addedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
          return Math.min(accumulatedValue, item);
        },

        removedItem: function (accumulatedValue, item, changeMeta, instanceMeta) {
          if (item > accumulatedValue) {
            return accumulatedValue;
          }
        }
      });
    };

    /**
      Returns an array mapped via the callback

      The callback method you provide should have the following signature.
      `item` is the current item in the iteration.

      ```javascript
      function(item);
      ```

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        excitingChores: Ember.computed.map('chores', function(chore) {
          return chore.toUpperCase() + '!';
        })
      });

      var hamster = Hamster.create({
        chores: ['clean', 'write more unit tests']
      });

      hamster.get('excitingChores'); // ['CLEAN!', 'WRITE MORE UNIT TESTS!']
      ```

      @method computed.map
      @for Ember
      @param {String} dependentKey
      @param {Function} callback
      @return {Ember.ComputedProperty} an array mapped via the callback
    */
    function map(dependentKey, callback) {
      var options = {
        addedItem: function(array, item, changeMeta, instanceMeta) {
          var mapped = callback.call(this, item);
          array.insertAt(changeMeta.index, mapped);
          return array;
        },
        removedItem: function(array, item, changeMeta, instanceMeta) {
          array.removeAt(changeMeta.index, 1);
          return array;
        }
      };

      return arrayComputed(dependentKey, options);
    };

    /**
      Returns an array mapped to the specified key.

      ```javascript
      var Person = Ember.Object.extend({
        childAges: Ember.computed.mapBy('children', 'age')
      });

      var lordByron = Person.create({ children: [] });

      lordByron.get('childAges'); // []
      lordByron.get('children').pushObject({ name: 'Augusta Ada Byron', age: 7 });
      lordByron.get('childAges'); // [7]
      lordByron.get('children').pushObjects([{
        name: 'Allegra Byron',
        age: 5
      }, {
        name: 'Elizabeth Medora Leigh',
        age: 8
      }]);
      lordByron.get('childAges'); // [7, 5, 8]
      ```

      @method computed.mapBy
      @for Ember
      @param {String} dependentKey
      @param {String} propertyKey
      @return {Ember.ComputedProperty} an array mapped to the specified key
    */
    function mapBy (dependentKey, propertyKey) {
      var callback = function(item) { return get(item, propertyKey); };
      return map(dependentKey + '.@each.' + propertyKey, callback);
    };

    /**
      @method computed.mapProperty
      @for Ember
      @deprecated Use `Ember.computed.mapBy` instead
      @param dependentKey
      @param propertyKey
    */
    var mapProperty = mapBy;

    /**
      Filters the array by the callback.

      The callback method you provide should have the following signature.
      `item` is the current item in the iteration.

      ```javascript
      function(item);
      ```

      ```javascript
      var Hamster = Ember.Object.extend({
        remainingChores: Ember.computed.filter('chores', function(chore) {
          return !chore.done;
        })
      });

      var hamster = Hamster.create({ 
        chores: [
          { name: 'cook', done: true },
          { name: 'clean', done: true },
          { name: 'write more unit tests', done: false }
        ] 
      });

      hamster.get('remainingChores'); // [{name: 'write more unit tests', done: false}]
      ```

      @method computed.filter
      @for Ember
      @param {String} dependentKey
      @param {Function} callback
      @return {Ember.ComputedProperty} the filtered array
    */
    function filter(dependentKey, callback) {
      var options = {
        initialize: function (array, changeMeta, instanceMeta) {
          instanceMeta.filteredArrayIndexes = new SubArray();
        },

        addedItem: function(array, item, changeMeta, instanceMeta) {
          var match = !!callback.call(this, item),
              filterIndex = instanceMeta.filteredArrayIndexes.addItem(changeMeta.index, match);

          if (match) {
            array.insertAt(filterIndex, item);
          }

          return array;
        },

        removedItem: function(array, item, changeMeta, instanceMeta) {
          var filterIndex = instanceMeta.filteredArrayIndexes.removeItem(changeMeta.index);

          if (filterIndex > -1) {
            array.removeAt(filterIndex);
          }

          return array;
        }
      };

      return arrayComputed(dependentKey, options);
    };

    /**
      Filters the array by the property and value

      ```javascript
      var Hamster = Ember.Object.extend({
        remainingChores: Ember.computed.filterBy('chores', 'done', false)
      });

      var hamster = Hamster.create({
        chores: [
          { name: 'cook', done: true },
          { name: 'clean', done: true },
          { name: 'write more unit tests', done: false }
        ]
      });

      hamster.get('remainingChores'); // [{ name: 'write more unit tests', done: false }]
      ```

      @method computed.filterBy
      @for Ember
      @param {String} dependentKey
      @param {String} propertyKey
      @param {*} value
      @return {Ember.ComputedProperty} the filtered array
    */
    function filterBy (dependentKey, propertyKey, value) {
      var callback;

      if (arguments.length === 2) {
        callback = function(item) {
          return get(item, propertyKey);
        };
      } else {
        callback = function(item) {
          return get(item, propertyKey) === value;
        };
      }

      return filter(dependentKey + '.@each.' + propertyKey, callback);
    };

    /**
      @method computed.filterProperty
      @for Ember
      @param dependentKey
      @param propertyKey
      @param value
      @deprecated Use `Ember.computed.filterBy` instead
    */
    var filterProperty = filterBy;

    /**
      A computed property which returns a new array with all the unique
      elements from one or more dependent arrays.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        uniqueFruits: Ember.computed.uniq('fruits')
      });

      var hamster = Hamster.create({
        fruits: [
          'banana',
          'grape',
          'kale',
          'banana'
        ]
      });

      hamster.get('uniqueFruits'); // ['banana', 'grape', 'kale']
      ```

      @method computed.uniq
      @for Ember
      @param {String} propertyKey*
      @return {Ember.ComputedProperty} computes a new array with all the
      unique elements from the dependent array
    */
    function uniq() {
      var args = a_slice.call(arguments);
      args.push({
        initialize: function(array, changeMeta, instanceMeta) {
          instanceMeta.itemCounts = {};
        },

        addedItem: function(array, item, changeMeta, instanceMeta) {
          var guid = guidFor(item);

          if (!instanceMeta.itemCounts[guid]) {
            instanceMeta.itemCounts[guid] = 1;
          } else {
            ++instanceMeta.itemCounts[guid];
          }
          array.addObject(item);
          return array;
        },
        removedItem: function(array, item, _, instanceMeta) {
          var guid = guidFor(item),
              itemCounts = instanceMeta.itemCounts;

          if (--itemCounts[guid] === 0) {
            array.removeObject(item);
          }
          return array;
        }
      });
      return arrayComputed.apply(null, args);
    };

    /**
      Alias for [Ember.computed.uniq](/api/#method_computed_uniq).

      @method computed.union
      @for Ember
      @param {String} propertyKey*
      @return {Ember.ComputedProperty} computes a new array with all the
      unique elements from the dependent array
    */
    var union = uniq;

    /**
      A computed property which returns a new array with all the duplicated
      elements from two or more dependent arrays.

      Example

      ```javascript
      var obj = Ember.Object.createWithMixins({
        adaFriends: ['Charles Babbage', 'John Hobhouse', 'William King', 'Mary Somerville'],
        charlesFriends: ['William King', 'Mary Somerville', 'Ada Lovelace', 'George Peacock'],
        friendsInCommon: Ember.computed.intersect('adaFriends', 'charlesFriends')
      });

      obj.get('friendsInCommon'); // ['William King', 'Mary Somerville']
      ```

      @method computed.intersect
      @for Ember
      @param {String} propertyKey*
      @return {Ember.ComputedProperty} computes a new array with all the
      duplicated elements from the dependent arrays
    */
    function intersect() {
      var getDependentKeyGuids = function (changeMeta) {
        return EnumerableUtils.map(changeMeta.property._dependentKeys, function (dependentKey) {
          return guidFor(dependentKey);
        });
      };

      var args = a_slice.call(arguments);
      args.push({
        initialize: function (array, changeMeta, instanceMeta) {
          instanceMeta.itemCounts = {};
        },

        addedItem: function(array, item, changeMeta, instanceMeta) {
          var itemGuid = guidFor(item),
              dependentGuids = getDependentKeyGuids(changeMeta),
              dependentGuid = guidFor(changeMeta.arrayChanged),
              numberOfDependentArrays = changeMeta.property._dependentKeys.length,
              itemCounts = instanceMeta.itemCounts;

          if (!itemCounts[itemGuid]) { itemCounts[itemGuid] = {}; }
          if (itemCounts[itemGuid][dependentGuid] === undefined) { itemCounts[itemGuid][dependentGuid] = 0; }

          if (++itemCounts[itemGuid][dependentGuid] === 1 &&
              numberOfDependentArrays === keys(itemCounts[itemGuid]).length) {

            array.addObject(item);
          }
          return array;
        },
        removedItem: function(array, item, changeMeta, instanceMeta) {
          var itemGuid = guidFor(item),
              dependentGuids = getDependentKeyGuids(changeMeta),
              dependentGuid = guidFor(changeMeta.arrayChanged),
              numberOfDependentArrays = changeMeta.property._dependentKeys.length,
              numberOfArraysItemAppearsIn,
              itemCounts = instanceMeta.itemCounts;

          if (itemCounts[itemGuid][dependentGuid] === undefined) { itemCounts[itemGuid][dependentGuid] = 0; }
          if (--itemCounts[itemGuid][dependentGuid] === 0) {
            delete itemCounts[itemGuid][dependentGuid];
            numberOfArraysItemAppearsIn = keys(itemCounts[itemGuid]).length;

            if (numberOfArraysItemAppearsIn === 0) {
              delete itemCounts[itemGuid];
            }
            array.removeObject(item);
          }
          return array;
        }
      });
      return arrayComputed.apply(null, args);
    };

    /**
      A computed property which returns a new array with all the
      properties from the first dependent array that are not in the second
      dependent array.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        likes: ['banana', 'grape', 'kale'],
        wants: Ember.computed.setDiff('likes', 'fruits')
      });

      var hamster = Hamster.create({
        fruits: [
          'grape',
          'kale',
        ]
      });

      hamster.get('wants'); // ['banana']
      ```

      @method computed.setDiff
      @for Ember
      @param {String} setAProperty
      @param {String} setBProperty
      @return {Ember.ComputedProperty} computes a new array with all the
      items from the first dependent array that are not in the second
      dependent array
    */
    function setDiff(setAProperty, setBProperty) {
      if (arguments.length !== 2) {
        throw new EmberError("setDiff requires exactly two dependent arrays.");
      }
      return arrayComputed(setAProperty, setBProperty, {
        addedItem: function (array, item, changeMeta, instanceMeta) {
          var setA = get(this, setAProperty),
              setB = get(this, setBProperty);

          if (changeMeta.arrayChanged === setA) {
            if (!setB.contains(item)) {
              array.addObject(item);
            }
          } else {
            array.removeObject(item);
          }
          return array;
        },

        removedItem: function (array, item, changeMeta, instanceMeta) {
          var setA = get(this, setAProperty),
              setB = get(this, setBProperty);

          if (changeMeta.arrayChanged === setB) {
            if (setA.contains(item)) {
              array.addObject(item);
            }
          } else {
            array.removeObject(item);
          }
          return array;
        }
      });
    };

    function binarySearch(array, item, low, high) {
      var mid, midItem, res, guidMid, guidItem;

      if (arguments.length < 4) { high = get(array, 'length'); }
      if (arguments.length < 3) { low = 0; }

      if (low === high) {
        return low;
      }

      mid = low + Math.floor((high - low) / 2);
      midItem = array.objectAt(mid);

      guidMid = _guidFor(midItem);
      guidItem = _guidFor(item);

      if (guidMid === guidItem) {
        return mid;
      }

      res = this.order(midItem, item);
      if (res === 0) {
        res = guidMid < guidItem ? -1 : 1;
      }


      if (res < 0) {
        return this.binarySearch(array, item, mid+1, high);
      } else if (res > 0) {
        return this.binarySearch(array, item, low, mid);
      }

      return mid;

      function _guidFor(item) {
        if (SearchProxy.detectInstance(item)) {
          return guidFor(get(item, 'content'));
        }
        return guidFor(item);
      }
    }


    var SearchProxy = ObjectProxy.extend();

    /**
      A computed property which returns a new array with all the
      properties from the first dependent array sorted based on a property
      or sort function.

      The callback method you provide should have the following signature:

      ```javascript
      function(itemA, itemB);
      ```

      - `itemA` the first item to compare.
      - `itemB` the second item to compare.

      This function should return negative number (e.g. `-1`) when `itemA` should come before
      `itemB`. It should return positive number (e.g. `1`) when `itemA` should come after
      `itemB`. If the `itemA` and `itemB` are equal this function should return `0`.

      Therefore, if this function is comparing some numeric values, simple `itemA - itemB` or
      `itemA.get( 'foo' ) - itemB.get( 'foo' )` can be used instead of series of `if`.

      Example

      ```javascript
      var ToDoList = Ember.Object.extend({
        // using standard ascending sort
        todosSorting: ['name'],
        sortedTodos: Ember.computed.sort('todos', 'todosSorting'),

        // using descending sort
        todosSortingDesc: ['name:desc'],
        sortedTodosDesc: Ember.computed.sort('todos', 'todosSortingDesc'),

        // using a custom sort function
        priorityTodos: Ember.computed.sort('todos', function(a, b){
          if (a.priority > b.priority) {
            return 1;
          } else if (a.priority < b.priority) {
            return -1;
          }

          return 0;
        }),
      });

      var todoList = ToDoList.create({todos: [
        { name: 'Unit Test', priority: 2 },
        { name: 'Documentation', priority: 3 },
        { name: 'Release', priority: 1 }
      ]});

      todoList.get('sortedTodos');      // [{ name:'Documentation', priority:3 }, { name:'Release', priority:1 }, { name:'Unit Test', priority:2 }]
      todoList.get('sortedTodosDesc');  // [{ name:'Unit Test', priority:2 }, { name:'Release', priority:1 }, { name:'Documentation', priority:3 }]
      todoList.get('priorityTodos');    // [{ name:'Release', priority:1 }, { name:'Unit Test', priority:2 }, { name:'Documentation', priority:3 }]
      ```

      @method computed.sort
      @for Ember
      @param {String} dependentKey
      @param {String or Function} sortDefinition a dependent key to an
      array of sort properties (add `:desc` to the arrays sort properties to sort descending) or a function to use when sorting
      @return {Ember.ComputedProperty} computes a new sorted array based
      on the sort property array or callback function
    */
    function sort(itemsKey, sortDefinition) {
      Ember.assert("Ember.computed.sort requires two arguments: an array key to sort and either a sort properties key or sort function", arguments.length === 2);

      var initFn, sortPropertiesKey;

      if (typeof sortDefinition === 'function') {
        initFn = function (array, changeMeta, instanceMeta) {
          instanceMeta.order = sortDefinition;
          instanceMeta.binarySearch = binarySearch;
        };
      } else {
        sortPropertiesKey = sortDefinition;
        initFn = function (array, changeMeta, instanceMeta) {
          function setupSortProperties() {
            var sortPropertyDefinitions = get(this, sortPropertiesKey),
                sortProperty,
                sortProperties = instanceMeta.sortProperties = [],
                sortPropertyAscending = instanceMeta.sortPropertyAscending = {},
                idx,
                asc;

            Ember.assert("Cannot sort: '" + sortPropertiesKey + "' is not an array.", isArray(sortPropertyDefinitions));

            changeMeta.property.clearItemPropertyKeys(itemsKey);

            forEach(sortPropertyDefinitions, function (sortPropertyDefinition) {
              if ((idx = sortPropertyDefinition.indexOf(':')) !== -1) {
                sortProperty = sortPropertyDefinition.substring(0, idx);
                asc = sortPropertyDefinition.substring(idx+1).toLowerCase() !== 'desc';
              } else {
                sortProperty = sortPropertyDefinition;
                asc = true;
              }

              sortProperties.push(sortProperty);
              sortPropertyAscending[sortProperty] = asc;
              changeMeta.property.itemPropertyKey(itemsKey, sortProperty);
            });

            sortPropertyDefinitions.addObserver('@each', this, updateSortPropertiesOnce);
          }

          function updateSortPropertiesOnce() {
            run.once(this, updateSortProperties, changeMeta.propertyName);
          }

          function updateSortProperties(propertyName) {
            setupSortProperties.call(this);
            changeMeta.property.recomputeOnce.call(this, propertyName);
          }

          addObserver(this, sortPropertiesKey, updateSortPropertiesOnce);

          setupSortProperties.call(this);


          instanceMeta.order = function (itemA, itemB) {
            var isProxy = itemB instanceof SearchProxy,
                sortProperty, result, asc;

            for (var i = 0; i < this.sortProperties.length; ++i) {
              sortProperty = this.sortProperties[i];
              result = compare(get(itemA, sortProperty), isProxy ? itemB[sortProperty] : get(itemB, sortProperty));

              if (result !== 0) {
                asc = this.sortPropertyAscending[sortProperty];
                return asc ? result : (-1 * result);
              }
            }

            return 0;
          };

          instanceMeta.binarySearch = binarySearch;
        };
      }

      return arrayComputed(itemsKey, {
        initialize: initFn,

        addedItem: function (array, item, changeMeta, instanceMeta) {
          var index = instanceMeta.binarySearch(array, item);
          array.insertAt(index, item);
          return array;
        },

        removedItem: function (array, item, changeMeta, instanceMeta) {
          var proxyProperties, index, searchItem;

          if (changeMeta.previousValues) {
            proxyProperties = merge({ content: item }, changeMeta.previousValues);

            searchItem = SearchProxy.create(proxyProperties);
          } else {
            searchItem = item;
          }

          index = instanceMeta.binarySearch(array, searchItem);
          array.removeAt(index);
          return array;
        }
      });
    };


    __exports__.sum = sum;
    __exports__.min = min;
    __exports__.max = max;
    __exports__.map = map;
    __exports__.sort = sort;
    __exports__.setDiff = setDiff;
    __exports__.mapBy = mapBy;
    __exports__.mapProperty = mapProperty;
    __exports__.filter = filter;
    __exports__.filterBy = filterBy;
    __exports__.filterProperty = filterProperty;
    __exports__.uniq = uniq;
    __exports__.union = union;
    __exports__.intersect = intersect;
  });
define("ember-runtime/controllers/array_controller",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/enumerable_utils","ember-runtime/system/array_proxy","ember-runtime/mixins/sortable","ember-runtime/controllers/controller","ember-metal/computed","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var EnumerableUtils = __dependency4__["default"];
    var ArrayProxy = __dependency5__["default"];
    var SortableMixin = __dependency6__["default"];
    var ControllerMixin = __dependency7__.ControllerMixin;
    var computed = __dependency8__.computed;
    var EmberError = __dependency9__["default"];

    var forEach = EnumerableUtils.forEach,
        replace = EnumerableUtils.replace;

    /**
      `Ember.ArrayController` provides a way for you to publish a collection of
      objects so that you can easily bind to the collection from a Handlebars
      `#each` helper, an `Ember.CollectionView`, or other controllers.

      The advantage of using an `ArrayController` is that you only have to set up
      your view bindings once; to change what's displayed, simply swap out the
      `content` property on the controller.

      For example, imagine you wanted to display a list of items fetched via an XHR
      request. Create an `Ember.ArrayController` and set its `content` property:

      ```javascript
      MyApp.listController = Ember.ArrayController.create();

      $.get('people.json', function(data) {
        MyApp.listController.set('content', data);
      });
      ```

      Then, create a view that binds to your new controller:

      ```handlebars
      {{#each MyApp.listController}}
        {{firstName}} {{lastName}}
      {{/each}}
      ```

      Although you are binding to the controller, the behavior of this controller
      is to pass through any methods or properties to the underlying array. This
      capability comes from `Ember.ArrayProxy`, which this class inherits from.

      Sometimes you want to display computed properties within the body of an
      `#each` helper that depend on the underlying items in `content`, but are not
      present on those items.   To do this, set `itemController` to the name of a
      controller (probably an `ObjectController`) that will wrap each individual item.

      For example:

      ```handlebars
        {{#each post in controller}}
          <li>{{post.title}} ({{post.titleLength}} characters)</li>
        {{/each}}
      ```

      ```javascript
      App.PostsController = Ember.ArrayController.extend({
        itemController: 'post'
      });

      App.PostController = Ember.ObjectController.extend({
        // the `title` property will be proxied to the underlying post.

        titleLength: function() {
          return this.get('title').length;
        }.property('title')
      });
      ```

      In some cases it is helpful to return a different `itemController` depending
      on the particular item.  Subclasses can do this by overriding
      `lookupItemController`.

      For example:

      ```javascript
      App.MyArrayController = Ember.ArrayController.extend({
        lookupItemController: function( object ) {
          if (object.get('isSpecial')) {
            return "special"; // use App.SpecialController
          } else {
            return "regular"; // use App.RegularController
          }
        }
      });
      ```

      The itemController instances will have a `parentController` property set to
      the `ArrayController` instance.

      @class ArrayController
      @namespace Ember
      @extends Ember.ArrayProxy
      @uses Ember.SortableMixin
      @uses Ember.ControllerMixin
    */

    var ArrayController = ArrayProxy.extend(ControllerMixin, SortableMixin, {

      /**
        The controller used to wrap items, if any.

        @property itemController
        @type String
        @default null
      */
      itemController: null,

      /**
        Return the name of the controller to wrap items, or `null` if items should
        be returned directly.  The default implementation simply returns the
        `itemController` property, but subclasses can override this method to return
        different controllers for different objects.

        For example:

        ```javascript
        App.MyArrayController = Ember.ArrayController.extend({
          lookupItemController: function( object ) {
            if (object.get('isSpecial')) {
              return "special"; // use App.SpecialController
            } else {
              return "regular"; // use App.RegularController
            }
          }
        });
        ```

        @method lookupItemController
        @param {Object} object
        @return {String}
      */
      lookupItemController: function(object) {
        return get(this, 'itemController');
      },

      objectAtContent: function(idx) {
        var length = get(this, 'length'),
            arrangedContent = get(this,'arrangedContent'),
            object = arrangedContent && arrangedContent.objectAt(idx);

        if (idx >= 0 && idx < length) {
          var controllerClass = this.lookupItemController(object);
          if (controllerClass) {
            return this.controllerAt(idx, object, controllerClass);
          }
        }

        // When `controllerClass` is falsy, we have not opted in to using item
        // controllers, so return the object directly.

        // When the index is out of range, we want to return the "out of range"
        // value, whatever that might be.  Rather than make assumptions
        // (e.g. guessing `null` or `undefined`) we defer this to `arrangedContent`.
        return object;
      },

      arrangedContentDidChange: function() {
        this._super();
        this._resetSubControllers();
      },

      arrayContentDidChange: function(idx, removedCnt, addedCnt) {
        var subControllers = get(this, '_subControllers'),
            subControllersToRemove = subControllers.slice(idx, idx+removedCnt);

        forEach(subControllersToRemove, function(subController) {
          if (subController) { subController.destroy(); }
        });

        replace(subControllers, idx, removedCnt, new Array(addedCnt));

        // The shadow array of subcontrollers must be updated before we trigger
        // observers, otherwise observers will get the wrong subcontainer when
        // calling `objectAt`
        this._super(idx, removedCnt, addedCnt);
      },

      init: function() {
        this._super();

        this.set('_subControllers', [ ]);
      },

      content: computed(function () {
        return Ember.A();
      }),

      /**
       * Flag to mark as being "virtual". Used to keep this instance
       * from participating in the parentController hierarchy.
       *
       * @private
       * @property _isVirtual
       * @type Boolean
       */
      _isVirtual: false,

      controllerAt: function(idx, object, controllerClass) {
        var container = get(this, 'container'),
            subControllers = get(this, '_subControllers'),
            subController = subControllers[idx],
            fullName;

        if (subController) { return subController; }

        fullName = "controller:" + controllerClass;

        if (!container.has(fullName)) {
          throw new EmberError('Could not resolve itemController: "' + controllerClass + '"');
        }
        var parentController;
        if (this._isVirtual) {
          parentController = get(this, 'parentController');
        }
        parentController = parentController || this;
        subController = container.lookupFactory(fullName).create({
          target: this,
          parentController: parentController,
          content: object
        });

        subControllers[idx] = subController;

        return subController;
      },

      _subControllers: null,

      _resetSubControllers: function() {
        var subControllers = get(this, '_subControllers');
        var controller;

        if (subControllers.length) {
          for (var i = 0, length = subControllers.length; length > i; i++) {
            controller = subControllers[i];
            if (controller) {
              controller.destroy();
            }
          }

          subControllers.length = 0;
        }
      },

      willDestroy: function() {
        this._resetSubControllers();
        this._super();
      }
    });

    __exports__["default"] = ArrayController;
  });
define("ember-runtime/controllers/controller",
  ["ember-metal/core","ember-metal/property_get","ember-runtime/system/object","ember-metal/mixin","ember-metal/computed","ember-runtime/mixins/action_handler","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.assert, Ember.deprecate
    var get = __dependency2__.get;
    var EmberObject = __dependency3__["default"];
    var Mixin = __dependency4__.Mixin;
    var computed = __dependency5__.computed;
    var ActionHandler = __dependency6__["default"];

    /**
    @module ember
    @submodule ember-runtime
    */

    /**
      `Ember.ControllerMixin` provides a standard interface for all classes that
      compose Ember's controller layer: `Ember.Controller`,
      `Ember.ArrayController`, and `Ember.ObjectController`.

      @class ControllerMixin
      @namespace Ember
      @uses Ember.ActionHandler
    */
    var ControllerMixin = Mixin.create(ActionHandler, {
      /* ducktype as a controller */
      isController: true,

      /**
        The object to which actions from the view should be sent.

        For example, when a Handlebars template uses the `{{action}}` helper,
        it will attempt to send the action to the view's controller's `target`.

        By default, the value of the target property is set to the router, and
        is injected when a controller is instantiated. This injection is defined
        in Ember.Application#buildContainer, and is applied as part of the
        applications initialization process. It can also be set after a controller
        has been instantiated, for instance when using the render helper in a
        template, or when a controller is used as an `itemController`. In most
        cases the `target` property will automatically be set to the logical
        consumer of actions for the controller.

        @property target
        @default null
      */
      target: null,

      container: null,

      parentController: null,

      store: null,

      model: computed.alias('content'),

      deprecatedSendHandles: function(actionName) {
        return !!this[actionName];
      },

      deprecatedSend: function(actionName) {
        var args = [].slice.call(arguments, 1);
        Ember.assert('' + this + " has the action " + actionName + " but it is not a function", typeof this[actionName] === 'function');
        Ember.deprecate('Action handlers implemented directly on controllers are deprecated in favor of action handlers on an `actions` object ( action: `' + actionName + '` on ' + this + ')', false);
        this[actionName].apply(this, args);
        return;
      }
    });

    /**
      @class Controller
      @namespace Ember
      @extends Ember.Object
      @uses Ember.ControllerMixin
    */
    var Controller = EmberObject.extend(ControllerMixin);

    __exports__.Controller = Controller;
    __exports__.ControllerMixin = ControllerMixin;
  });
define("ember-runtime/controllers/object_controller",
  ["ember-runtime/controllers/controller","ember-runtime/system/object_proxy","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var ControllerMixin = __dependency1__.ControllerMixin;
    var ObjectProxy = __dependency2__["default"];

    /**
    @module ember
    @submodule ember-runtime
    */

    /**
      `Ember.ObjectController` is part of Ember's Controller layer. It is intended
      to wrap a single object, proxying unhandled attempts to `get` and `set` to the underlying
      content object, and to forward unhandled action attempts to its `target`.

      `Ember.ObjectController` derives this functionality from its superclass
      `Ember.ObjectProxy` and the `Ember.ControllerMixin` mixin.

      @class ObjectController
      @namespace Ember
      @extends Ember.ObjectProxy
      @uses Ember.ControllerMixin
    **/
    var ObjectController = ObjectProxy.extend(ControllerMixin);
    __exports__["default"] = ObjectController;
  });
define("ember-runtime/copy",
  ["ember-metal/enumerable_utils","ember-metal/utils","ember-runtime/system/object","ember-runtime/mixins/copyable","ember-metal/platform","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var EnumerableUtils = __dependency1__["default"];
    var typeOf = __dependency2__.typeOf;
    var EmberObject = __dependency3__["default"];
    var Copyable = __dependency4__["default"];
    var create = __dependency5__.create;

    var indexOf = EnumerableUtils.indexOf;

    function _copy(obj, deep, seen, copies) {
      var ret, loc, key;

      // primitive data types are immutable, just return them.
      if ('object' !== typeof obj || obj===null) return obj;

      // avoid cyclical loops
      if (deep && (loc=indexOf(seen, obj))>=0) return copies[loc];

      Ember.assert('Cannot clone an Ember.Object that does not implement Ember.Copyable', !(obj instanceof EmberObject) || (Copyable && Copyable.detect(obj)));

      // IMPORTANT: this specific test will detect a native array only. Any other
      // object will need to implement Copyable.
      if (typeOf(obj) === 'array') {
        ret = obj.slice();
        if (deep) {
          loc = ret.length;
          while(--loc>=0) ret[loc] = _copy(ret[loc], deep, seen, copies);
        }
      } else if (Copyable && Copyable.detect(obj)) {
        ret = obj.copy(deep, seen, copies);
      } else if (obj instanceof Date) {
        ret = new Date(obj.getTime());
      } else {
        ret = {};
        for(key in obj) {
          if (!obj.hasOwnProperty(key)) continue;

          // Prevents browsers that don't respect non-enumerability from
          // copying internal Ember properties
          if (key.substring(0,2) === '__') continue;

          ret[key] = deep ? _copy(obj[key], deep, seen, copies) : obj[key];
        }
      }

      if (deep) {
        seen.push(obj);
        copies.push(ret);
      }

      return ret;
    }

    /**
      Creates a clone of the passed object. This function can take just about
      any type of object and create a clone of it, including primitive values
      (which are not actually cloned because they are immutable).

      If the passed object implements the `clone()` method, then this function
      will simply call that method and return the result.

      @method copy
      @for Ember
      @param {Object} obj The object to clone
      @param {Boolean} deep If true, a deep copy of the object is made
      @return {Object} The cloned object
    */
    function copy(obj, deep) {
      // fast paths
      if ('object' !== typeof obj || obj===null) return obj; // can't copy primitives
      if (Copyable && Copyable.detect(obj)) return obj.copy(deep);
      return _copy(obj, deep, deep ? [] : null, deep ? [] : null);
    };

    __exports__["default"] = copy;
  });
define("ember-runtime/core",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    /**
      Compares two objects, returning true if they are logically equal. This is
      a deeper comparison than a simple triple equal. For sets it will compare the
      internal objects. For any other object that implements `isEqual()` it will
      respect that method.

      ```javascript
      Ember.isEqual('hello', 'hello');  // true
      Ember.isEqual(1, 2);              // false
      Ember.isEqual([4, 2], [4, 2]);    // false
      ```

      @method isEqual
      @for Ember
      @param {Object} a first object to compare
      @param {Object} b second object to compare
      @return {Boolean}
    */
    function isEqual(a, b) {
      if (a && 'function'===typeof a.isEqual) return a.isEqual(b);
      if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
      } 
      return a === b;
    };

    __exports__.isEqual = isEqual;
  });
define("ember-runtime/ext/function",
  ["ember-metal/core","ember-metal/expand_properties","ember-metal/computed"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.EXTEND_PROTOTYPES, Ember.assert
    var expandProperties = __dependency2__["default"];
    var computed = __dependency3__.computed;

    var a_slice = Array.prototype.slice;
    var FunctionPrototype = Function.prototype;

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.Function) {

      /**
        The `property` extension of Javascript's Function prototype is available
        when `Ember.EXTEND_PROTOTYPES` or `Ember.EXTEND_PROTOTYPES.Function` is
        `true`, which is the default.

        Computed properties allow you to treat a function like a property:

        ```javascript
        MyApp.President = Ember.Object.extend({
          firstName: '',
          lastName:  '',

          fullName: function() {
            return this.get('firstName') + ' ' + this.get('lastName');

            // Call this flag to mark the function as a property
          }.property()
        });

        var president = MyApp.President.create({
          firstName: "Barack",
          lastName: "Obama"
        });

        president.get('fullName');    // "Barack Obama"
        ```

        Treating a function like a property is useful because they can work with
        bindings, just like any other property.

        Many computed properties have dependencies on other properties. For
        example, in the above example, the `fullName` property depends on
        `firstName` and `lastName` to determine its value. You can tell Ember
        about these dependencies like this:

        ```javascript
        MyApp.President = Ember.Object.extend({
          firstName: '',
          lastName:  '',

          fullName: function() {
            return this.get('firstName') + ' ' + this.get('lastName');

            // Tell Ember.js that this computed property depends on firstName
            // and lastName
          }.property('firstName', 'lastName')
        });
        ```

        Make sure you list these dependencies so Ember knows when to update
        bindings that connect to a computed property. Changing a dependency
        will not immediately trigger an update of the computed property, but
        will instead clear the cache so that it is updated when the next `get`
        is called on the property.

        See [Ember.ComputedProperty](/api/classes/Ember.ComputedProperty.html), [Ember.computed](/api/#method_computed).

        @method property
        @for Function
      */
      FunctionPrototype.property = function() {
        var ret = computed(this);
        // ComputedProperty.prototype.property expands properties; no need for us to
        // do so here.
        return ret.property.apply(ret, arguments);
      };

      /**
        The `observes` extension of Javascript's Function prototype is available
        when `Ember.EXTEND_PROTOTYPES` or `Ember.EXTEND_PROTOTYPES.Function` is
        true, which is the default.

        You can observe property changes simply by adding the `observes`
        call to the end of your method declarations in classes that you write.
        For example:

        ```javascript
        Ember.Object.extend({
          valueObserver: function() {
            // Executes whenever the "value" property changes
          }.observes('value')
        });
        ```

        In the future this method may become asynchronous. If you want to ensure
        synchronous behavior, use `observesImmediately`.

        See `Ember.observer`.

        @method observes
        @for Function
      */
      FunctionPrototype.observes = function() {
        var addWatchedProperty = function (obs) { watched.push(obs); };
        var watched = [];

        for (var i=0; i<arguments.length; ++i) {
          expandProperties(arguments[i], addWatchedProperty);
        }

        this.__ember_observes__ = watched;

        return this;
      };

      /**
        The `observesImmediately` extension of Javascript's Function prototype is
        available when `Ember.EXTEND_PROTOTYPES` or
        `Ember.EXTEND_PROTOTYPES.Function` is true, which is the default.

        You can observe property changes simply by adding the `observesImmediately`
        call to the end of your method declarations in classes that you write.
        For example:

        ```javascript
        Ember.Object.extend({
          valueObserver: function() {
            // Executes immediately after the "value" property changes
          }.observesImmediately('value')
        });
        ```

        In the future, `observes` may become asynchronous. In this event,
        `observesImmediately` will maintain the synchronous behavior.

        See `Ember.immediateObserver`.

        @method observesImmediately
        @for Function
      */
      FunctionPrototype.observesImmediately = function() {
        for (var i=0, l=arguments.length; i<l; i++) {
          var arg = arguments[i];
          Ember.assert("Immediate observers must observe internal properties only, not properties on other objects.", arg.indexOf('.') === -1);
        }

        // observes handles property expansion
        return this.observes.apply(this, arguments);
      };

      /**
        The `observesBefore` extension of Javascript's Function prototype is
        available when `Ember.EXTEND_PROTOTYPES` or
        `Ember.EXTEND_PROTOTYPES.Function` is true, which is the default.

        You can get notified when a property change is about to happen by
        by adding the `observesBefore` call to the end of your method
        declarations in classes that you write. For example:

        ```javascript
        Ember.Object.extend({
          valueObserver: function() {
            // Executes whenever the "value" property is about to change
          }.observesBefore('value')
        });
        ```

        See `Ember.beforeObserver`.

        @method observesBefore
        @for Function
      */
      FunctionPrototype.observesBefore = function() {
        var addWatchedProperty = function (obs) { watched.push(obs); };
        var watched = [];

        for (var i=0; i<arguments.length; ++i) {
          expandProperties(arguments[i], addWatchedProperty);
        }

        this.__ember_observesBefore__ = watched;

        return this;
      };

      /**
        The `on` extension of Javascript's Function prototype is available
        when `Ember.EXTEND_PROTOTYPES` or `Ember.EXTEND_PROTOTYPES.Function` is
        true, which is the default.

        You can listen for events simply by adding the `on` call to the end of
        your method declarations in classes or mixins that you write. For example:

        ```javascript
        Ember.Mixin.create({
          doSomethingWithElement: function() {
            // Executes whenever the "didInsertElement" event fires
          }.on('didInsertElement')
        });
        ```

        See `Ember.on`.

        @method on
        @for Function
      */
      FunctionPrototype.on = function() {
        var events = a_slice.call(arguments);
        this.__ember_listens__ = events;
        return this;
      };
    }
  });
define("ember-runtime/ext/rsvp",
  ["ember-metal/core","ember-metal/logger","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var Logger = __dependency2__["default"];

    var RSVP = requireModule("rsvp");
    var Test, testModuleName = 'ember-testing/test';

    RSVP.onerrorDefault = function(error) {
      if (error instanceof Error) {
        if (Ember.testing) {
          // ES6TODO: remove when possible
          if (!Test && Ember.__loader.registry[testModuleName]) {
            Test = requireModule(testModuleName)['default'];
          }

          if (Test && Test.adapter) {
            Test.adapter.exception(error);
          } else {
            throw error;
          }
        } else if (Ember.onerror) {
          Ember.onerror(error);
        } else {
          Logger.error(error.stack);
          Ember.assert(error, false);
        }
      }
    };

    RSVP.on('error', RSVP.onerrorDefault);

    __exports__["default"] = RSVP;
  });
define("ember-runtime/ext/string",
  ["ember-metal/core","ember-runtime/system/string"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.EXTEND_PROTOTYPES, Ember.assert, Ember.FEATURES
    var fmt = __dependency2__.fmt;
    var w = __dependency2__.w;
    var loc = __dependency2__.loc;
    var camelize = __dependency2__.camelize;
    var decamelize = __dependency2__.decamelize;
    var dasherize = __dependency2__.dasherize;
    var underscore = __dependency2__.underscore;
    var capitalize = __dependency2__.capitalize;
    var classify = __dependency2__.classify;
    var StringPrototype = String.prototype;

    if (Ember.EXTEND_PROTOTYPES === true || Ember.EXTEND_PROTOTYPES.String) {

      /**
        See [Ember.String.fmt](/api/classes/Ember.String.html#method_fmt).

        @method fmt
        @for String
      */
      StringPrototype.fmt = function() {
        return fmt(this, arguments);
      };

      /**
        See [Ember.String.w](/api/classes/Ember.String.html#method_w).

        @method w
        @for String
      */
      StringPrototype.w = function() {
        return w(this);
      };

      /**
        See [Ember.String.loc](/api/classes/Ember.String.html#method_loc).

        @method loc
        @for String
      */
      StringPrototype.loc = function() {
        return loc(this, arguments);
      };

      /**
        See [Ember.String.camelize](/api/classes/Ember.String.html#method_camelize).

        @method camelize
        @for String
      */
      StringPrototype.camelize = function() {
        return camelize(this);
      };

      /**
        See [Ember.String.decamelize](/api/classes/Ember.String.html#method_decamelize).

        @method decamelize
        @for String
      */
      StringPrototype.decamelize = function() {
        return decamelize(this);
      };

      /**
        See [Ember.String.dasherize](/api/classes/Ember.String.html#method_dasherize).

        @method dasherize
        @for String
      */
      StringPrototype.dasherize = function() {
        return dasherize(this);
      };

      /**
        See [Ember.String.underscore](/api/classes/Ember.String.html#method_underscore).

        @method underscore
        @for String
      */
      StringPrototype.underscore = function() {
        return underscore(this);
      };

      /**
        See [Ember.String.classify](/api/classes/Ember.String.html#method_classify).

        @method classify
        @for String
      */
      StringPrototype.classify = function() {
        return classify(this);
      };

      /**
        See [Ember.String.capitalize](/api/classes/Ember.String.html#method_capitalize).

        @method capitalize
        @for String
      */
      StringPrototype.capitalize = function() {
        return capitalize(this);
      };
    }
  });
define("ember-runtime/keys",
  ["ember-metal/enumerable_utils","ember-metal/platform","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var EnumerableUtils = __dependency1__["default"];
    var create = __dependency2__.create;

    /**
      Returns all of the keys defined on an object or hash. This is useful
      when inspecting objects for debugging. On browsers that support it, this
      uses the native `Object.keys` implementation.

      @method keys
      @for Ember
      @param {Object} obj
      @return {Array} Array containing keys of obj
    */
    var keys = Object.keys;
    if (!keys || create.isSimulated) {
      var prototypeProperties = [
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'valueOf',
        'toLocaleString',
        'toString'
      ],
      pushPropertyName = function(obj, array, key) {
        // Prevents browsers that don't respect non-enumerability from
        // copying internal Ember properties
        if (key.substring(0,2) === '__') return;
        if (key === '_super') return;
        if (EnumerableUtils.indexOf(array, key) >= 0) return;
        if (typeof obj.hasOwnProperty === 'function' && !obj.hasOwnProperty(key)) return;

        array.push(key);
      };

      keys = function keys(obj) {
        var ret = [], key;
        for (key in obj) {
          pushPropertyName(obj, ret, key);
        }

        // IE8 doesn't enumerate property that named the same as prototype properties.
        for (var i = 0, l = prototypeProperties.length; i < l; i++) {
          key = prototypeProperties[i];

          pushPropertyName(obj, ret, key);
        }

        return ret;
      };
    }

    __exports__["default"] = keys;
  });
define("ember-runtime",
  ["ember-metal","ember-runtime/core","ember-runtime/keys","ember-runtime/compare","ember-runtime/copy","ember-runtime/system/namespace","ember-runtime/system/object","ember-runtime/system/tracked_array","ember-runtime/system/subarray","ember-runtime/system/container","ember-runtime/system/application","ember-runtime/system/array_proxy","ember-runtime/system/object_proxy","ember-runtime/system/core_object","ember-runtime/system/each_proxy","ember-runtime/system/native_array","ember-runtime/system/set","ember-runtime/system/string","ember-runtime/system/deferred","ember-runtime/system/lazy_load","ember-runtime/mixins/array","ember-runtime/mixins/comparable","ember-runtime/mixins/copyable","ember-runtime/mixins/enumerable","ember-runtime/mixins/freezable","ember-runtime/mixins/observable","ember-runtime/mixins/action_handler","ember-runtime/mixins/deferred","ember-runtime/mixins/mutable_enumerable","ember-runtime/mixins/mutable_array","ember-runtime/mixins/target_action_support","ember-runtime/mixins/evented","ember-runtime/mixins/promise_proxy","ember-runtime/mixins/sortable","ember-runtime/computed/array_computed","ember-runtime/computed/reduce_computed","ember-runtime/computed/reduce_computed_macros","ember-runtime/controllers/array_controller","ember-runtime/controllers/object_controller","ember-runtime/controllers/controller","ember-runtime/ext/rsvp","ember-runtime/ext/string","ember-runtime/ext/function","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __dependency26__, __dependency27__, __dependency28__, __dependency29__, __dependency30__, __dependency31__, __dependency32__, __dependency33__, __dependency34__, __dependency35__, __dependency36__, __dependency37__, __dependency38__, __dependency39__, __dependency40__, __dependency41__, __dependency42__, __dependency43__, __exports__) {
    "use strict";
    /**
    Ember Runtime

    @module ember
    @submodule ember-runtime
    @requires ember-metal
    */

    // BEGIN IMPORTS
    var Ember = __dependency1__["default"];
    var isEqual = __dependency2__.isEqual;
    var keys = __dependency3__["default"];
    var compare = __dependency4__["default"];
    var copy = __dependency5__["default"];

    var Namespace = __dependency6__["default"];
    var EmberObject = __dependency7__["default"];
    var TrackedArray = __dependency8__["default"];
    var SubArray = __dependency9__["default"];
    var Container = __dependency10__["default"];
    var Application = __dependency11__["default"];
    var ArrayProxy = __dependency12__["default"];
    var ObjectProxy = __dependency13__["default"];
    var CoreObject = __dependency14__["default"];
    var EachArray = __dependency15__.EachArray;
    var EachProxy = __dependency15__.EachProxy;
    var NativeArray = __dependency16__["default"];
    var Set = __dependency17__["default"];
    var EmberStringUtils = __dependency18__["default"];
    var Deferred = __dependency19__["default"];
    var onLoad = __dependency20__.onLoad;
    var runLoadHooks = __dependency20__.runLoadHooks;

    var EmberArray = __dependency21__["default"];
    var Comparable = __dependency22__["default"];
    var Copyable = __dependency23__["default"];
    var Enumerable = __dependency24__["default"];
    var Freezable = __dependency25__.Freezable;
    var FROZEN_ERROR = __dependency25__.FROZEN_ERROR;
    var Observable = __dependency26__["default"];
    var ActionHandler = __dependency27__["default"];
    var DeferredMixin = __dependency28__["default"];
    var MutableEnumerable = __dependency29__["default"];
    var MutableArray = __dependency30__["default"];
    var TargetActionSupport = __dependency31__["default"];
    var Evented = __dependency32__["default"];
    var PromiseProxyMixin = __dependency33__["default"];
    var SortableMixin = __dependency34__["default"];

    var arrayComputed = __dependency35__.arrayComputed;
    var ArrayComputedProperty = __dependency35__.ArrayComputedProperty;
    var reduceComputed = __dependency36__.reduceComputed;
    var ReduceComputedProperty = __dependency36__.ReduceComputedProperty;
    var sum = __dependency37__.sum;
    var min = __dependency37__.min;
    var max = __dependency37__.max;
    var map = __dependency37__.map;
    var sort = __dependency37__.sort;
    var setDiff = __dependency37__.setDiff;
    var mapBy = __dependency37__.mapBy;
    var mapProperty = __dependency37__.mapProperty;
    var filter = __dependency37__.filter;
    var filterBy = __dependency37__.filterBy;
    var filterProperty = __dependency37__.filterProperty;
    var uniq = __dependency37__.uniq;
    var union = __dependency37__.union;
    var intersect = __dependency37__.intersect;

    var ArrayController = __dependency38__["default"];
    var ObjectController = __dependency39__["default"];
    var Controller = __dependency40__.Controller;
    var ControllerMixin = __dependency40__.ControllerMixin;

    var RSVP = __dependency41__["default"];
        // just for side effect of extending Ember.RSVP
      // just for side effect of extending String.prototype
    // just for side effect of extending Function.prototype
    // END IMPORTS


    // BEGIN EXPORTS
    Ember.compare = compare;
    Ember.copy = copy;
    Ember.isEqual = isEqual;
    Ember.keys = keys;

    Ember.Array = EmberArray;

    Ember.Comparable = Comparable;
    Ember.Copyable = Copyable;

    Ember.SortableMixin = SortableMixin;

    Ember.Freezable = Freezable;
    Ember.FROZEN_ERROR = FROZEN_ERROR;

    Ember.DeferredMixin = DeferredMixin;

    Ember.MutableEnumerable = MutableEnumerable;
    Ember.MutableArray = MutableArray;

    Ember.TargetActionSupport = TargetActionSupport;
    Ember.Evented = Evented;

    Ember.PromiseProxyMixin = PromiseProxyMixin;

    Ember.Observable = Observable;

    Ember.arrayComputed = arrayComputed;
    Ember.ArrayComputedProperty = ArrayComputedProperty;
    Ember.reduceComputed = reduceComputed;
    Ember.ReduceComputedProperty = ReduceComputedProperty;

    // ES6TODO: this seems a less than ideal way/place to add properties to Ember.computed
    var EmComputed = Ember.computed;

    EmComputed.sum = sum;
    EmComputed.min = min;
    EmComputed.max = max;
    EmComputed.map = map;
    EmComputed.sort = sort;
    EmComputed.setDiff = setDiff;
    EmComputed.mapBy = mapBy;
    EmComputed.mapProperty = mapProperty;
    EmComputed.filter = filter;
    EmComputed.filterBy = filterBy;
    EmComputed.filterProperty = filterProperty;
    EmComputed.uniq = uniq;
    EmComputed.union = union;
    EmComputed.intersect = intersect;

    Ember.String = EmberStringUtils;
    Ember.Object = EmberObject;
    Ember.TrackedArray = TrackedArray;
    Ember.SubArray = SubArray;
    Ember.Container = Container;
    Ember.Namespace = Namespace;
    Ember.Application = Application;
    Ember.Enumerable = Enumerable;
    Ember.ArrayProxy = ArrayProxy;
    Ember.ObjectProxy = ObjectProxy;
    Ember.ActionHandler = ActionHandler;
    Ember.CoreObject = CoreObject;
    Ember.EachArray = EachArray;
    Ember.EachProxy = EachProxy;
    Ember.NativeArray = NativeArray;
    // ES6TODO: Currently we must rely on the global from ember-metal/core to avoid circular deps
    // Ember.A = A;
    Ember.Set = Set;
    Ember.Deferred = Deferred;
    Ember.onLoad = onLoad;
    Ember.runLoadHooks = runLoadHooks;

    Ember.ArrayController = ArrayController;
    Ember.ObjectController = ObjectController;
    Ember.Controller = Controller;
    Ember.ControllerMixin = ControllerMixin;

    Ember.RSVP = RSVP;
    // END EXPORTS

    __exports__["default"] = Ember;
  });
define("ember-runtime/mixins/action_handler",
  ["ember-metal/merge","ember-metal/mixin","ember-metal/property_get","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var merge = __dependency1__["default"];
    var Mixin = __dependency2__.Mixin;
    var get = __dependency3__.get;
    var typeOf = __dependency4__.typeOf;

    /**
      The `Ember.ActionHandler` mixin implements support for moving an `actions`
      property to an `_actions` property at extend time, and adding `_actions`
      to the object's mergedProperties list.

      `Ember.ActionHandler` is available on some familiar classes including
      `Ember.Route`, `Ember.View`, `Ember.Component`, and controllers such as
      `Ember.Controller` and `Ember.ObjectController`.
      (Internally the mixin is used by `Ember.CoreView`, `Ember.ControllerMixin`,
      and `Ember.Route` and available to the above classes through
      inheritance.)

      @class ActionHandler
      @namespace Ember
    */
    var ActionHandler = Mixin.create({
      mergedProperties: ['_actions'],

      /**
        The collection of functions, keyed by name, available on this
        `ActionHandler` as action targets.

        These functions will be invoked when a matching `{{action}}` is triggered
        from within a template and the application's current route is this route.

        Actions can also be invoked from other parts of your application
        via `ActionHandler#send`.

        The `actions` hash will inherit action handlers from
        the `actions` hash defined on extended parent classes
        or mixins rather than just replace the entire hash, e.g.:

        ```js
        App.CanDisplayBanner = Ember.Mixin.create({
          actions: {
            displayBanner: function(msg) {
              // ...
            }
          }
        });

        App.WelcomeRoute = Ember.Route.extend(App.CanDisplayBanner, {
          actions: {
            playMusic: function() {
              // ...
            }
          }
        });

        // `WelcomeRoute`, when active, will be able to respond
        // to both actions, since the actions hash is merged rather
        // then replaced when extending mixins / parent classes.
        this.send('displayBanner');
        this.send('playMusic');
        ```

        Within a Controller, Route, View or Component's action handler,
        the value of the `this` context is the Controller, Route, View or
        Component object:

        ```js
        App.SongRoute = Ember.Route.extend({
          actions: {
            myAction: function() {
              this.controllerFor("song");
              this.transitionTo("other.route");
              ...
            }
          }
        });
        ```

        It is also possible to call `this._super()` from within an
        action handler if it overrides a handler defined on a parent
        class or mixin:

        Take for example the following routes:

        ```js
        App.DebugRoute = Ember.Mixin.create({
          actions: {
            debugRouteInformation: function() {
              console.debug("trololo");
            }
          }
        });

        App.AnnoyingDebugRoute = Ember.Route.extend(App.DebugRoute, {
          actions: {
            debugRouteInformation: function() {
              // also call the debugRouteInformation of mixed in App.DebugRoute
              this._super();

              // show additional annoyance
              window.alert(...);
            }
          }
        });
        ```

        ## Bubbling

        By default, an action will stop bubbling once a handler defined
        on the `actions` hash handles it. To continue bubbling the action,
        you must return `true` from the handler:

        ```js
        App.Router.map(function() {
          this.resource("album", function() {
            this.route("song");
          });
        });

        App.AlbumRoute = Ember.Route.extend({
          actions: {
            startPlaying: function() {
            }
          }
        });

        App.AlbumSongRoute = Ember.Route.extend({
          actions: {
            startPlaying: function() {
              // ...

              if (actionShouldAlsoBeTriggeredOnParentRoute) {
                return true;
              }
            }
          }
        });
        ```

        @property actions
        @type Hash
        @default null
      */

      /**
        Moves `actions` to `_actions` at extend time. Note that this currently
        modifies the mixin themselves, which is technically dubious but
        is practically of little consequence. This may change in the future.

        @private
        @method willMergeMixin
      */
      willMergeMixin: function(props) {
        var hashName;

        if (!props._actions) {
          Ember.assert("'actions' should not be a function", typeof(props.actions) !== 'function');

          if (typeOf(props.actions) === 'object') {
            hashName = 'actions';
          } else if (typeOf(props.events) === 'object') {
            Ember.deprecate('Action handlers contained in an `events` object are deprecated in favor of putting them in an `actions` object', false);
            hashName = 'events';
          }

          if (hashName) {
            props._actions = merge(props._actions || {}, props[hashName]);
          }

          delete props[hashName];
        }
      },

      /**
        Triggers a named action on the `ActionHandler`. Any parameters
        supplied after the `actionName` string will be passed as arguments
        to the action target function.

        If the `ActionHandler` has its `target` property set, actions may
        bubble to the `target`. Bubbling happens when an `actionName` can
        not be found in the `ActionHandler`'s `actions` hash or if the
        action target function returns `true`.

        Example

        ```js
        App.WelcomeRoute = Ember.Route.extend({
          actions: {
            playTheme: function() {
               this.send('playMusic', 'theme.mp3');
            },
            playMusic: function(track) {
              // ...
            }
          }
        });
        ```

        @method send
        @param {String} actionName The action to trigger
        @param {*} context a context to send with the action
      */
      send: function(actionName) {
        var args = [].slice.call(arguments, 1), target;

        if (this._actions && this._actions[actionName]) {
          if (this._actions[actionName].apply(this, args) === true) {
            // handler returned true, so this action will bubble
          } else {
            return;
          }
        } else if (!Ember.FEATURES.isEnabled('ember-routing-drop-deprecated-action-style') && this.deprecatedSend && this.deprecatedSendHandles && this.deprecatedSendHandles(actionName)) {
          Ember.warn("The current default is deprecated but will prefer to handle actions directly on the controller instead of a similarly named action in the actions hash. To turn off this deprecated feature set: Ember.FEATURES['ember-routing-drop-deprecated-action-style'] = true");
          if (this.deprecatedSend.apply(this, [].slice.call(arguments)) === true) {
            // handler return true, so this action will bubble
          } else {
            return;
          }
        }

        if (target = get(this, 'target')) {
          Ember.assert("The `target` for " + this + " (" + target + ") does not have a `send` method", typeof target.send === 'function');
          target.send.apply(target, arguments);
        }
      }
    });

    __exports__["default"] = ActionHandler;
  });
define("ember-runtime/mixins/array",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/computed","ember-metal/is_none","ember-runtime/mixins/enumerable","ember-metal/enumerable_utils","ember-metal/mixin","ember-metal/property_events","ember-metal/events","ember-metal/watching","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    // ..........................................................
    // HELPERS
    //
    var Ember = __dependency1__["default"];
    // ES6TODO: Ember.A

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var computed = __dependency4__.computed;
    var cacheFor = __dependency4__.cacheFor;
    var isNone = __dependency5__.isNone;
    var none = __dependency5__.none;
    var Enumerable = __dependency6__["default"];
    var EnumerableUtils = __dependency7__["default"];
    var Mixin = __dependency8__.Mixin;
    var required = __dependency8__.required;
    var propertyWillChange = __dependency9__.propertyWillChange;
    var propertyDidChange = __dependency9__.propertyDidChange;
    var addListener = __dependency10__.addListener;
    var removeListener = __dependency10__.removeListener;
    var sendEvent = __dependency10__.sendEvent;
    var hasListeners = __dependency10__.hasListeners;
    var isWatching = __dependency11__.isWatching;

    var map = EnumerableUtils.map;

    // ..........................................................
    // ARRAY
    //
    /**
      This mixin implements Observer-friendly Array-like behavior. It is not a
      concrete implementation, but it can be used up by other classes that want
      to appear like arrays.

      For example, ArrayProxy and ArrayController are both concrete classes that can
      be instantiated to implement array-like behavior. Both of these classes use
      the Array Mixin by way of the MutableArray mixin, which allows observable
      changes to be made to the underlying array.

      Unlike `Ember.Enumerable,` this mixin defines methods specifically for
      collections that provide index-ordered access to their contents. When you
      are designing code that needs to accept any kind of Array-like object, you
      should use these methods instead of Array primitives because these will
      properly notify observers of changes to the array.

      Although these methods are efficient, they do add a layer of indirection to
      your application so it is a good idea to use them only when you need the
      flexibility of using both true JavaScript arrays and "virtual" arrays such
      as controllers and collections.

      You can use the methods defined in this module to access and modify array
      contents in a KVO-friendly way. You can also be notified whenever the
      membership of an array changes by using `.observes('myArray.[]')`.

      To support `Ember.Array` in your own class, you must override two
      primitives to use it: `replace()` and `objectAt()`.

      Note that the Ember.Array mixin also incorporates the `Ember.Enumerable`
      mixin. All `Ember.Array`-like objects are also enumerable.

      @class Array
      @namespace Ember
      @uses Ember.Enumerable
      @since Ember 0.9.0
    */
    var EmberArray = Mixin.create(Enumerable, {

      /**
        Your array must support the `length` property. Your replace methods should
        set this property whenever it changes.

        @property {Number} length
      */
      length: required(),

      /**
        Returns the object at the given `index`. If the given `index` is negative
        or is greater or equal than the array length, returns `undefined`.

        This is one of the primitives you must implement to support `Ember.Array`.
        If your object supports retrieving the value of an array item using `get()`
        (i.e. `myArray.get(0)`), then you do not need to implement this method
        yourself.

        ```javascript
        var arr = ['a', 'b', 'c', 'd'];
        arr.objectAt(0);   // "a"
        arr.objectAt(3);   // "d"
        arr.objectAt(-1);  // undefined
        arr.objectAt(4);   // undefined
        arr.objectAt(5);   // undefined
        ```

        @method objectAt
        @param {Number} idx The index of the item to return.
        @return {*} item at index or undefined
      */
      objectAt: function(idx) {
        if ((idx < 0) || (idx >= get(this, 'length'))) return undefined;
        return get(this, idx);
      },

      /**
        This returns the objects at the specified indexes, using `objectAt`.

        ```javascript
        var arr = ['a', 'b', 'c', 'd'];
        arr.objectsAt([0, 1, 2]);  // ["a", "b", "c"]
        arr.objectsAt([2, 3, 4]);  // ["c", "d", undefined]
        ```

        @method objectsAt
        @param {Array} indexes An array of indexes of items to return.
        @return {Array}
       */
      objectsAt: function(indexes) {
        var self = this;
        return map(indexes, function(idx) { return self.objectAt(idx); });
      },

      // overrides Ember.Enumerable version
      nextObject: function(idx) {
        return this.objectAt(idx);
      },

      /**
        This is the handler for the special array content property. If you get
        this property, it will return this. If you set this property it a new
        array, it will replace the current content.

        This property overrides the default property defined in `Ember.Enumerable`.

        @property []
        @return this
      */
      '[]': computed(function(key, value) {
        if (value !== undefined) this.replace(0, get(this, 'length'), value) ;
        return this ;
      }),

      firstObject: computed(function() {
        return this.objectAt(0);
      }),

      lastObject: computed(function() {
        return this.objectAt(get(this, 'length')-1);
      }),

      // optimized version from Enumerable
      contains: function(obj) {
        return this.indexOf(obj) >= 0;
      },

      // Add any extra methods to Ember.Array that are native to the built-in Array.
      /**
        Returns a new array that is a slice of the receiver. This implementation
        uses the observable array methods to retrieve the objects for the new
        slice.

        ```javascript
        var arr = ['red', 'green', 'blue'];
        arr.slice(0);       // ['red', 'green', 'blue']
        arr.slice(0, 2);    // ['red', 'green']
        arr.slice(1, 100);  // ['green', 'blue']
        ```

        @method slice
        @param {Integer} beginIndex (Optional) index to begin slicing from.
        @param {Integer} endIndex (Optional) index to end the slice at (but not included).
        @return {Array} New array with specified slice
      */
      slice: function(beginIndex, endIndex) {
        var ret = Ember.A();
        var length = get(this, 'length') ;
        if (isNone(beginIndex)) beginIndex = 0 ;
        if (isNone(endIndex) || (endIndex > length)) endIndex = length ;

        if (beginIndex < 0) beginIndex = length + beginIndex;
        if (endIndex < 0) endIndex = length + endIndex;

        while(beginIndex < endIndex) {
          ret[ret.length] = this.objectAt(beginIndex++) ;
        }
        return ret ;
      },

      /**
        Returns the index of the given object's first occurrence.
        If no `startAt` argument is given, the starting location to
        search is 0. If it's negative, will count backward from
        the end of the array. Returns -1 if no match is found.

        ```javascript
        var arr = ["a", "b", "c", "d", "a"];
        arr.indexOf("a");       //  0
        arr.indexOf("z");       // -1
        arr.indexOf("a", 2);    //  4
        arr.indexOf("a", -1);   //  4
        arr.indexOf("b", 3);    // -1
        arr.indexOf("a", 100);  // -1
        ```

        @method indexOf
        @param {Object} object the item to search for
        @param {Number} startAt optional starting location to search, default 0
        @return {Number} index or -1 if not found
      */
      indexOf: function(object, startAt) {
        var idx, len = get(this, 'length');

        if (startAt === undefined) startAt = 0;
        if (startAt < 0) startAt += len;

        for(idx = startAt; idx < len; idx++) {
          if (this.objectAt(idx) === object) return idx;
        }
        return -1;
      },

      /**
        Returns the index of the given object's last occurrence.
        If no `startAt` argument is given, the search starts from
        the last position. If it's negative, will count backward
        from the end of the array. Returns -1 if no match is found.

        ```javascript
        var arr = ["a", "b", "c", "d", "a"];
        arr.lastIndexOf("a");       //  4
        arr.lastIndexOf("z");       // -1
        arr.lastIndexOf("a", 2);    //  0
        arr.lastIndexOf("a", -1);   //  4
        arr.lastIndexOf("b", 3);    //  1
        arr.lastIndexOf("a", 100);  //  4
        ```

        @method lastIndexOf
        @param {Object} object the item to search for
        @param {Number} startAt optional starting location to search, default 0
        @return {Number} index or -1 if not found
      */
      lastIndexOf: function(object, startAt) {
        var idx, len = get(this, 'length');

        if (startAt === undefined || startAt >= len) startAt = len-1;
        if (startAt < 0) startAt += len;

        for(idx = startAt; idx >= 0; idx--) {
          if (this.objectAt(idx) === object) return idx;
        }
        return -1;
      },

      // ..........................................................
      // ARRAY OBSERVERS
      //

      /**
        Adds an array observer to the receiving array. The array observer object
        normally must implement two methods:

        * `arrayWillChange(observedObj, start, removeCount, addCount)` - This method will be
          called just before the array is modified.
        * `arrayDidChange(observedObj, start, removeCount, addCount)` - This method will be
          called just after the array is modified.

        Both callbacks will be passed the observed object, starting index of the
        change as well a a count of the items to be removed and added. You can use
        these callbacks to optionally inspect the array during the change, clear
        caches, or do any other bookkeeping necessary.

        In addition to passing a target, you can also include an options hash
        which you can use to override the method names that will be invoked on the
        target.

        @method addArrayObserver
        @param {Object} target The observer object.
        @param {Hash} opts Optional hash of configuration options including
          `willChange` and `didChange` option.
        @return {Ember.Array} receiver
      */
      addArrayObserver: function(target, opts) {
        var willChange = (opts && opts.willChange) || 'arrayWillChange',
            didChange  = (opts && opts.didChange) || 'arrayDidChange';

        var hasObservers = get(this, 'hasArrayObservers');
        if (!hasObservers) propertyWillChange(this, 'hasArrayObservers');
        addListener(this, '@array:before', target, willChange);
        addListener(this, '@array:change', target, didChange);
        if (!hasObservers) propertyDidChange(this, 'hasArrayObservers');
        return this;
      },

      /**
        Removes an array observer from the object if the observer is current
        registered. Calling this method multiple times with the same object will
        have no effect.

        @method removeArrayObserver
        @param {Object} target The object observing the array.
        @param {Hash} opts Optional hash of configuration options including
          `willChange` and `didChange` option.
        @return {Ember.Array} receiver
      */
      removeArrayObserver: function(target, opts) {
        var willChange = (opts && opts.willChange) || 'arrayWillChange',
            didChange  = (opts && opts.didChange) || 'arrayDidChange';

        var hasObservers = get(this, 'hasArrayObservers');
        if (hasObservers) propertyWillChange(this, 'hasArrayObservers');
        removeListener(this, '@array:before', target, willChange);
        removeListener(this, '@array:change', target, didChange);
        if (hasObservers) propertyDidChange(this, 'hasArrayObservers');
        return this;
      },

      /**
        Becomes true whenever the array currently has observers watching changes
        on the array.

        @property {Boolean} hasArrayObservers
      */
      hasArrayObservers: computed(function() {
        return hasListeners(this, '@array:change') || hasListeners(this, '@array:before');
      }),

      /**
        If you are implementing an object that supports `Ember.Array`, call this
        method just before the array content changes to notify any observers and
        invalidate any related properties. Pass the starting index of the change
        as well as a delta of the amounts to change.

        @method arrayContentWillChange
        @param {Number} startIdx The starting index in the array that will change.
        @param {Number} removeAmt The number of items that will be removed. If you
          pass `null` assumes 0
        @param {Number} addAmt The number of items that will be added. If you
          pass `null` assumes 0.
        @return {Ember.Array} receiver
      */
      arrayContentWillChange: function(startIdx, removeAmt, addAmt) {

        // if no args are passed assume everything changes
        if (startIdx===undefined) {
          startIdx = 0;
          removeAmt = addAmt = -1;
        } else {
          if (removeAmt === undefined) removeAmt=-1;
          if (addAmt    === undefined) addAmt=-1;
        }

        // Make sure the @each proxy is set up if anyone is observing @each
        if (isWatching(this, '@each')) { get(this, '@each'); }

        sendEvent(this, '@array:before', [this, startIdx, removeAmt, addAmt]);

        var removing, lim;
        if (startIdx>=0 && removeAmt>=0 && get(this, 'hasEnumerableObservers')) {
          removing = [];
          lim = startIdx+removeAmt;
          for(var idx=startIdx;idx<lim;idx++) removing.push(this.objectAt(idx));
        } else {
          removing = removeAmt;
        }

        this.enumerableContentWillChange(removing, addAmt);

        return this;
      },

      /**
        If you are implementing an object that supports `Ember.Array`, call this
        method just after the array content changes to notify any observers and
        invalidate any related properties. Pass the starting index of the change
        as well as a delta of the amounts to change.

        @method arrayContentDidChange
        @param {Number} startIdx The starting index in the array that did change.
        @param {Number} removeAmt The number of items that were removed. If you
          pass `null` assumes 0
        @param {Number} addAmt The number of items that were added. If you
          pass `null` assumes 0.
        @return {Ember.Array} receiver
      */
      arrayContentDidChange: function(startIdx, removeAmt, addAmt) {

        // if no args are passed assume everything changes
        if (startIdx===undefined) {
          startIdx = 0;
          removeAmt = addAmt = -1;
        } else {
          if (removeAmt === undefined) removeAmt=-1;
          if (addAmt    === undefined) addAmt=-1;
        }

        var adding, lim;
        if (startIdx>=0 && addAmt>=0 && get(this, 'hasEnumerableObservers')) {
          adding = [];
          lim = startIdx+addAmt;
          for(var idx=startIdx;idx<lim;idx++) adding.push(this.objectAt(idx));
        } else {
          adding = addAmt;
        }

        this.enumerableContentDidChange(removeAmt, adding);
        sendEvent(this, '@array:change', [this, startIdx, removeAmt, addAmt]);

        var length      = get(this, 'length'),
            cachedFirst = cacheFor(this, 'firstObject'),
            cachedLast  = cacheFor(this, 'lastObject');
        if (this.objectAt(0) !== cachedFirst) {
          propertyWillChange(this, 'firstObject');
          propertyDidChange(this, 'firstObject');
        }
        if (this.objectAt(length-1) !== cachedLast) {
          propertyWillChange(this, 'lastObject');
          propertyDidChange(this, 'lastObject');
        }

        return this;
      },

      // ..........................................................
      // ENUMERATED PROPERTIES
      //

      /**
        Returns a special object that can be used to observe individual properties
        on the array. Just get an equivalent property on this object and it will
        return an enumerable that maps automatically to the named key on the
        member objects.

        If you merely want to watch for any items being added or removed to the array,
        use the `[]` property instead of `@each`.

        @property @each
      */
      '@each': computed(function() {
        if (!this.__each) {
          // ES6TODO: GRRRRR
          var EachProxy = requireModule('ember-runtime/system/each_proxy')['EachProxy'];

          this.__each = new EachProxy(this);
        }

        return this.__each;
      })

    });

    __exports__["default"] = EmberArray;
  });
define("ember-runtime/mixins/comparable",
  ["ember-metal/mixin","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Mixin = __dependency1__.Mixin;
    var required = __dependency1__.required;

    /**
    @module ember
    @submodule ember-runtime
    */


    /**
      Implements some standard methods for comparing objects. Add this mixin to
      any class you create that can compare its instances.

      You should implement the `compare()` method.

      @class Comparable
      @namespace Ember
      @since Ember 0.9
    */
    var Comparable = Mixin.create({

      /**
        Override to return the result of the comparison of the two parameters. The
        compare method should return:

        - `-1` if `a < b`
        - `0` if `a == b`
        - `1` if `a > b`

        Default implementation raises an exception.

        @method compare
        @param a {Object} the first object to compare
        @param b {Object} the second object to compare
        @return {Integer} the result of the comparison
      */
      compare: required(Function)

    });

    __exports__["default"] = Comparable;
  });
define("ember-runtime/mixins/copyable",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/mixin","ember-runtime/mixins/freezable","ember-runtime/system/string","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */


    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var required = __dependency3__.required;
    var Freezable = __dependency4__.Freezable;
    var Mixin = __dependency3__.Mixin;
    var fmt = __dependency5__.fmt;
    var EmberError = __dependency6__["default"];


    /**
      Implements some standard methods for copying an object. Add this mixin to
      any object you create that can create a copy of itself. This mixin is
      added automatically to the built-in array.

      You should generally implement the `copy()` method to return a copy of the
      receiver.

      Note that `frozenCopy()` will only work if you also implement
      `Ember.Freezable`.

      @class Copyable
      @namespace Ember
      @since Ember 0.9
    */
    var Copyable = Mixin.create({

      /**
        Override to return a copy of the receiver. Default implementation raises
        an exception.

        @method copy
        @param {Boolean} deep if `true`, a deep copy of the object should be made
        @return {Object} copy of receiver
      */
      copy: required(Function),

      /**
        If the object implements `Ember.Freezable`, then this will return a new
        copy if the object is not frozen and the receiver if the object is frozen.

        Raises an exception if you try to call this method on a object that does
        not support freezing.

        You should use this method whenever you want a copy of a freezable object
        since a freezable object can simply return itself without actually
        consuming more memory.

        @method frozenCopy
        @return {Object} copy of receiver or receiver
      */
      frozenCopy: function() {
        if (Freezable && Freezable.detect(this)) {
          return get(this, 'isFrozen') ? this : this.copy().freeze();
        } else {
          throw new EmberError(fmt("%@ does not support freezing", [this]));
        }
      }
    });

    __exports__["default"] = Copyable;
  });
define("ember-runtime/mixins/deferred",
  ["ember-metal/core","ember-metal/property_get","ember-metal/mixin","ember-metal/computed","ember-metal/run_loop","ember-runtime/ext/rsvp","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.FEATURES, Ember.Test
    var get = __dependency2__.get;
    var Mixin = __dependency3__.Mixin;
    var computed = __dependency4__.computed;
    var run = __dependency5__["default"];
    var RSVP = __dependency6__["default"];

    var asyncStart = function() {
      if (Ember.Test && Ember.Test.adapter) {
        Ember.Test.adapter.asyncStart();
      }
    };

    var asyncEnd = function() {
      if (Ember.Test && Ember.Test.adapter) {
        Ember.Test.adapter.asyncEnd();
      }
    };

    RSVP.configure('async', function(callback, promise) {
      var async = !run.currentRunLoop;

      if (Ember.testing && async) { asyncStart(); }

      run.backburner.schedule('actions', function(){
        if (Ember.testing && async) { asyncEnd(); }
        callback(promise);
      });
    });

    RSVP.Promise.prototype.fail = function(callback, label){
      Ember.deprecate('RSVP.Promise.fail has been renamed as RSVP.Promise.catch');
      return this['catch'](callback, label);
    };

    /**
    @module ember
    @submodule ember-runtime
    */


    /**
      @class Deferred
      @namespace Ember
     */
    var DeferredMixin = Mixin.create({
      /**
        Add handlers to be called when the Deferred object is resolved or rejected.

        @method then
        @param {Function} resolve a callback function to be called when done
        @param {Function} reject  a callback function to be called when failed
      */
      then: function(resolve, reject, label) {
        var deferred, promise, entity;

        entity = this;
        deferred = get(this, '_deferred');
        promise = deferred.promise;

        function fulfillmentHandler(fulfillment) {
          if (fulfillment === promise) {
            return resolve(entity);
          } else {
            return resolve(fulfillment);
          }
        }

        return promise.then(resolve && fulfillmentHandler, reject, label);
      },

      /**
        Resolve a Deferred object and call any `doneCallbacks` with the given args.

        @method resolve
      */
      resolve: function(value) {
        var deferred, promise;

        deferred = get(this, '_deferred');
        promise = deferred.promise;

        if (value === this) {
          deferred.resolve(promise);
        } else {
          deferred.resolve(value);
        }
      },

      /**
        Reject a Deferred object and call any `failCallbacks` with the given args.

        @method reject
      */
      reject: function(value) {
        get(this, '_deferred').reject(value);
      },

      _deferred: computed(function() {
        return RSVP.defer('Ember: DeferredMixin - ' + this);
      })
    });

    __exports__["default"] = DeferredMixin;
  });
define("ember-runtime/mixins/enumerable",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/mixin","ember-metal/enumerable_utils","ember-metal/computed","ember-metal/property_events","ember-metal/events","ember-runtime/compare","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    // ..........................................................
    // HELPERS
    //

    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var apply = __dependency4__.apply;
    var Mixin = __dependency5__.Mixin;
    var required = __dependency5__.required;
    var aliasMethod = __dependency5__.aliasMethod;
    var EnumerableUtils = __dependency6__["default"];
    var computed = __dependency7__.computed;
    var propertyWillChange = __dependency8__.propertyWillChange;
    var propertyDidChange = __dependency8__.propertyDidChange;
    var addListener = __dependency9__.addListener;
    var removeListener = __dependency9__.removeListener;
    var sendEvent = __dependency9__.sendEvent;
    var hasListeners = __dependency9__.hasListeners;
    var compare = __dependency10__["default"];

    var a_slice = Array.prototype.slice;
    var a_indexOf = EnumerableUtils.indexOf;

    var contexts = [];

    function popCtx() {
      return contexts.length===0 ? {} : contexts.pop();
    }

    function pushCtx(ctx) {
      contexts.push(ctx);
      return null;
    }

    function iter(key, value) {
      var valueProvided = arguments.length === 2;

      function i(item) {
        var cur = get(item, key);
        return valueProvided ? value===cur : !!cur;
      }
      return i ;
    }

    /**
      This mixin defines the common interface implemented by enumerable objects
      in Ember. Most of these methods follow the standard Array iteration
      API defined up to JavaScript 1.8 (excluding language-specific features that
      cannot be emulated in older versions of JavaScript).

      This mixin is applied automatically to the Array class on page load, so you
      can use any of these methods on simple arrays. If Array already implements
      one of these methods, the mixin will not override them.

      ## Writing Your Own Enumerable

      To make your own custom class enumerable, you need two items:

      1. You must have a length property. This property should change whenever
         the number of items in your enumerable object changes. If you use this
         with an `Ember.Object` subclass, you should be sure to change the length
         property using `set().`

      2. You must implement `nextObject().` See documentation.

      Once you have these two methods implemented, apply the `Ember.Enumerable` mixin
      to your class and you will be able to enumerate the contents of your object
      like any other collection.

      ## Using Ember Enumeration with Other Libraries

      Many other libraries provide some kind of iterator or enumeration like
      facility. This is often where the most common API conflicts occur.
      Ember's API is designed to be as friendly as possible with other
      libraries by implementing only methods that mostly correspond to the
      JavaScript 1.8 API.

      @class Enumerable
      @namespace Ember
      @since Ember 0.9
    */
    var Enumerable = Mixin.create({

      /**
        Implement this method to make your class enumerable.

        This method will be call repeatedly during enumeration. The index value
        will always begin with 0 and increment monotonically. You don't have to
        rely on the index value to determine what object to return, but you should
        always check the value and start from the beginning when you see the
        requested index is 0.

        The `previousObject` is the object that was returned from the last call
        to `nextObject` for the current iteration. This is a useful way to
        manage iteration if you are tracing a linked list, for example.

        Finally the context parameter will always contain a hash you can use as
        a "scratchpad" to maintain any other state you need in order to iterate
        properly. The context object is reused and is not reset between
        iterations so make sure you setup the context with a fresh state whenever
        the index parameter is 0.

        Generally iterators will continue to call `nextObject` until the index
        reaches the your current length-1. If you run out of data before this
        time for some reason, you should simply return undefined.

        The default implementation of this method simply looks up the index.
        This works great on any Array-like objects.

        @method nextObject
        @param {Number} index the current index of the iteration
        @param {Object} previousObject the value returned by the last call to
          `nextObject`.
        @param {Object} context a context object you can use to maintain state.
        @return {Object} the next object in the iteration or undefined
      */
      nextObject: required(Function),

      /**
        Helper method returns the first object from a collection. This is usually
        used by bindings and other parts of the framework to extract a single
        object if the enumerable contains only one item.

        If you override this method, you should implement it so that it will
        always return the same value each time it is called. If your enumerable
        contains only one object, this method should always return that object.
        If your enumerable is empty, this method should return `undefined`.

        ```javascript
        var arr = ["a", "b", "c"];
        arr.get('firstObject');  // "a"

        var arr = [];
        arr.get('firstObject');  // undefined
        ```

        @property firstObject
        @return {Object} the object or undefined
      */
      firstObject: computed(function() {
        if (get(this, 'length')===0) return undefined ;

        // handle generic enumerables
        var context = popCtx(), ret;
        ret = this.nextObject(0, null, context);
        pushCtx(context);
        return ret ;
      }).property('[]'),

      /**
        Helper method returns the last object from a collection. If your enumerable
        contains only one object, this method should always return that object.
        If your enumerable is empty, this method should return `undefined`.

        ```javascript
        var arr = ["a", "b", "c"];
        arr.get('lastObject');  // "c"

        var arr = [];
        arr.get('lastObject');  // undefined
        ```

        @property lastObject
        @return {Object} the last object or undefined
      */
      lastObject: computed(function() {
        var len = get(this, 'length');
        if (len===0) return undefined ;
        var context = popCtx(), idx=0, cur, last = null;
        do {
          last = cur;
          cur = this.nextObject(idx++, last, context);
        } while (cur !== undefined);
        pushCtx(context);
        return last;
      }).property('[]'),

      /**
        Returns `true` if the passed object can be found in the receiver. The
        default version will iterate through the enumerable until the object
        is found. You may want to override this with a more efficient version.

        ```javascript
        var arr = ["a", "b", "c"];
        arr.contains("a"); // true
        arr.contains("z"); // false
        ```

        @method contains
        @param {Object} obj The object to search for.
        @return {Boolean} `true` if object is found in enumerable.
      */
      contains: function(obj) {
        return this.find(function(item) { return item===obj; }) !== undefined;
      },

      /**
        Iterates through the enumerable, calling the passed function on each
        item. This method corresponds to the `forEach()` method defined in
        JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        @method forEach
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Object} receiver
      */
      forEach: function(callback, target) {
        if (typeof callback !== "function") throw new TypeError() ;
        var len = get(this, 'length'), last = null, context = popCtx();

        if (target === undefined) target = null;

        for(var idx=0;idx<len;idx++) {
          var next = this.nextObject(idx, last, context) ;
          callback.call(target, next, idx, this);
          last = next ;
        }
        last = null ;
        context = pushCtx(context);
        return this ;
      },

      /**
        Alias for `mapBy`

        @method getEach
        @param {String} key name of the property
        @return {Array} The mapped array.
      */
      getEach: function(key) {
        return this.mapBy(key);
      },

      /**
        Sets the value on the named property for each member. This is more
        efficient than using other methods defined on this helper. If the object
        implements Ember.Observable, the value will be changed to `set(),` otherwise
        it will be set directly. `null` objects are skipped.

        @method setEach
        @param {String} key The key to set
        @param {Object} value The object to set
        @return {Object} receiver
      */
      setEach: function(key, value) {
        return this.forEach(function(item) {
          set(item, key, value);
        });
      },

      /**
        Maps all of the items in the enumeration to another value, returning
        a new array. This method corresponds to `map()` defined in JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the mapped value.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        @method map
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Array} The mapped array.
      */
      map: function(callback, target) {
        var ret = Ember.A();
        this.forEach(function(x, idx, i) {
          ret[idx] = callback.call(target, x, idx,i);
        });
        return ret ;
      },

      /**
        Similar to map, this specialized function returns the value of the named
        property on all items in the enumeration.

        @method mapBy
        @param {String} key name of the property
        @return {Array} The mapped array.
      */
      mapBy: function(key) {
        return this.map(function(next) {
          return get(next, key);
        });
      },

      /**
        Similar to map, this specialized function returns the value of the named
        property on all items in the enumeration.

        @method mapProperty
        @param {String} key name of the property
        @return {Array} The mapped array.
        @deprecated Use `mapBy` instead
      */

      mapProperty: aliasMethod('mapBy'),

      /**
        Returns an array with all of the items in the enumeration that the passed
        function returns true for. This method corresponds to `filter()` defined in
        JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the `true` to include the item in the results, `false`
        otherwise.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        @method filter
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Array} A filtered array.
      */
      filter: function(callback, target) {
        var ret = Ember.A();
        this.forEach(function(x, idx, i) {
          if (callback.call(target, x, idx, i)) ret.push(x);
        });
        return ret ;
      },

      /**
        Returns an array with all of the items in the enumeration where the passed
        function returns false for. This method is the inverse of filter().

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - *item* is the current item in the iteration.
        - *index* is the current index in the iteration
        - *enumerable* is the enumerable object itself.

        It should return the a falsey value to include the item in the results.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as "this" on the context. This is a good way
        to give your iterator function access to the current object.

        @method reject
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Array} A rejected array.
       */
      reject: function(callback, target) {
        return this.filter(function() {
          return !(apply(target, callback, arguments));
        });
      },

      /**
        Returns an array with just the items with the matched property. You
        can pass an optional second argument with the target value. Otherwise
        this will match any property that evaluates to `true`.

        @method filterBy
        @param {String} key the property to test
        @param {*} [value] optional value to test against.
        @return {Array} filtered array
      */
      filterBy: function(key, value) {
        return this.filter(apply(this, iter, arguments));
      },

      /**
        Returns an array with just the items with the matched property. You
        can pass an optional second argument with the target value. Otherwise
        this will match any property that evaluates to `true`.

        @method filterProperty
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Array} filtered array
        @deprecated Use `filterBy` instead
      */
      filterProperty: aliasMethod('filterBy'),

      /**
        Returns an array with the items that do not have truthy values for
        key.  You can pass an optional second argument with the target value.  Otherwise
        this will match any property that evaluates to false.

        @method rejectBy
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Array} rejected array
      */
      rejectBy: function(key, value) {
        var exactValue = function(item) { return get(item, key) === value; },
            hasValue = function(item) { return !!get(item, key); },
            use = (arguments.length === 2 ? exactValue : hasValue);

        return this.reject(use);
      },

      /**
        Returns an array with the items that do not have truthy values for
        key.  You can pass an optional second argument with the target value.  Otherwise
        this will match any property that evaluates to false.

        @method rejectProperty
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Array} rejected array
        @deprecated Use `rejectBy` instead
      */
      rejectProperty: aliasMethod('rejectBy'),

      /**
        Returns the first item in the array for which the callback returns true.
        This method works similar to the `filter()` method defined in JavaScript 1.6
        except that it will stop working on the array once a match is found.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the `true` to include the item in the results, `false`
        otherwise.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        @method find
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Object} Found item or `undefined`.
      */
      find: function(callback, target) {
        var len = get(this, 'length') ;
        if (target === undefined) target = null;

        var last = null, next, found = false, ret ;
        var context = popCtx();
        for(var idx=0;idx<len && !found;idx++) {
          next = this.nextObject(idx, last, context) ;
          if (found = callback.call(target, next, idx, this)) ret = next ;
          last = next ;
        }
        next = last = null ;
        context = pushCtx(context);
        return ret ;
      },

      /**
        Returns the first item with a property matching the passed value. You
        can pass an optional second argument with the target value. Otherwise
        this will match any property that evaluates to `true`.

        This method works much like the more generic `find()` method.

        @method findBy
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Object} found item or `undefined`
      */
      findBy: function(key, value) {
        return this.find(apply(this, iter, arguments));
      },

      /**
        Returns the first item with a property matching the passed value. You
        can pass an optional second argument with the target value. Otherwise
        this will match any property that evaluates to `true`.

        This method works much like the more generic `find()` method.

        @method findProperty
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Object} found item or `undefined`
        @deprecated Use `findBy` instead
      */
      findProperty: aliasMethod('findBy'),

      /**
        Returns `true` if the passed function returns true for every item in the
        enumeration. This corresponds with the `every()` method in JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the `true` or `false`.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        Example Usage:

        ```javascript
        if (people.every(isEngineer)) { Paychecks.addBigBonus(); }
        ```

        @method every
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Boolean}
      */
      every: function(callback, target) {
        return !this.find(function(x, idx, i) {
          return !callback.call(target, x, idx, i);
        });
      },

      /**
        @method everyBy
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @deprecated Use `isEvery` instead
        @return {Boolean}
      */
      everyBy: aliasMethod('isEvery'),

      /**
        @method everyProperty
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @deprecated Use `isEvery` instead
        @return {Boolean}
      */
      everyProperty: aliasMethod('isEvery'),

      /**
        Returns `true` if the passed property resolves to `true` for all items in
        the enumerable. This method is often simpler/faster than using a callback.

        @method isEvery
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Boolean}
        @since 1.3.0
      */
      isEvery: function(key, value) {
        return this.every(apply(this, iter, arguments));
      },

      /**
        Returns `true` if the passed function returns true for any item in the
        enumeration. This corresponds with the `some()` method in JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the `true` to include the item in the results, `false`
        otherwise.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        Usage Example:

        ```javascript
        if (people.any(isManager)) { Paychecks.addBiggerBonus(); }
        ```

        @method any
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Boolean} `true` if the passed function returns `true` for any item
      */
      any: function(callback, target) {
        var len     = get(this, 'length'),
            context = popCtx(),
            found   = false,
            last    = null,
            next, idx;

        if (target === undefined) { target = null; }

        for (idx = 0; idx < len && !found; idx++) {
          next  = this.nextObject(idx, last, context);
          found = callback.call(target, next, idx, this);
          last  = next;
        }

        next = last = null;
        context = pushCtx(context);
        return found;
      },

      /**
        Returns `true` if the passed function returns true for any item in the
        enumeration. This corresponds with the `some()` method in JavaScript 1.6.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(item, index, enumerable);
        ```

        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        It should return the `true` to include the item in the results, `false`
        otherwise.

        Note that in addition to a callback, you can also pass an optional target
        object that will be set as `this` on the context. This is a good way
        to give your iterator function access to the current object.

        Usage Example:

        ```javascript
        if (people.some(isManager)) { Paychecks.addBiggerBonus(); }
        ```

        @method some
        @param {Function} callback The callback to execute
        @param {Object} [target] The target object to use
        @return {Boolean} `true` if the passed function returns `true` for any item
        @deprecated Use `any` instead
      */
      some: aliasMethod('any'),

      /**
        Returns `true` if the passed property resolves to `true` for any item in
        the enumerable. This method is often simpler/faster than using a callback.

        @method isAny
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Boolean} `true` if the passed function returns `true` for any item
        @since 1.3.0
      */
      isAny: function(key, value) {
        return this.any(apply(this, iter, arguments));
      },

      /**
        @method anyBy
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Boolean} `true` if the passed function returns `true` for any item
        @deprecated Use `isAny` instead
      */
      anyBy: aliasMethod('isAny'),

      /**
        @method someProperty
        @param {String} key the property to test
        @param {String} [value] optional value to test against.
        @return {Boolean} `true` if the passed function returns `true` for any item
        @deprecated Use `isAny` instead
      */
      someProperty: aliasMethod('isAny'),

      /**
        This will combine the values of the enumerator into a single value. It
        is a useful way to collect a summary value from an enumeration. This
        corresponds to the `reduce()` method defined in JavaScript 1.8.

        The callback method you provide should have the following signature (all
        parameters are optional):

        ```javascript
        function(previousValue, item, index, enumerable);
        ```

        - `previousValue` is the value returned by the last call to the iterator.
        - `item` is the current item in the iteration.
        - `index` is the current index in the iteration.
        - `enumerable` is the enumerable object itself.

        Return the new cumulative value.

        In addition to the callback you can also pass an `initialValue`. An error
        will be raised if you do not pass an initial value and the enumerator is
        empty.

        Note that unlike the other methods, this method does not allow you to
        pass a target object to set as this for the callback. It's part of the
        spec. Sorry.

        @method reduce
        @param {Function} callback The callback to execute
        @param {Object} initialValue Initial value for the reduce
        @param {String} reducerProperty internal use only.
        @return {Object} The reduced value.
      */
      reduce: function(callback, initialValue, reducerProperty) {
        if (typeof callback !== "function") { throw new TypeError(); }

        var ret = initialValue;

        this.forEach(function(item, i) {
          ret = callback(ret, item, i, this, reducerProperty);
        }, this);

        return ret;
      },

      /**
        Invokes the named method on every object in the receiver that
        implements it. This method corresponds to the implementation in
        Prototype 1.6.

        @method invoke
        @param {String} methodName the name of the method
        @param {Object...} args optional arguments to pass as well.
        @return {Array} return values from calling invoke.
      */
      invoke: function(methodName) {
        var args, ret = Ember.A();
        if (arguments.length>1) args = a_slice.call(arguments, 1);

        this.forEach(function(x, idx) {
          var method = x && x[methodName];
          if ('function' === typeof method) {
            ret[idx] = args ? apply(x, method, args) : x[methodName]();
          }
        }, this);

        return ret;
      },

      /**
        Simply converts the enumerable into a genuine array. The order is not
        guaranteed. Corresponds to the method implemented by Prototype.

        @method toArray
        @return {Array} the enumerable as an array.
      */
      toArray: function() {
        var ret = Ember.A();
        this.forEach(function(o, idx) { ret[idx] = o; });
        return ret;
      },

      /**
        Returns a copy of the array with all null and undefined elements removed.

        ```javascript
        var arr = ["a", null, "c", undefined];
        arr.compact();  // ["a", "c"]
        ```

        @method compact
        @return {Array} the array without null and undefined elements.
      */
      compact: function() {
        return this.filter(function(value) { return value != null; });
      },

      /**
        Returns a new enumerable that excludes the passed value. The default
        implementation returns an array regardless of the receiver type unless
        the receiver does not contain the value.

        ```javascript
        var arr = ["a", "b", "a", "c"];
        arr.without("a");  // ["b", "c"]
        ```

        @method without
        @param {Object} value
        @return {Ember.Enumerable}
      */
      without: function(value) {
        if (!this.contains(value)) return this; // nothing to do
        var ret = Ember.A();
        this.forEach(function(k) {
          if (k !== value) ret[ret.length] = k;
        }) ;
        return ret ;
      },

      /**
        Returns a new enumerable that contains only unique values. The default
        implementation returns an array regardless of the receiver type.

        ```javascript
        var arr = ["a", "a", "b", "b"];
        arr.uniq();  // ["a", "b"]
        ```

        @method uniq
        @return {Ember.Enumerable}
      */
      uniq: function() {
        var ret = Ember.A();
        this.forEach(function(k) {
          if (a_indexOf(ret, k)<0) ret.push(k);
        });
        return ret;
      },

      /**
        This property will trigger anytime the enumerable's content changes.
        You can observe this property to be notified of changes to the enumerables
        content.

        For plain enumerables, this property is read only. `Array` overrides
        this method.

        @property []
        @type Array
        @return this
      */
      '[]': computed(function(key, value) {
        return this;
      }),

      // ..........................................................
      // ENUMERABLE OBSERVERS
      //

      /**
        Registers an enumerable observer. Must implement `Ember.EnumerableObserver`
        mixin.

        @method addEnumerableObserver
        @param {Object} target
        @param {Hash} [opts]
        @return this
      */
      addEnumerableObserver: function(target, opts) {
        var willChange = (opts && opts.willChange) || 'enumerableWillChange',
            didChange  = (opts && opts.didChange) || 'enumerableDidChange';

        var hasObservers = get(this, 'hasEnumerableObservers');
        if (!hasObservers) propertyWillChange(this, 'hasEnumerableObservers');
        addListener(this, '@enumerable:before', target, willChange);
        addListener(this, '@enumerable:change', target, didChange);
        if (!hasObservers) propertyDidChange(this, 'hasEnumerableObservers');
        return this;
      },

      /**
        Removes a registered enumerable observer.

        @method removeEnumerableObserver
        @param {Object} target
        @param {Hash} [opts]
        @return this
      */
      removeEnumerableObserver: function(target, opts) {
        var willChange = (opts && opts.willChange) || 'enumerableWillChange',
            didChange  = (opts && opts.didChange) || 'enumerableDidChange';

        var hasObservers = get(this, 'hasEnumerableObservers');
        if (hasObservers) propertyWillChange(this, 'hasEnumerableObservers');
        removeListener(this, '@enumerable:before', target, willChange);
        removeListener(this, '@enumerable:change', target, didChange);
        if (hasObservers) propertyDidChange(this, 'hasEnumerableObservers');
        return this;
      },

      /**
        Becomes true whenever the array currently has observers watching changes
        on the array.

        @property hasEnumerableObservers
        @type Boolean
      */
      hasEnumerableObservers: computed(function() {
        return hasListeners(this, '@enumerable:change') || hasListeners(this, '@enumerable:before');
      }),


      /**
        Invoke this method just before the contents of your enumerable will
        change. You can either omit the parameters completely or pass the objects
        to be removed or added if available or just a count.

        @method enumerableContentWillChange
        @param {Ember.Enumerable|Number} removing An enumerable of the objects to
          be removed or the number of items to be removed.
        @param {Ember.Enumerable|Number} adding An enumerable of the objects to be
          added or the number of items to be added.
        @chainable
      */
      enumerableContentWillChange: function(removing, adding) {

        var removeCnt, addCnt, hasDelta;

        if ('number' === typeof removing) removeCnt = removing;
        else if (removing) removeCnt = get(removing, 'length');
        else removeCnt = removing = -1;

        if ('number' === typeof adding) addCnt = adding;
        else if (adding) addCnt = get(adding,'length');
        else addCnt = adding = -1;

        hasDelta = addCnt<0 || removeCnt<0 || addCnt-removeCnt!==0;

        if (removing === -1) removing = null;
        if (adding   === -1) adding   = null;

        propertyWillChange(this, '[]');
        if (hasDelta) propertyWillChange(this, 'length');
        sendEvent(this, '@enumerable:before', [this, removing, adding]);

        return this;
      },

      /**
        Invoke this method when the contents of your enumerable has changed.
        This will notify any observers watching for content changes. If your are
        implementing an ordered enumerable (such as an array), also pass the
        start and end values where the content changed so that it can be used to
        notify range observers.

        @method enumerableContentDidChange
        @param {Ember.Enumerable|Number} removing An enumerable of the objects to
          be removed or the number of items to be removed.
        @param {Ember.Enumerable|Number} adding  An enumerable of the objects to
          be added or the number of items to be added.
        @chainable
      */
      enumerableContentDidChange: function(removing, adding) {
        var removeCnt, addCnt, hasDelta;

        if ('number' === typeof removing) removeCnt = removing;
        else if (removing) removeCnt = get(removing, 'length');
        else removeCnt = removing = -1;

        if ('number' === typeof adding) addCnt = adding;
        else if (adding) addCnt = get(adding, 'length');
        else addCnt = adding = -1;

        hasDelta = addCnt<0 || removeCnt<0 || addCnt-removeCnt!==0;

        if (removing === -1) removing = null;
        if (adding   === -1) adding   = null;

        sendEvent(this, '@enumerable:change', [this, removing, adding]);
        if (hasDelta) propertyDidChange(this, 'length');
        propertyDidChange(this, '[]');

        return this ;
      },

      /**
        Converts the enumerable into an array and sorts by the keys
        specified in the argument.

        You may provide multiple arguments to sort by multiple properties.

        @method sortBy
        @param {String} property name(s) to sort on
        @return {Array} The sorted array.
        @since 1.2.0
        */
      sortBy: function() {
        var sortKeys = arguments;
        return this.toArray().sort(function(a, b){
          for(var i = 0; i < sortKeys.length; i++) {
            var key = sortKeys[i],
            propA = get(a, key),
            propB = get(b, key);
            // return 1 or -1 else continue to the next sortKey
            var compareValue = compare(propA, propB);
            if (compareValue) { return compareValue; }
          }
          return 0;
        });
      }
    });

    __exports__["default"] = Enumerable;
  });
define("ember-runtime/mixins/evented",
  ["ember-metal/mixin","ember-metal/events","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Mixin = __dependency1__.Mixin;
    var addListener = __dependency2__.addListener;
    var removeListener = __dependency2__.removeListener;
    var hasListeners = __dependency2__.hasListeners;
    var sendEvent = __dependency2__.sendEvent;

    /**
    @module ember
    @submodule ember-runtime
    */

    /**
      This mixin allows for Ember objects to subscribe to and emit events.

      ```javascript
      App.Person = Ember.Object.extend(Ember.Evented, {
        greet: function() {
          // ...
          this.trigger('greet');
        }
      });

      var person = App.Person.create();

      person.on('greet', function() {
        console.log('Our person has greeted');
      });

      person.greet();

      // outputs: 'Our person has greeted'
      ```

      You can also chain multiple event subscriptions:

      ```javascript
      person.on('greet', function() {
        console.log('Our person has greeted');
      }).one('greet', function() {
        console.log('Offer one-time special');
      }).off('event', this, forgetThis);
      ```

      @class Evented
      @namespace Ember
     */
    var Evented = Mixin.create({

      /**
       Subscribes to a named event with given function.

       ```javascript
       person.on('didLoad', function() {
         // fired once the person has loaded
       });
       ```

       An optional target can be passed in as the 2nd argument that will
       be set as the "this" for the callback. This is a good way to give your
       function access to the object triggering the event. When the target
       parameter is used the callback becomes the third argument.

       @method on
       @param {String} name The name of the event
       @param {Object} [target] The "this" binding for the callback
       @param {Function} method The callback to execute
       @return this
      */
      on: function(name, target, method) {
        addListener(this, name, target, method);
        return this;
      },

      /**
        Subscribes a function to a named event and then cancels the subscription
        after the first time the event is triggered. It is good to use ``one`` when
        you only care about the first time an event has taken place.

        This function takes an optional 2nd argument that will become the "this"
        value for the callback. If this argument is passed then the 3rd argument
        becomes the function.

        @method one
        @param {String} name The name of the event
        @param {Object} [target] The "this" binding for the callback
        @param {Function} method The callback to execute
        @return this
      */
      one: function(name, target, method) {
        if (!method) {
          method = target;
          target = null;
        }

        addListener(this, name, target, method, true);
        return this;
      },

      /**
        Triggers a named event for the object. Any additional arguments
        will be passed as parameters to the functions that are subscribed to the
        event.

        ```javascript
        person.on('didEat', function(food) {
          console.log('person ate some ' + food);
        });

        person.trigger('didEat', 'broccoli');

        // outputs: person ate some broccoli
        ```
        @method trigger
        @param {String} name The name of the event
        @param {Object...} args Optional arguments to pass on
      */
      trigger: function(name) {
        var args = [], i, l;
        for (i = 1, l = arguments.length; i < l; i++) {
          args.push(arguments[i]);
        }
        sendEvent(this, name, args);
      },

      /**
        Cancels subscription for given name, target, and method.

        @method off
        @param {String} name The name of the event
        @param {Object} target The target of the subscription
        @param {Function} method The function of the subscription
        @return this
      */
      off: function(name, target, method) {
        removeListener(this, name, target, method);
        return this;
      },

      /**
        Checks to see if object has any subscriptions for named event.

        @method has
        @param {String} name The name of the event
        @return {Boolean} does the object have a subscription for event
       */
      has: function(name) {
        return hasListeners(this, name);
      }
    });

    __exports__["default"] = Evented;
  });
define("ember-runtime/mixins/freezable",
  ["ember-metal/mixin","ember-metal/property_get","ember-metal/property_set","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Mixin = __dependency1__.Mixin;
    var get = __dependency2__.get;
    var set = __dependency3__.set;

    /**
      The `Ember.Freezable` mixin implements some basic methods for marking an
      object as frozen. Once an object is frozen it should be read only. No changes
      may be made the internal state of the object.

      ## Enforcement

      To fully support freezing in your subclass, you must include this mixin and
      override any method that might alter any property on the object to instead
      raise an exception. You can check the state of an object by checking the
      `isFrozen` property.

      Although future versions of JavaScript may support language-level freezing
      object objects, that is not the case today. Even if an object is freezable,
      it is still technically possible to modify the object, even though it could
      break other parts of your application that do not expect a frozen object to
      change. It is, therefore, very important that you always respect the
      `isFrozen` property on all freezable objects.

      ## Example Usage

      The example below shows a simple object that implement the `Ember.Freezable`
      protocol.

      ```javascript
      Contact = Ember.Object.extend(Ember.Freezable, {
        firstName: null,
        lastName: null,

        // swaps the names
        swapNames: function() {
          if (this.get('isFrozen')) throw Ember.FROZEN_ERROR;
          var tmp = this.get('firstName');
          this.set('firstName', this.get('lastName'));
          this.set('lastName', tmp);
          return this;
        }

      });

      c = Contact.create({ firstName: "John", lastName: "Doe" });
      c.swapNames();  // returns c
      c.freeze();
      c.swapNames();  // EXCEPTION
      ```

      ## Copying

      Usually the `Ember.Freezable` protocol is implemented in cooperation with the
      `Ember.Copyable` protocol, which defines a `frozenCopy()` method that will
      return a frozen object, if the object implements this method as well.

      @class Freezable
      @namespace Ember
      @since Ember 0.9
    */
    var Freezable = Mixin.create({

      /**
        Set to `true` when the object is frozen. Use this property to detect
        whether your object is frozen or not.

        @property isFrozen
        @type Boolean
      */
      isFrozen: false,

      /**
        Freezes the object. Once this method has been called the object should
        no longer allow any properties to be edited.

        @method freeze
        @return {Object} receiver
      */
      freeze: function() {
        if (get(this, 'isFrozen')) return this;
        set(this, 'isFrozen', true);
        return this;
      }

    });

    var FROZEN_ERROR = "Frozen object cannot be modified.";

    __exports__.Freezable = Freezable;
    __exports__.FROZEN_ERROR = FROZEN_ERROR;
  });
define("ember-runtime/mixins/mutable_array",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/error","ember-metal/mixin","ember-runtime/mixins/array","ember-runtime/mixins/mutable_enumerable","ember-runtime/mixins/enumerable","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */


    // require('ember-runtime/mixins/array');
    // require('ember-runtime/mixins/mutable_enumerable');

    // ..........................................................
    // CONSTANTS
    //

    var OUT_OF_RANGE_EXCEPTION = "Index out of range";
    var EMPTY = [];

    // ..........................................................
    // HELPERS
    //

    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var isArray = __dependency3__.isArray;
    var EmberError = __dependency4__["default"];
    var Mixin = __dependency5__.Mixin;
    var required = __dependency5__.required;
    var EmberArray = __dependency6__["default"];
    var MutableEnumerable = __dependency7__["default"];
    var Enumerable = __dependency8__["default"];
    /**
      This mixin defines the API for modifying array-like objects. These methods
      can be applied only to a collection that keeps its items in an ordered set.
      It builds upon the Array mixin and adds methods to modify the array.
      Concrete implementations of this class include ArrayProxy and ArrayController.

      It is important to use the methods in this class to modify arrays so that
      changes are observable. This allows the binding system in Ember to function
      correctly.


      Note that an Array can change even if it does not implement this mixin.
      For example, one might implement a SparseArray that cannot be directly
      modified, but if its underlying enumerable changes, it will change also.

      @class MutableArray
      @namespace Ember
      @uses Ember.Array
      @uses Ember.MutableEnumerable
    */
    var MutableArray = Mixin.create(EmberArray, MutableEnumerable, {

      /**
        __Required.__ You must implement this method to apply this mixin.

        This is one of the primitives you must implement to support `Ember.Array`.
        You should replace amt objects started at idx with the objects in the
        passed array. You should also call `this.enumerableContentDidChange()`

        @method replace
        @param {Number} idx Starting index in the array to replace. If
          idx >= length, then append to the end of the array.
        @param {Number} amt Number of elements that should be removed from
          the array, starting at *idx*.
        @param {Array} objects An array of zero or more objects that should be
          inserted into the array at *idx*
      */
      replace: required(),

      /**
        Remove all elements from the array. This is useful if you
        want to reuse an existing array without having to recreate it.

        ```javascript
        var colors = ["red", "green", "blue"];
        color.length();   //  3
        colors.clear();   //  []
        colors.length();  //  0
        ```

        @method clear
        @return {Ember.Array} An empty Array.
      */
      clear: function () {
        var len = get(this, 'length');
        if (len === 0) return this;
        this.replace(0, len, EMPTY);
        return this;
      },

      /**
        This will use the primitive `replace()` method to insert an object at the
        specified index.

        ```javascript
        var colors = ["red", "green", "blue"];
        colors.insertAt(2, "yellow");  // ["red", "green", "yellow", "blue"]
        colors.insertAt(5, "orange");  // Error: Index out of range
        ```

        @method insertAt
        @param {Number} idx index of insert the object at.
        @param {Object} object object to insert
        @return {Ember.Array} receiver
      */
      insertAt: function(idx, object) {
        if (idx > get(this, 'length')) throw new EmberError(OUT_OF_RANGE_EXCEPTION);
        this.replace(idx, 0, [object]);
        return this;
      },

      /**
        Remove an object at the specified index using the `replace()` primitive
        method. You can pass either a single index, or a start and a length.

        If you pass a start and length that is beyond the
        length this method will throw an `OUT_OF_RANGE_EXCEPTION`.

        ```javascript
        var colors = ["red", "green", "blue", "yellow", "orange"];
        colors.removeAt(0);     // ["green", "blue", "yellow", "orange"]
        colors.removeAt(2, 2);  // ["green", "blue"]
        colors.removeAt(4, 2);  // Error: Index out of range
        ```

        @method removeAt
        @param {Number} start index, start of range
        @param {Number} len length of passing range
        @return {Ember.Array} receiver
      */
      removeAt: function(start, len) {
        if ('number' === typeof start) {

          if ((start < 0) || (start >= get(this, 'length'))) {
            throw new EmberError(OUT_OF_RANGE_EXCEPTION);
          }

          // fast case
          if (len === undefined) len = 1;
          this.replace(start, len, EMPTY);
        }

        return this;
      },

      /**
        Push the object onto the end of the array. Works just like `push()` but it
        is KVO-compliant.

        ```javascript
        var colors = ["red", "green"];
        colors.pushObject("black");     // ["red", "green", "black"]
        colors.pushObject(["yellow"]);  // ["red", "green", ["yellow"]]
        ```

        @method pushObject
        @param {*} obj object to push
        @return object same object passed as a param
      */
      pushObject: function(obj) {
        this.insertAt(get(this, 'length'), obj);
        return obj;
      },

      /**
        Add the objects in the passed numerable to the end of the array. Defers
        notifying observers of the change until all objects are added.

        ```javascript
        var colors = ["red"];
        colors.pushObjects(["yellow", "orange"]);  // ["red", "yellow", "orange"]
        ```

        @method pushObjects
        @param {Ember.Enumerable} objects the objects to add
        @return {Ember.Array} receiver
      */
      pushObjects: function(objects) {
        if (!(Enumerable.detect(objects) || isArray(objects))) {
          throw new TypeError("Must pass Ember.Enumerable to Ember.MutableArray#pushObjects");
        }
        this.replace(get(this, 'length'), 0, objects);
        return this;
      },

      /**
        Pop object from array or nil if none are left. Works just like `pop()` but
        it is KVO-compliant.

        ```javascript
        var colors = ["red", "green", "blue"];
        colors.popObject();   // "blue"
        console.log(colors);  // ["red", "green"]
        ```

        @method popObject
        @return object
      */
      popObject: function() {
        var len = get(this, 'length');
        if (len === 0) return null;

        var ret = this.objectAt(len-1);
        this.removeAt(len-1, 1);
        return ret;
      },

      /**
        Shift an object from start of array or nil if none are left. Works just
        like `shift()` but it is KVO-compliant.

        ```javascript
        var colors = ["red", "green", "blue"];
        colors.shiftObject();  // "red"
        console.log(colors);   // ["green", "blue"]
        ```

        @method shiftObject
        @return object
      */
      shiftObject: function() {
        if (get(this, 'length') === 0) return null;
        var ret = this.objectAt(0);
        this.removeAt(0);
        return ret;
      },

      /**
        Unshift an object to start of array. Works just like `unshift()` but it is
        KVO-compliant.

        ```javascript
        var colors = ["red"];
        colors.unshiftObject("yellow");    // ["yellow", "red"]
        colors.unshiftObject(["black"]);   // [["black"], "yellow", "red"]
        ```

        @method unshiftObject
        @param {*} obj object to unshift
        @return object same object passed as a param
      */
      unshiftObject: function(obj) {
        this.insertAt(0, obj);
        return obj;
      },

      /**
        Adds the named objects to the beginning of the array. Defers notifying
        observers until all objects have been added.

        ```javascript
        var colors = ["red"];
        colors.unshiftObjects(["black", "white"]);   // ["black", "white", "red"]
        colors.unshiftObjects("yellow"); // Type Error: 'undefined' is not a function
        ```

        @method unshiftObjects
        @param {Ember.Enumerable} objects the objects to add
        @return {Ember.Array} receiver
      */
      unshiftObjects: function(objects) {
        this.replace(0, 0, objects);
        return this;
      },

      /**
        Reverse objects in the array. Works just like `reverse()` but it is
        KVO-compliant.

        @method reverseObjects
        @return {Ember.Array} receiver
       */
      reverseObjects: function() {
        var len = get(this, 'length');
        if (len === 0) return this;
        var objects = this.toArray().reverse();
        this.replace(0, len, objects);
        return this;
      },

      /**
        Replace all the the receiver's content with content of the argument.
        If argument is an empty array receiver will be cleared.

        ```javascript
        var colors = ["red", "green", "blue"];
        colors.setObjects(["black", "white"]);  // ["black", "white"]
        colors.setObjects([]);                  // []
        ```

        @method setObjects
        @param {Ember.Array} objects array whose content will be used for replacing
            the content of the receiver
        @return {Ember.Array} receiver with the new content
       */
      setObjects: function(objects) {
        if (objects.length === 0) return this.clear();

        var len = get(this, 'length');
        this.replace(0, len, objects);
        return this;
      },

      // ..........................................................
      // IMPLEMENT Ember.MutableEnumerable
      //

      /**
        Remove all occurances of an object in the array.

        ```javascript
        var cities = ["Chicago", "Berlin", "Lima", "Chicago"];
        cities.removeObject("Chicago");  // ["Berlin", "Lima"]
        cities.removeObject("Lima");     // ["Berlin"]
        cities.removeObject("Tokyo")     // ["Berlin"]
        ```

        @method removeObject
        @param {*} obj object to remove
        @return {Ember.Array} receiver
      */
      removeObject: function(obj) {
        var loc = get(this, 'length') || 0;
        while(--loc >= 0) {
          var curObject = this.objectAt(loc);
          if (curObject === obj) this.removeAt(loc);
        }
        return this;
      },

      /**
        Push the object onto the end of the array if it is not already
        present in the array.

        ```javascript
        var cities = ["Chicago", "Berlin"];
        cities.addObject("Lima");    // ["Chicago", "Berlin", "Lima"]
        cities.addObject("Berlin");  // ["Chicago", "Berlin", "Lima"]
        ```

        @method addObject
        @param {*} obj object to add, if not already present
        @return {Ember.Array} receiver
      */
      addObject: function(obj) {
        if (!this.contains(obj)) this.pushObject(obj);
        return this;
      }

    });

    __exports__["default"] = MutableArray;
  });
define("ember-runtime/mixins/mutable_enumerable",
  ["ember-metal/enumerable_utils","ember-runtime/mixins/enumerable","ember-metal/mixin","ember-metal/property_events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var EnumerableUtils = __dependency1__["default"];
    var Enumerable = __dependency2__["default"];
    var Mixin = __dependency3__.Mixin;
    var required = __dependency3__.required;
    var beginPropertyChanges = __dependency4__.beginPropertyChanges;
    var endPropertyChanges = __dependency4__.endPropertyChanges;

    /**
    @module ember
    @submodule ember-runtime
    */

    var forEach = EnumerableUtils.forEach;

    /**
      This mixin defines the API for modifying generic enumerables. These methods
      can be applied to an object regardless of whether it is ordered or
      unordered.

      Note that an Enumerable can change even if it does not implement this mixin.
      For example, a MappedEnumerable cannot be directly modified but if its
      underlying enumerable changes, it will change also.

      ## Adding Objects

      To add an object to an enumerable, use the `addObject()` method. This
      method will only add the object to the enumerable if the object is not
      already present and is of a type supported by the enumerable.

      ```javascript
      set.addObject(contact);
      ```

      ## Removing Objects

      To remove an object from an enumerable, use the `removeObject()` method. This
      will only remove the object if it is present in the enumerable, otherwise
      this method has no effect.

      ```javascript
      set.removeObject(contact);
      ```

      ## Implementing In Your Own Code

      If you are implementing an object and want to support this API, just include
      this mixin in your class and implement the required methods. In your unit
      tests, be sure to apply the Ember.MutableEnumerableTests to your object.

      @class MutableEnumerable
      @namespace Ember
      @uses Ember.Enumerable
    */
    var MutableEnumerable = Mixin.create(Enumerable, {

      /**
        __Required.__ You must implement this method to apply this mixin.

        Attempts to add the passed object to the receiver if the object is not
        already present in the collection. If the object is present, this method
        has no effect.

        If the passed object is of a type not supported by the receiver,
        then this method should raise an exception.

        @method addObject
        @param {Object} object The object to add to the enumerable.
        @return {Object} the passed object
      */
      addObject: required(Function),

      /**
        Adds each object in the passed enumerable to the receiver.

        @method addObjects
        @param {Ember.Enumerable} objects the objects to add.
        @return {Object} receiver
      */
      addObjects: function(objects) {
        beginPropertyChanges(this);
        forEach(objects, function(obj) { this.addObject(obj); }, this);
        endPropertyChanges(this);
        return this;
      },

      /**
        __Required.__ You must implement this method to apply this mixin.

        Attempts to remove the passed object from the receiver collection if the
        object is present in the collection. If the object is not present,
        this method has no effect.

        If the passed object is of a type not supported by the receiver,
        then this method should raise an exception.

        @method removeObject
        @param {Object} object The object to remove from the enumerable.
        @return {Object} the passed object
      */
      removeObject: required(Function),


      /**
        Removes each object in the passed enumerable from the receiver.

        @method removeObjects
        @param {Ember.Enumerable} objects the objects to remove
        @return {Object} receiver
      */
      removeObjects: function(objects) {
        beginPropertyChanges(this);
        for (var i = objects.length - 1; i >= 0; i--) {
          this.removeObject(objects[i]);
        }
        endPropertyChanges(this);
        return this;
      }
    });

    __exports__["default"] = MutableEnumerable;
  });
define("ember-runtime/mixins/observable",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/get_properties","ember-metal/set_properties","ember-metal/mixin","ember-metal/events","ember-metal/property_events","ember-metal/observer","ember-metal/computed","ember-metal/is_none","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.assert

    var get = __dependency2__.get;
    var getWithDefault = __dependency2__.getWithDefault;
    var set = __dependency3__.set;
    var apply = __dependency4__.apply;
    var getProperties = __dependency5__["default"];
    var setProperties = __dependency6__["default"];
    var Mixin = __dependency7__.Mixin;
    var hasListeners = __dependency8__.hasListeners;
    var beginPropertyChanges = __dependency9__.beginPropertyChanges;
    var propertyWillChange = __dependency9__.propertyWillChange;
    var propertyDidChange = __dependency9__.propertyDidChange;
    var endPropertyChanges = __dependency9__.endPropertyChanges;
    var addObserver = __dependency10__.addObserver;
    var addBeforeObserver = __dependency10__.addBeforeObserver;
    var removeObserver = __dependency10__.removeObserver;
    var observersFor = __dependency10__.observersFor;
    var cacheFor = __dependency11__.cacheFor;
    var isNone = __dependency12__.isNone;


    var slice = Array.prototype.slice;
    /**
      ## Overview

      This mixin provides properties and property observing functionality, core
      features of the Ember object model.

      Properties and observers allow one object to observe changes to a
      property on another object. This is one of the fundamental ways that
      models, controllers and views communicate with each other in an Ember
      application.

      Any object that has this mixin applied can be used in observer
      operations. That includes `Ember.Object` and most objects you will
      interact with as you write your Ember application.

      Note that you will not generally apply this mixin to classes yourself,
      but you will use the features provided by this module frequently, so it
      is important to understand how to use it.

      ## Using `get()` and `set()`

      Because of Ember's support for bindings and observers, you will always
      access properties using the get method, and set properties using the
      set method. This allows the observing objects to be notified and
      computed properties to be handled properly.

      More documentation about `get` and `set` are below.

      ## Observing Property Changes

      You typically observe property changes simply by adding the `observes`
      call to the end of your method declarations in classes that you write.
      For example:

      ```javascript
      Ember.Object.extend({
        valueObserver: function() {
          // Executes whenever the "value" property changes
        }.observes('value')
      });
      ```

      Although this is the most common way to add an observer, this capability
      is actually built into the `Ember.Object` class on top of two methods
      defined in this mixin: `addObserver` and `removeObserver`. You can use
      these two methods to add and remove observers yourself if you need to
      do so at runtime.

      To add an observer for a property, call:

      ```javascript
      object.addObserver('propertyKey', targetObject, targetAction)
      ```

      This will call the `targetAction` method on the `targetObject` whenever
      the value of the `propertyKey` changes.

      Note that if `propertyKey` is a computed property, the observer will be
      called when any of the property dependencies are changed, even if the
      resulting value of the computed property is unchanged. This is necessary
      because computed properties are not computed until `get` is called.

      @class Observable
      @namespace Ember
    */
    var Observable = Mixin.create({

      /**
        Retrieves the value of a property from the object.

        This method is usually similar to using `object[keyName]` or `object.keyName`,
        however it supports both computed properties and the unknownProperty
        handler.

        Because `get` unifies the syntax for accessing all these kinds
        of properties, it can make many refactorings easier, such as replacing a
        simple property with a computed property, or vice versa.

        ### Computed Properties

        Computed properties are methods defined with the `property` modifier
        declared at the end, such as:

        ```javascript
        fullName: function() {
          return this.get('firstName') + ' ' + this.get('lastName');
        }.property('firstName', 'lastName')
        ```

        When you call `get` on a computed property, the function will be
        called and the return value will be returned instead of the function
        itself.

        ### Unknown Properties

        Likewise, if you try to call `get` on a property whose value is
        `undefined`, the `unknownProperty()` method will be called on the object.
        If this method returns any value other than `undefined`, it will be returned
        instead. This allows you to implement "virtual" properties that are
        not defined upfront.

        @method get
        @param {String} keyName The property to retrieve
        @return {Object} The property value or undefined.
      */
      get: function(keyName) {
        return get(this, keyName);
      },

      /**
        To get multiple properties at once, call `getProperties`
        with a list of strings or an array:

        ```javascript
        record.getProperties('firstName', 'lastName', 'zipCode');  // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
        ```

        is equivalent to:

        ```javascript
        record.getProperties(['firstName', 'lastName', 'zipCode']);  // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
        ```

        @method getProperties
        @param {String...|Array} list of keys to get
        @return {Hash}
      */
      getProperties: function() {
        return apply(null, getProperties, [this].concat(slice.call(arguments)));
      },

      /**
        Sets the provided key or path to the value.

        This method is generally very similar to calling `object[key] = value` or
        `object.key = value`, except that it provides support for computed
        properties, the `setUnknownProperty()` method and property observers.

        ### Computed Properties

        If you try to set a value on a key that has a computed property handler
        defined (see the `get()` method for an example), then `set()` will call
        that method, passing both the value and key instead of simply changing
        the value itself. This is useful for those times when you need to
        implement a property that is composed of one or more member
        properties.

        ### Unknown Properties

        If you try to set a value on a key that is undefined in the target
        object, then the `setUnknownProperty()` handler will be called instead. This
        gives you an opportunity to implement complex "virtual" properties that
        are not predefined on the object. If `setUnknownProperty()` returns
        undefined, then `set()` will simply set the value on the object.

        ### Property Observers

        In addition to changing the property, `set()` will also register a property
        change with the object. Unless you have placed this call inside of a
        `beginPropertyChanges()` and `endPropertyChanges(),` any "local" observers
        (i.e. observer methods declared on the same object), will be called
        immediately. Any "remote" observers (i.e. observer methods declared on
        another object) will be placed in a queue and called at a later time in a
        coalesced manner.

        ### Chaining

        In addition to property changes, `set()` returns the value of the object
        itself so you can do chaining like this:

        ```javascript
        record.set('firstName', 'Charles').set('lastName', 'Jolley');
        ```

        @method set
        @param {String} keyName The property to set
        @param {Object} value The value to set or `null`.
        @return {Ember.Observable}
      */
      set: function(keyName, value) {
        set(this, keyName, value);
        return this;
      },


      /**
        Sets a list of properties at once. These properties are set inside
        a single `beginPropertyChanges` and `endPropertyChanges` batch, so
        observers will be buffered.

        ```javascript
        record.setProperties({ firstName: 'Charles', lastName: 'Jolley' });
        ```

        @method setProperties
        @param {Hash} hash the hash of keys and values to set
        @return {Ember.Observable}
      */
      setProperties: function(hash) {
        return setProperties(this, hash);
      },

      /**
        Begins a grouping of property changes.

        You can use this method to group property changes so that notifications
        will not be sent until the changes are finished. If you plan to make a
        large number of changes to an object at one time, you should call this
        method at the beginning of the changes to begin deferring change
        notifications. When you are done making changes, call
        `endPropertyChanges()` to deliver the deferred change notifications and end
        deferring.

        @method beginPropertyChanges
        @return {Ember.Observable}
      */
      beginPropertyChanges: function() {
        beginPropertyChanges();
        return this;
      },

      /**
        Ends a grouping of property changes.

        You can use this method to group property changes so that notifications
        will not be sent until the changes are finished. If you plan to make a
        large number of changes to an object at one time, you should call
        `beginPropertyChanges()` at the beginning of the changes to defer change
        notifications. When you are done making changes, call this method to
        deliver the deferred change notifications and end deferring.

        @method endPropertyChanges
        @return {Ember.Observable}
      */
      endPropertyChanges: function() {
        endPropertyChanges();
        return this;
      },

      /**
        Notify the observer system that a property is about to change.

        Sometimes you need to change a value directly or indirectly without
        actually calling `get()` or `set()` on it. In this case, you can use this
        method and `propertyDidChange()` instead. Calling these two methods
        together will notify all observers that the property has potentially
        changed value.

        Note that you must always call `propertyWillChange` and `propertyDidChange`
        as a pair. If you do not, it may get the property change groups out of
        order and cause notifications to be delivered more often than you would
        like.

        @method propertyWillChange
        @param {String} keyName The property key that is about to change.
        @return {Ember.Observable}
      */
      propertyWillChange: function(keyName) {
        propertyWillChange(this, keyName);
        return this;
      },

      /**
        Notify the observer system that a property has just changed.

        Sometimes you need to change a value directly or indirectly without
        actually calling `get()` or `set()` on it. In this case, you can use this
        method and `propertyWillChange()` instead. Calling these two methods
        together will notify all observers that the property has potentially
        changed value.

        Note that you must always call `propertyWillChange` and `propertyDidChange`
        as a pair. If you do not, it may get the property change groups out of
        order and cause notifications to be delivered more often than you would
        like.

        @method propertyDidChange
        @param {String} keyName The property key that has just changed.
        @return {Ember.Observable}
      */
      propertyDidChange: function(keyName) {
        propertyDidChange(this, keyName);
        return this;
      },

      /**
        Convenience method to call `propertyWillChange` and `propertyDidChange` in
        succession.

        @method notifyPropertyChange
        @param {String} keyName The property key to be notified about.
        @return {Ember.Observable}
      */
      notifyPropertyChange: function(keyName) {
        this.propertyWillChange(keyName);
        this.propertyDidChange(keyName);
        return this;
      },

      addBeforeObserver: function(key, target, method) {
        addBeforeObserver(this, key, target, method);
      },

      /**
        Adds an observer on a property.

        This is the core method used to register an observer for a property.

        Once you call this method, any time the key's value is set, your observer
        will be notified. Note that the observers are triggered any time the
        value is set, regardless of whether it has actually changed. Your
        observer should be prepared to handle that.

        You can also pass an optional context parameter to this method. The
        context will be passed to your observer method whenever it is triggered.
        Note that if you add the same target/method pair on a key multiple times
        with different context parameters, your observer will only be called once
        with the last context you passed.

        ### Observer Methods

        Observer methods you pass should generally have the following signature if
        you do not pass a `context` parameter:

        ```javascript
        fooDidChange: function(sender, key, value, rev) { };
        ```

        The sender is the object that changed. The key is the property that
        changes. The value property is currently reserved and unused. The rev
        is the last property revision of the object when it changed, which you can
        use to detect if the key value has really changed or not.

        If you pass a `context` parameter, the context will be passed before the
        revision like so:

        ```javascript
        fooDidChange: function(sender, key, value, context, rev) { };
        ```

        Usually you will not need the value, context or revision parameters at
        the end. In this case, it is common to write observer methods that take
        only a sender and key value as parameters or, if you aren't interested in
        any of these values, to write an observer that has no parameters at all.

        @method addObserver
        @param {String} key The key to observer
        @param {Object} target The target object to invoke
        @param {String|Function} method The method to invoke.
      */
      addObserver: function(key, target, method) {
        addObserver(this, key, target, method);
      },

      /**
        Remove an observer you have previously registered on this object. Pass
        the same key, target, and method you passed to `addObserver()` and your
        target will no longer receive notifications.

        @method removeObserver
        @param {String} key The key to observer
        @param {Object} target The target object to invoke
        @param {String|Function} method The method to invoke.
      */
      removeObserver: function(key, target, method) {
        removeObserver(this, key, target, method);
      },

      /**
        Returns `true` if the object currently has observers registered for a
        particular key. You can use this method to potentially defer performing
        an expensive action until someone begins observing a particular property
        on the object.

        @method hasObserverFor
        @param {String} key Key to check
        @return {Boolean}
      */
      hasObserverFor: function(key) {
        return hasListeners(this, key+':change');
      },

      /**
        Retrieves the value of a property, or a default value in the case that the
        property returns `undefined`.

        ```javascript
        person.getWithDefault('lastName', 'Doe');
        ```

        @method getWithDefault
        @param {String} keyName The name of the property to retrieve
        @param {Object} defaultValue The value to return if the property value is undefined
        @return {Object} The property value or the defaultValue.
      */
      getWithDefault: function(keyName, defaultValue) {
        return getWithDefault(this, keyName, defaultValue);
      },

      /**
        Set the value of a property to the current value plus some amount.

        ```javascript
        person.incrementProperty('age');
        team.incrementProperty('score', 2);
        ```

        @method incrementProperty
        @param {String} keyName The name of the property to increment
        @param {Number} increment The amount to increment by. Defaults to 1
        @return {Number} The new property value
      */
      incrementProperty: function(keyName, increment) {
        if (isNone(increment)) { increment = 1; }
        Ember.assert("Must pass a numeric value to incrementProperty", (!isNaN(parseFloat(increment)) && isFinite(increment)));
        set(this, keyName, (parseFloat(get(this, keyName)) || 0) + increment);
        return get(this, keyName);
      },

      /**
        Set the value of a property to the current value minus some amount.

        ```javascript
        player.decrementProperty('lives');
        orc.decrementProperty('health', 5);
        ```

        @method decrementProperty
        @param {String} keyName The name of the property to decrement
        @param {Number} decrement The amount to decrement by. Defaults to 1
        @return {Number} The new property value
      */
      decrementProperty: function(keyName, decrement) {
        if (isNone(decrement)) { decrement = 1; }
        Ember.assert("Must pass a numeric value to decrementProperty", (!isNaN(parseFloat(decrement)) && isFinite(decrement)));
        set(this, keyName, (get(this, keyName) || 0) - decrement);
        return get(this, keyName);
      },

      /**
        Set the value of a boolean property to the opposite of it's
        current value.

        ```javascript
        starship.toggleProperty('warpDriveEngaged');
        ```

        @method toggleProperty
        @param {String} keyName The name of the property to toggle
        @return {Object} The new property value
      */
      toggleProperty: function(keyName) {
        set(this, keyName, !get(this, keyName));
        return get(this, keyName);
      },

      /**
        Returns the cached value of a computed property, if it exists.
        This allows you to inspect the value of a computed property
        without accidentally invoking it if it is intended to be
        generated lazily.

        @method cacheFor
        @param {String} keyName
        @return {Object} The cached value of the computed property, if any
      */
      cacheFor: function(keyName) {
        return cacheFor(this, keyName);
      },

      // intended for debugging purposes
      observersForKey: function(keyName) {
        return observersFor(this, keyName);
      }
    });

    __exports__["default"] = Observable;
  });
define("ember-runtime/mixins/promise_proxy",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/computed","ember-metal/mixin","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var computed = __dependency3__.computed;
    var Mixin = __dependency4__.Mixin;
    var EmberError = __dependency5__["default"];

    var not = computed.not, or = computed.or;

    /**
      @module ember
      @submodule ember-runtime
     */

    function tap(proxy, promise) {
      set(proxy, 'isFulfilled', false);
      set(proxy, 'isRejected', false);

      return promise.then(function(value) {
        set(proxy, 'isFulfilled', true);
        set(proxy, 'content', value);
        return value;
      }, function(reason) {
        set(proxy, 'isRejected', true);
        set(proxy, 'reason', reason);
        throw reason;
      }, "Ember: PromiseProxy");
    }

    /**
      A low level mixin making ObjectProxy, ObjectController or ArrayController's promise aware.

      ```javascript
      var ObjectPromiseController = Ember.ObjectController.extend(Ember.PromiseProxyMixin);

      var controller = ObjectPromiseController.create({
        promise: $.getJSON('/some/remote/data.json')
      });

      controller.then(function(json){
         // the json
      }, function(reason) {
         // the reason why you have no json
      });
      ```

      the controller has bindable attributes which
      track the promises life cycle

      ```javascript
      controller.get('isPending')   //=> true
      controller.get('isSettled')  //=> false
      controller.get('isRejected')  //=> false
      controller.get('isFulfilled') //=> false
      ```

      When the the $.getJSON completes, and the promise is fulfilled
      with json, the life cycle attributes will update accordingly.

      ```javascript
      controller.get('isPending')   //=> false
      controller.get('isSettled')   //=> true
      controller.get('isRejected')  //=> false
      controller.get('isFulfilled') //=> true
      ```

      As the controller is an ObjectController, and the json now its content,
      all the json properties will be available directly from the controller.

      ```javascript
      // Assuming the following json:
      {
        firstName: 'Stefan',
        lastName: 'Penner'
      }

      // both properties will accessible on the controller
      controller.get('firstName') //=> 'Stefan'
      controller.get('lastName')  //=> 'Penner'
      ```

      If the controller is backing a template, the attributes are
      bindable from within that template

      ```handlebars
      {{#if isPending}}
        loading...
      {{else}}
        firstName: {{firstName}}
        lastName: {{lastName}}
      {{/if}}
      ```
      @class Ember.PromiseProxyMixin
    */
    var PromiseProxyMixin = Mixin.create({
      /**
        If the proxied promise is rejected this will contain the reason
        provided.

        @property reason
        @default null
      */
      reason:    null,

      /**
        Once the proxied promise has settled this will become `false`.

        @property isPending
        @default true
      */
      isPending:  not('isSettled').readOnly(),

      /**
        Once the proxied promise has settled this will become `true`.

        @property isSettled
        @default false
      */
      isSettled:  or('isRejected', 'isFulfilled').readOnly(),

      /**
        Will become `true` if the proxied promise is rejected.

        @property isRejected
        @default false
      */
      isRejected:  false,

      /**
        Will become `true` if the proxied promise is fulfilled.

        @property isFullfilled
        @default false
      */
      isFulfilled: false,

      /**
        The promise whose fulfillment value is being proxied by this object.

        This property must be specified upon creation, and should not be
        changed once created.

        Example:

        ```javascript
        Ember.ObjectController.extend(Ember.PromiseProxyMixin).create({
          promise: <thenable>
        });
        ```

        @property promise
      */
      promise: computed(function(key, promise) {
        if (arguments.length === 2) {
          return tap(this, promise);
        } else {
          throw new EmberError("PromiseProxy's promise must be set");
        }
      }),

      /**
        An alias to the proxied promise's `then`.

        See RSVP.Promise.then.

        @method then
        @param {Function} callback
        @return {RSVP.Promise}
      */
      then: promiseAlias('then'),

      /**
        An alias to the proxied promise's `catch`.

        See RSVP.Promise.catch.

        @method catch
        @param {Function} callback
        @return {RSVP.Promise}
        @since 1.3.0
      */
      'catch': promiseAlias('catch'),

      /**
        An alias to the proxied promise's `finally`.

        See RSVP.Promise.finally.

        @method finally
        @param {Function} callback
        @return {RSVP.Promise}
        @since 1.3.0
      */
      'finally': promiseAlias('finally')

    });

    function promiseAlias(name) {
      return function () {
        var promise = get(this, 'promise');
        return promise[name].apply(promise, arguments);
      };
    }

    __exports__["default"] = PromiseProxyMixin;
  });
define("ember-runtime/mixins/sortable",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/enumerable_utils","ember-metal/mixin","ember-runtime/mixins/mutable_enumerable","ember-runtime/compare","ember-metal/observer","ember-metal/computed","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.assert, Ember.A

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var EnumerableUtils = __dependency4__["default"];
    var Mixin = __dependency5__.Mixin;
    var MutableEnumerable = __dependency6__["default"];
    var compare = __dependency7__["default"];
    var addObserver = __dependency8__.addObserver;
    var removeObserver = __dependency8__.removeObserver;
    var computed = __dependency9__.computed;
    var beforeObserver = __dependency5__.beforeObserver;
    var observer = __dependency5__.observer;
    //ES6TODO: should we access these directly from their package or from how thier exposed in ember-metal?

    var forEach = EnumerableUtils.forEach;

    /**
      `Ember.SortableMixin` provides a standard interface for array proxies
      to specify a sort order and maintain this sorting when objects are added,
      removed, or updated without changing the implicit order of their underlying
      content array:

      ```javascript
      songs = [
        {trackNumber: 4, title: 'Ob-La-Di, Ob-La-Da'},
        {trackNumber: 2, title: 'Back in the U.S.S.R.'},
        {trackNumber: 3, title: 'Glass Onion'},
      ];

      songsController = Ember.ArrayController.create({
        content: songs,
        sortProperties: ['trackNumber'],
        sortAscending: true
      });

      songsController.get('firstObject');  // {trackNumber: 2, title: 'Back in the U.S.S.R.'}

      songsController.addObject({trackNumber: 1, title: 'Dear Prudence'});
      songsController.get('firstObject');  // {trackNumber: 1, title: 'Dear Prudence'}
      ```

      If you add or remove the properties to sort by or change the sort direction the content
      sort order will be automatically updated.

      ```javascript
      songsController.set('sortProperties', ['title']);
      songsController.get('firstObject'); // {trackNumber: 2, title: 'Back in the U.S.S.R.'}

      songsController.toggleProperty('sortAscending');
      songsController.get('firstObject'); // {trackNumber: 4, title: 'Ob-La-Di, Ob-La-Da'}
      ```

      SortableMixin works by sorting the arrangedContent array, which is the array that
      arrayProxy displays. Due to the fact that the underlying 'content' array is not changed, that
      array will not display the sorted list:

       ```javascript
      songsController.get('content').get('firstObject'); // Returns the unsorted original content
      songsController.get('firstObject'); // Returns the sorted content.
      ```

      Although the sorted content can also be accessed through the arrangedContent property,
      it is preferable to use the proxied class and not the arrangedContent array directly.

      @class SortableMixin
      @namespace Ember
      @uses Ember.MutableEnumerable
    */
    var SortableMixin = Mixin.create(MutableEnumerable, {

      /**
        Specifies which properties dictate the arrangedContent's sort order.

        When specifying multiple properties the sorting will use properties
        from the `sortProperties` array prioritized from first to last.

        @property {Array} sortProperties
      */
      sortProperties: null,

      /**
        Specifies the arrangedContent's sort direction.
        Sorts the content in ascending order by default. Set to `false` to
        use descending order.

        @property {Boolean} sortAscending
        @default true
      */
      sortAscending: true,

      /**
        The function used to compare two values. You can override this if you
        want to do custom comparisons. Functions must be of the type expected by
        Array#sort, i.e.
          return 0 if the two parameters are equal,
          return a negative value if the first parameter is smaller than the second or
          return a positive value otherwise:

        ```javascript
        function(x,y) { // These are assumed to be integers
          if (x === y)
            return 0;
          return x < y ? -1 : 1;
        }
        ```

        @property sortFunction
        @type {Function}
        @default Ember.compare
      */
      sortFunction: compare,

      orderBy: function(item1, item2) {
        var result = 0,
            sortProperties = get(this, 'sortProperties'),
            sortAscending = get(this, 'sortAscending'),
            sortFunction = get(this, 'sortFunction');

        Ember.assert("you need to define `sortProperties`", !!sortProperties);

        forEach(sortProperties, function(propertyName) {
          if (result === 0) {
            result = sortFunction.call(this, get(item1, propertyName), get(item2, propertyName));
            if ((result !== 0) && !sortAscending) {
              result = (-1) * result;
            }
          }
        }, this);

        return result;
      },

      destroy: function() {
        var content = get(this, 'content'),
            sortProperties = get(this, 'sortProperties');

        if (content && sortProperties) {
          forEach(content, function(item) {
            forEach(sortProperties, function(sortProperty) {
              removeObserver(item, sortProperty, this, 'contentItemSortPropertyDidChange');
            }, this);
          }, this);
        }

        return this._super();
      },

      isSorted: computed.notEmpty('sortProperties'),

      /**
        Overrides the default arrangedContent from arrayProxy in order to sort by sortFunction.
        Also sets up observers for each sortProperty on each item in the content Array.

        @property arrangedContent
      */

      arrangedContent: computed('content', 'sortProperties.@each', function(key, value) {
        var content = get(this, 'content'),
            isSorted = get(this, 'isSorted'),
            sortProperties = get(this, 'sortProperties'),
            self = this;

        if (content && isSorted) {
          content = content.slice();
          content.sort(function(item1, item2) {
            return self.orderBy(item1, item2);
          });
          forEach(content, function(item) {
            forEach(sortProperties, function(sortProperty) {
              addObserver(item, sortProperty, this, 'contentItemSortPropertyDidChange');
            }, this);
          }, this);
          return Ember.A(content);
        }

        return content;
      }),

      _contentWillChange: beforeObserver('content', function() {
        var content = get(this, 'content'),
            sortProperties = get(this, 'sortProperties');

        if (content && sortProperties) {
          forEach(content, function(item) {
            forEach(sortProperties, function(sortProperty) {
              removeObserver(item, sortProperty, this, 'contentItemSortPropertyDidChange');
            }, this);
          }, this);
        }

        this._super();
      }),

      sortPropertiesWillChange: beforeObserver('sortProperties', function() {
        this._lastSortAscending = undefined;
      }),

      sortPropertiesDidChange: observer('sortProperties', function() {
        this._lastSortAscending = undefined;
      }),

      sortAscendingWillChange: beforeObserver('sortAscending', function() {
        this._lastSortAscending = get(this, 'sortAscending');
      }),

      sortAscendingDidChange: observer('sortAscending', function() {
        if (this._lastSortAscending !== undefined && get(this, 'sortAscending') !== this._lastSortAscending) {
          var arrangedContent = get(this, 'arrangedContent');
          arrangedContent.reverseObjects();
        }
      }),

      contentArrayWillChange: function(array, idx, removedCount, addedCount) {
        var isSorted = get(this, 'isSorted');

        if (isSorted) {
          var arrangedContent = get(this, 'arrangedContent');
          var removedObjects = array.slice(idx, idx+removedCount);
          var sortProperties = get(this, 'sortProperties');

          forEach(removedObjects, function(item) {
            arrangedContent.removeObject(item);

            forEach(sortProperties, function(sortProperty) {
              removeObserver(item, sortProperty, this, 'contentItemSortPropertyDidChange');
            }, this);
          }, this);
        }

        return this._super(array, idx, removedCount, addedCount);
      },

      contentArrayDidChange: function(array, idx, removedCount, addedCount) {
        var isSorted = get(this, 'isSorted'),
            sortProperties = get(this, 'sortProperties');

        if (isSorted) {
          var addedObjects = array.slice(idx, idx+addedCount);

          forEach(addedObjects, function(item) {
            this.insertItemSorted(item);

            forEach(sortProperties, function(sortProperty) {
              addObserver(item, sortProperty, this, 'contentItemSortPropertyDidChange');
            }, this);
          }, this);
        }

        return this._super(array, idx, removedCount, addedCount);
      },

      insertItemSorted: function(item) {
        var arrangedContent = get(this, 'arrangedContent');
        var length = get(arrangedContent, 'length');

        var idx = this._binarySearch(item, 0, length);
        arrangedContent.insertAt(idx, item);
      },

      contentItemSortPropertyDidChange: function(item) {
        var arrangedContent = get(this, 'arrangedContent'),
            oldIndex = arrangedContent.indexOf(item),
            leftItem = arrangedContent.objectAt(oldIndex - 1),
            rightItem = arrangedContent.objectAt(oldIndex + 1),
            leftResult = leftItem && this.orderBy(item, leftItem),
            rightResult = rightItem && this.orderBy(item, rightItem);

        if (leftResult < 0 || rightResult > 0) {
          arrangedContent.removeObject(item);
          this.insertItemSorted(item);
        }
      },

      _binarySearch: function(item, low, high) {
        var mid, midItem, res, arrangedContent;

        if (low === high) {
          return low;
        }

        arrangedContent = get(this, 'arrangedContent');

        mid = low + Math.floor((high - low) / 2);
        midItem = arrangedContent.objectAt(mid);

        res = this.orderBy(midItem, item);

        if (res < 0) {
          return this._binarySearch(item, mid+1, high);
        } else if (res > 0) {
          return this._binarySearch(item, low, mid);
        }

        return mid;
      }
    });

    __exports__["default"] = SortableMixin;
  });
define("ember-runtime/mixins/target_action_support",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/mixin","ember-metal/computed","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.lookup, Ember.assert

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var typeOf = __dependency4__.typeOf;
    var Mixin = __dependency5__.Mixin;
    var computed = __dependency6__.computed;

    /**
    `Ember.TargetActionSupport` is a mixin that can be included in a class
    to add a `triggerAction` method with semantics similar to the Handlebars
    `{{action}}` helper. In normal Ember usage, the `{{action}}` helper is
    usually the best choice. This mixin is most often useful when you are
    doing more complex event handling in View objects.

    See also `Ember.ViewTargetActionSupport`, which has
    view-aware defaults for target and actionContext.

    @class TargetActionSupport
    @namespace Ember
    @extends Ember.Mixin
    */
    var TargetActionSupport = Mixin.create({
      target: null,
      action: null,
      actionContext: null,

      targetObject: computed(function() {
        var target = get(this, 'target');

        if (typeOf(target) === "string") {
          var value = get(this, target);
          if (value === undefined) { value = get(Ember.lookup, target); }
          return value;
        } else {
          return target;
        }
      }).property('target'),

      actionContextObject: computed(function() {
        var actionContext = get(this, 'actionContext');

        if (typeOf(actionContext) === "string") {
          var value = get(this, actionContext);
          if (value === undefined) { value = get(Ember.lookup, actionContext); }
          return value;
        } else {
          return actionContext;
        }
      }).property('actionContext'),

      /**
      Send an `action` with an `actionContext` to a `target`. The action, actionContext
      and target will be retrieved from properties of the object. For example:

      ```javascript
      App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
        target: Ember.computed.alias('controller'),
        action: 'save',
        actionContext: Ember.computed.alias('context'),
        click: function() {
          this.triggerAction(); // Sends the `save` action, along with the current context
                                // to the current controller
        }
      });
      ```

      The `target`, `action`, and `actionContext` can be provided as properties of
      an optional object argument to `triggerAction` as well.

      ```javascript
      App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
        click: function() {
          this.triggerAction({
            action: 'save',
            target: this.get('controller'),
            actionContext: this.get('context'),
          }); // Sends the `save` action, along with the current context
              // to the current controller
        }
      });
      ```

      The `actionContext` defaults to the object you are mixing `TargetActionSupport` into.
      But `target` and `action` must be specified either as properties or with the argument
      to `triggerAction`, or a combination:

      ```javascript
      App.SaveButtonView = Ember.View.extend(Ember.TargetActionSupport, {
        target: Ember.computed.alias('controller'),
        click: function() {
          this.triggerAction({
            action: 'save'
          }); // Sends the `save` action, along with a reference to `this`,
              // to the current controller
        }
      });
      ```

      @method triggerAction
      @param opts {Hash} (optional, with the optional keys action, target and/or actionContext)
      @return {Boolean} true if the action was sent successfully and did not return false
      */
      triggerAction: function(opts) {
        opts = opts || {};
        var action = opts.action || get(this, 'action'),
            target = opts.target || get(this, 'targetObject'),
            actionContext = opts.actionContext;

        function args(options, actionName) {
          var ret = [];
          if (actionName) { ret.push(actionName); }

          return ret.concat(options);
        }

        if (typeof actionContext === 'undefined') {
          actionContext = get(this, 'actionContextObject') || this;
        }

        if (target && action) {
          var ret;

          if (target.send) {
            ret = target.send.apply(target, args(actionContext, action));
          } else {
            Ember.assert("The action '" + action + "' did not exist on " + target, typeof target[action] === 'function');
            ret = target[action].apply(target, args(actionContext));
          }

          if (ret !== false) ret = true;

          return ret;
        } else {
          return false;
        }
      }
    });

    __exports__["default"] = TargetActionSupport;
  });
define("ember-runtime/system/application",
  ["ember-runtime/system/namespace","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Namespace = __dependency1__["default"];

    var Application = Namespace.extend();
    __exports__["default"] = Application;
  });
define("ember-runtime/system/array_proxy",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/computed","ember-metal/mixin","ember-metal/property_events","ember-metal/error","ember-runtime/system/object","ember-runtime/mixins/mutable_array","ember-runtime/mixins/enumerable","ember-runtime/system/string","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K, Ember.assert
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var isArray = __dependency4__.isArray;
    var apply = __dependency4__.apply;
    var computed = __dependency5__.computed;
    var beforeObserver = __dependency6__.beforeObserver;
    var observer = __dependency6__.observer;
    var beginPropertyChanges = __dependency7__.beginPropertyChanges;
    var endPropertyChanges = __dependency7__.endPropertyChanges;
    var EmberError = __dependency8__["default"];
    var EmberObject = __dependency9__["default"];var MutableArray = __dependency10__["default"];var Enumerable = __dependency11__["default"];
    var fmt = __dependency12__.fmt;

    /**
    @module ember
    @submodule ember-runtime
    */

    var OUT_OF_RANGE_EXCEPTION = "Index out of range";
    var EMPTY = [];
    var alias = computed.alias;
    var K = Ember.K;

    /**
      An ArrayProxy wraps any other object that implements `Ember.Array` and/or
      `Ember.MutableArray,` forwarding all requests. This makes it very useful for
      a number of binding use cases or other cases where being able to swap
      out the underlying array is useful.

      A simple example of usage:

      ```javascript
      var pets = ['dog', 'cat', 'fish'];
      var ap = Ember.ArrayProxy.create({ content: Ember.A(pets) });

      ap.get('firstObject');                        // 'dog'
      ap.set('content', ['amoeba', 'paramecium']);
      ap.get('firstObject');                        // 'amoeba'
      ```

      This class can also be useful as a layer to transform the contents of
      an array, as they are accessed. This can be done by overriding
      `objectAtContent`:

      ```javascript
      var pets = ['dog', 'cat', 'fish'];
      var ap = Ember.ArrayProxy.create({
          content: Ember.A(pets),
          objectAtContent: function(idx) {
              return this.get('content').objectAt(idx).toUpperCase();
          }
      });

      ap.get('firstObject'); // . 'DOG'
      ```

      @class ArrayProxy
      @namespace Ember
      @extends Ember.Object
      @uses Ember.MutableArray
    */
    var ArrayProxy = EmberObject.extend(MutableArray, {

      /**
        The content array. Must be an object that implements `Ember.Array` and/or
        `Ember.MutableArray.`

        @property content
        @type Ember.Array
      */
      content: null,

      /**
       The array that the proxy pretends to be. In the default `ArrayProxy`
       implementation, this and `content` are the same. Subclasses of `ArrayProxy`
       can override this property to provide things like sorting and filtering.

       @property arrangedContent
      */
      arrangedContent: alias('content'),

      /**
        Should actually retrieve the object at the specified index from the
        content. You can override this method in subclasses to transform the
        content item to something new.

        This method will only be called if content is non-`null`.

        @method objectAtContent
        @param {Number} idx The index to retrieve.
        @return {Object} the value or undefined if none found
      */
      objectAtContent: function(idx) {
        return get(this, 'arrangedContent').objectAt(idx);
      },

      /**
        Should actually replace the specified objects on the content array.
        You can override this method in subclasses to transform the content item
        into something new.

        This method will only be called if content is non-`null`.

        @method replaceContent
        @param {Number} idx The starting index
        @param {Number} amt The number of items to remove from the content.
        @param {Array} objects Optional array of objects to insert or null if no
          objects.
        @return {void}
      */
      replaceContent: function(idx, amt, objects) {
        get(this, 'content').replace(idx, amt, objects);
      },

      /**
        Invoked when the content property is about to change. Notifies observers that the
        entire array content will change.

        @private
        @method _contentWillChange
      */
      _contentWillChange: beforeObserver('content', function() {
        this._teardownContent();
      }),

      _teardownContent: function() {
        var content = get(this, 'content');

        if (content) {
          content.removeArrayObserver(this, {
            willChange: 'contentArrayWillChange',
            didChange: 'contentArrayDidChange'
          });
        }
      },

      contentArrayWillChange: K,
      contentArrayDidChange: K,

      /**
        Invoked when the content property changes. Notifies observers that the
        entire array content has changed.

        @private
        @method _contentDidChange
      */
      _contentDidChange: observer('content', function() {
        var content = get(this, 'content');

        Ember.assert("Can't set ArrayProxy's content to itself", content !== this);

        this._setupContent();
      }),

      _setupContent: function() {
        var content = get(this, 'content');

        if (content) {
          Ember.assert(fmt('ArrayProxy expects an Array or ' +
            'Ember.ArrayProxy, but you passed %@', [typeof content]),
            isArray(content) || content.isDestroyed);

          content.addArrayObserver(this, {
            willChange: 'contentArrayWillChange',
            didChange: 'contentArrayDidChange'
          });
        }
      },

      _arrangedContentWillChange: beforeObserver('arrangedContent', function() {
        var arrangedContent = get(this, 'arrangedContent'),
            len = arrangedContent ? get(arrangedContent, 'length') : 0;

        this.arrangedContentArrayWillChange(this, 0, len, undefined);
        this.arrangedContentWillChange(this);

        this._teardownArrangedContent(arrangedContent);
      }),

      _arrangedContentDidChange: observer('arrangedContent', function() {
        var arrangedContent = get(this, 'arrangedContent'),
            len = arrangedContent ? get(arrangedContent, 'length') : 0;

        Ember.assert("Can't set ArrayProxy's content to itself", arrangedContent !== this);

        this._setupArrangedContent();

        this.arrangedContentDidChange(this);
        this.arrangedContentArrayDidChange(this, 0, undefined, len);
      }),

      _setupArrangedContent: function() {
        var arrangedContent = get(this, 'arrangedContent');

        if (arrangedContent) {
          Ember.assert(fmt('ArrayProxy expects an Array or ' +
            'Ember.ArrayProxy, but you passed %@', [typeof arrangedContent]),
            isArray(arrangedContent) || arrangedContent.isDestroyed);

          arrangedContent.addArrayObserver(this, {
            willChange: 'arrangedContentArrayWillChange',
            didChange: 'arrangedContentArrayDidChange'
          });
        }
      },

      _teardownArrangedContent: function() {
        var arrangedContent = get(this, 'arrangedContent');

        if (arrangedContent) {
          arrangedContent.removeArrayObserver(this, {
            willChange: 'arrangedContentArrayWillChange',
            didChange: 'arrangedContentArrayDidChange'
          });
        }
      },

      arrangedContentWillChange: K,
      arrangedContentDidChange: K,

      objectAt: function(idx) {
        return get(this, 'content') && this.objectAtContent(idx);
      },

      length: computed(function() {
        var arrangedContent = get(this, 'arrangedContent');
        return arrangedContent ? get(arrangedContent, 'length') : 0;
        // No dependencies since Enumerable notifies length of change
      }),

      _replace: function(idx, amt, objects) {
        var content = get(this, 'content');
        Ember.assert('The content property of '+ this.constructor + ' should be set before modifying it', content);
        if (content) this.replaceContent(idx, amt, objects);
        return this;
      },

      replace: function() {
        if (get(this, 'arrangedContent') === get(this, 'content')) {
          apply(this, this._replace, arguments);
        } else {
          throw new EmberError("Using replace on an arranged ArrayProxy is not allowed.");
        }
      },

      _insertAt: function(idx, object) {
        if (idx > get(this, 'content.length')) throw new EmberError(OUT_OF_RANGE_EXCEPTION);
        this._replace(idx, 0, [object]);
        return this;
      },

      insertAt: function(idx, object) {
        if (get(this, 'arrangedContent') === get(this, 'content')) {
          return this._insertAt(idx, object);
        } else {
          throw new EmberError("Using insertAt on an arranged ArrayProxy is not allowed.");
        }
      },

      removeAt: function(start, len) {
        if ('number' === typeof start) {
          var content = get(this, 'content'),
              arrangedContent = get(this, 'arrangedContent'),
              indices = [], i;

          if ((start < 0) || (start >= get(this, 'length'))) {
            throw new EmberError(OUT_OF_RANGE_EXCEPTION);
          }

          if (len === undefined) len = 1;

          // Get a list of indices in original content to remove
          for (i=start; i<start+len; i++) {
            // Use arrangedContent here so we avoid confusion with objects transformed by objectAtContent
            indices.push(content.indexOf(arrangedContent.objectAt(i)));
          }

          // Replace in reverse order since indices will change
          indices.sort(function(a,b) { return b - a; });

          beginPropertyChanges();
          for (i=0; i<indices.length; i++) {
            this._replace(indices[i], 1, EMPTY);
          }
          endPropertyChanges();
        }

        return this ;
      },

      pushObject: function(obj) {
        this._insertAt(get(this, 'content.length'), obj) ;
        return obj ;
      },

      pushObjects: function(objects) {
        if (!(Enumerable.detect(objects) || isArray(objects))) {
          throw new TypeError("Must pass Ember.Enumerable to Ember.MutableArray#pushObjects");
        }
        this._replace(get(this, 'length'), 0, objects);
        return this;
      },

      setObjects: function(objects) {
        if (objects.length === 0) return this.clear();

        var len = get(this, 'length');
        this._replace(0, len, objects);
        return this;
      },

      unshiftObject: function(obj) {
        this._insertAt(0, obj) ;
        return obj ;
      },

      unshiftObjects: function(objects) {
        this._replace(0, 0, objects);
        return this;
      },

      slice: function() {
        var arr = this.toArray();
        return arr.slice.apply(arr, arguments);
      },

      arrangedContentArrayWillChange: function(item, idx, removedCnt, addedCnt) {
        this.arrayContentWillChange(idx, removedCnt, addedCnt);
      },

      arrangedContentArrayDidChange: function(item, idx, removedCnt, addedCnt) {
        this.arrayContentDidChange(idx, removedCnt, addedCnt);
      },

      init: function() {
        this._super();
        this._setupContent();
        this._setupArrangedContent();
      },

      willDestroy: function() {
        this._teardownArrangedContent();
        this._teardownContent();
      }
    });

    __exports__["default"] = ArrayProxy;
  });
define("ember-runtime/system/container",
  ["ember-metal/property_set","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var set = __dependency1__["default"];

    var Container = requireModule('container')["default"];
    Container.set = set;

    __exports__["default"] = Container;
  });
define("ember-runtime/system/core_object",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/platform","ember-metal/watching","ember-metal/chains","ember-metal/events","ember-metal/mixin","ember-metal/enumerable_utils","ember-metal/error","ember-runtime/keys","ember-runtime/mixins/action_handler","ember-metal/properties","ember-metal/binding","ember-metal/computed","ember-metal/run_loop","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __exports__) {
    "use strict";
    /**
      @module ember
      @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.ENV.MANDATORY_SETTER, Ember.assert, Ember.K, Ember.config

    // NOTE: this object should never be included directly. Instead use `Ember.Object`.
    // We only define this separately so that `Ember.Set` can depend on it.
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var guidFor = __dependency4__.guidFor;
    var apply = __dependency4__.apply;
    var create = __dependency5__.create;
    var generateGuid = __dependency4__.generateGuid;
    var GUID_KEY = __dependency4__.GUID_KEY;
    var meta = __dependency4__.meta;
    var META_KEY = __dependency4__.META_KEY;
    var makeArray = __dependency4__.makeArray;
    var rewatch = __dependency6__.rewatch;
    var finishChains = __dependency7__.finishChains;
    var sendEvent = __dependency8__.sendEvent;
    var IS_BINDING = __dependency9__.IS_BINDING;
    var Mixin = __dependency9__.Mixin;
    var required = __dependency9__.required;
    var EnumerableUtils = __dependency10__["default"];
    var EmberError = __dependency11__["default"];
    var platform = __dependency5__.platform;
    var keys = __dependency12__["default"];
    var ActionHandler = __dependency13__["default"];
    var defineProperty = __dependency14__.defineProperty;
    var Binding = __dependency15__.Binding;
    var ComputedProperty = __dependency16__.ComputedProperty;
    var run = __dependency17__["default"];
    var destroy = __dependency6__.destroy;


    var o_create = create,
        o_defineProperty = platform.defineProperty,
        schedule = run.schedule,
        applyMixin = Mixin._apply,
        finishPartial = Mixin.finishPartial,
        reopen = Mixin.prototype.reopen,
        MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER,
        indexOf = EnumerableUtils.indexOf,
        K = Ember.K;

    var undefinedDescriptor = {
      configurable: true,
      writable: true,
      enumerable: false,
      value: undefined
    };

    var nullDescriptor = {
      configurable: true,
      writable: true,
      enumerable: false,
      value: null
    };

    function makeCtor() {

      // Note: avoid accessing any properties on the object since it makes the
      // method a lot faster. This is glue code so we want it to be as fast as
      // possible.

      var wasApplied = false, initMixins, initProperties;

      var Class = function() {
        if (!wasApplied) {
          Class.proto(); // prepare prototype...
        }
        o_defineProperty(this, GUID_KEY, nullDescriptor);
        o_defineProperty(this, '__nextSuper', undefinedDescriptor);
        var m = meta(this), proto = m.proto;
        m.proto = this;
        if (initMixins) {
          // capture locally so we can clear the closed over variable
          var mixins = initMixins;
          initMixins = null;
          apply(this, this.reopen, mixins);
        }
        if (initProperties) {
          // capture locally so we can clear the closed over variable
          var props = initProperties;
          initProperties = null;

          var concatenatedProperties = this.concatenatedProperties;

          for (var i = 0, l = props.length; i < l; i++) {
            var properties = props[i];

            Ember.assert("Ember.Object.create no longer supports mixing in other definitions, use createWithMixins instead.", !(properties instanceof Mixin));

            if (typeof properties !== 'object' && properties !== undefined) {
              throw new EmberError("Ember.Object.create only accepts objects.");
            }

            if (!properties) { continue; }

            var keyNames = keys(properties);

            for (var j = 0, ll = keyNames.length; j < ll; j++) {
              var keyName = keyNames[j];
              if (!properties.hasOwnProperty(keyName)) { continue; }

              var value = properties[keyName];

              if (IS_BINDING.test(keyName)) {
                var bindings = m.bindings;
                if (!bindings) {
                  bindings = m.bindings = {};
                } else if (!m.hasOwnProperty('bindings')) {
                  bindings = m.bindings = o_create(m.bindings);
                }
                bindings[keyName] = value;
              }

              var desc = m.descs[keyName];

              Ember.assert("Ember.Object.create no longer supports defining computed properties. Define computed properties using extend() or reopen() before calling create().", !(value instanceof ComputedProperty));
              Ember.assert("Ember.Object.create no longer supports defining methods that call _super.", !(typeof value === 'function' && value.toString().indexOf('._super') !== -1));
              Ember.assert("`actions` must be provided at extend time, not at create " +
                           "time, when Ember.ActionHandler is used (i.e. views, " +
                           "controllers & routes).", !((keyName === 'actions') && ActionHandler.detect(this)));

              if (concatenatedProperties && indexOf(concatenatedProperties, keyName) >= 0) {
                var baseValue = this[keyName];

                if (baseValue) {
                  if ('function' === typeof baseValue.concat) {
                    value = baseValue.concat(value);
                  } else {
                    value = makeArray(baseValue).concat(value);
                  }
                } else {
                  value = makeArray(value);
                }
              }

              if (desc) {
                desc.set(this, keyName, value);
              } else {
                if (typeof this.setUnknownProperty === 'function' && !(keyName in this)) {
                  this.setUnknownProperty(keyName, value);
                } else if (MANDATORY_SETTER) {
                  defineProperty(this, keyName, null, value); // setup mandatory setter
                } else {
                  this[keyName] = value;
                }
              }
            }
          }
        }
        finishPartial(this, m);
        apply(this, this.init, arguments);
        m.proto = proto;
        finishChains(this);
        sendEvent(this, "init");
      };

      Class.toString = Mixin.prototype.toString;
      Class.willReopen = function() {
        if (wasApplied) {
          Class.PrototypeMixin = Mixin.create(Class.PrototypeMixin);
        }

        wasApplied = false;
      };
      Class._initMixins = function(args) { initMixins = args; };
      Class._initProperties = function(args) { initProperties = args; };

      Class.proto = function() {
        var superclass = Class.superclass;
        if (superclass) { superclass.proto(); }

        if (!wasApplied) {
          wasApplied = true;
          Class.PrototypeMixin.applyPartial(Class.prototype);
          rewatch(Class.prototype);
        }

        return this.prototype;
      };

      return Class;

    }

    /**
      @class CoreObject
      @namespace Ember
    */
    var CoreObject = makeCtor();
    CoreObject.toString = function() { return "Ember.CoreObject"; };

    CoreObject.PrototypeMixin = Mixin.create({
      reopen: function() {
        applyMixin(this, arguments, true);
        return this;
      },

      /**
        An overridable method called when objects are instantiated. By default,
        does nothing unless it is overridden during class definition.

        Example:

        ```javascript
        App.Person = Ember.Object.extend({
          init: function() {
            alert('Name is ' + this.get('name'));
          }
        });

        var steve = App.Person.create({
          name: "Steve"
        });

        // alerts 'Name is Steve'.
        ```

        NOTE: If you do override `init` for a framework class like `Ember.View` or
        `Ember.ArrayController`, be sure to call `this._super()` in your
        `init` declaration! If you don't, Ember may not have an opportunity to
        do important setup work, and you'll see strange behavior in your
        application.

        @method init
      */
      init: function() {},

      /**
        Defines the properties that will be concatenated from the superclass
        (instead of overridden).

        By default, when you extend an Ember class a property defined in
        the subclass overrides a property with the same name that is defined
        in the superclass. However, there are some cases where it is preferable
        to build up a property's value by combining the superclass' property
        value with the subclass' value. An example of this in use within Ember
        is the `classNames` property of `Ember.View`.

        Here is some sample code showing the difference between a concatenated
        property and a normal one:

        ```javascript
        App.BarView = Ember.View.extend({
          someNonConcatenatedProperty: ['bar'],
          classNames: ['bar']
        });

        App.FooBarView = App.BarView.extend({
          someNonConcatenatedProperty: ['foo'],
          classNames: ['foo'],
        });

        var fooBarView = App.FooBarView.create();
        fooBarView.get('someNonConcatenatedProperty'); // ['foo']
        fooBarView.get('classNames'); // ['ember-view', 'bar', 'foo']
        ```

        This behavior extends to object creation as well. Continuing the
        above example:

        ```javascript
        var view = App.FooBarView.create({
          someNonConcatenatedProperty: ['baz'],
          classNames: ['baz']
        })
        view.get('someNonConcatenatedProperty'); // ['baz']
        view.get('classNames'); // ['ember-view', 'bar', 'foo', 'baz']
        ```
        Adding a single property that is not an array will just add it in the array:

        ```javascript
        var view = App.FooBarView.create({
          classNames: 'baz'
        })
        view.get('classNames'); // ['ember-view', 'bar', 'foo', 'baz']
        ```

        Using the `concatenatedProperties` property, we can tell to Ember that mix
        the content of the properties.

        In `Ember.View` the `classNameBindings` and `attributeBindings` properties
        are also concatenated, in addition to `classNames`.

        This feature is available for you to use throughout the Ember object model,
        although typical app developers are likely to use it infrequently. Since
        it changes expectations about behavior of properties, you should properly
        document its usage in each individual concatenated property (to not
        mislead your users to think they can override the property in a subclass).

        @property concatenatedProperties
        @type Array
        @default null
      */
      concatenatedProperties: null,

      /**
        Destroyed object property flag.

        if this property is `true` the observers and bindings were already
        removed by the effect of calling the `destroy()` method.

        @property isDestroyed
        @default false
      */
      isDestroyed: false,

      /**
        Destruction scheduled flag. The `destroy()` method has been called.

        The object stays intact until the end of the run loop at which point
        the `isDestroyed` flag is set.

        @property isDestroying
        @default false
      */
      isDestroying: false,

      /**
        Destroys an object by setting the `isDestroyed` flag and removing its
        metadata, which effectively destroys observers and bindings.

        If you try to set a property on a destroyed object, an exception will be
        raised.

        Note that destruction is scheduled for the end of the run loop and does not
        happen immediately.  It will set an isDestroying flag immediately.

        @method destroy
        @return {Ember.Object} receiver
      */
      destroy: function() {
        if (this.isDestroying) { return; }
        this.isDestroying = true;

        schedule('actions', this, this.willDestroy);
        schedule('destroy', this, this._scheduledDestroy);
        return this;
      },

      /**
        Override to implement teardown.

        @method willDestroy
       */
      willDestroy: K,

      /**
        Invoked by the run loop to actually destroy the object. This is
        scheduled for execution by the `destroy` method.

        @private
        @method _scheduledDestroy
      */
      _scheduledDestroy: function() {
        if (this.isDestroyed) { return; }
        destroy(this);
        this.isDestroyed = true;
      },

      bind: function(to, from) {
        if (!(from instanceof Binding)) { from = Binding.from(from); }
        from.to(to).connect(this);
        return from;
      },

      /**
        Returns a string representation which attempts to provide more information
        than Javascript's `toString` typically does, in a generic way for all Ember
        objects.

        ```javascript
        App.Person = Em.Object.extend()
        person = App.Person.create()
        person.toString() //=> "<App.Person:ember1024>"
        ```

        If the object's class is not defined on an Ember namespace, it will
        indicate it is a subclass of the registered superclass:

       ```javascript
        Student = App.Person.extend()
        student = Student.create()
        student.toString() //=> "<(subclass of App.Person):ember1025>"
        ```

        If the method `toStringExtension` is defined, its return value will be
        included in the output.

        ```javascript
        App.Teacher = App.Person.extend({
          toStringExtension: function() {
            return this.get('fullName');
          }
        });
        teacher = App.Teacher.create()
        teacher.toString(); //=> "<App.Teacher:ember1026:Tom Dale>"
        ```

        @method toString
        @return {String} string representation
      */
      toString: function toString() {
        var hasToStringExtension = typeof this.toStringExtension === 'function',
            extension = hasToStringExtension ? ":" + this.toStringExtension() : '';
        var ret = '<'+this.constructor.toString()+':'+guidFor(this)+extension+'>';
        this.toString = makeToString(ret);
        return ret;
      }
    });

    CoreObject.PrototypeMixin.ownerConstructor = CoreObject;

    function makeToString(ret) {
      return function() { return ret; };
    }

    if (Ember.config.overridePrototypeMixin) {
      Ember.config.overridePrototypeMixin(CoreObject.PrototypeMixin);
    }

    CoreObject.__super__ = null;

    var ClassMixin = Mixin.create({

      ClassMixin: required(),

      PrototypeMixin: required(),

      isClass: true,

      isMethod: false,

      /**
        Creates a new subclass.

        ```javascript
        App.Person = Ember.Object.extend({
          say: function(thing) {
            alert(thing);
           }
        });
        ```

        This defines a new subclass of Ember.Object: `App.Person`. It contains one method: `say()`.

        You can also create a subclass from any existing class by calling its `extend()`  method. For example, you might want to create a subclass of Ember's built-in `Ember.View` class:

        ```javascript
        App.PersonView = Ember.View.extend({
          tagName: 'li',
          classNameBindings: ['isAdministrator']
        });
        ```

        When defining a subclass, you can override methods but still access the implementation of your parent class by calling the special `_super()` method:

        ```javascript
        App.Person = Ember.Object.extend({
          say: function(thing) {
            var name = this.get('name');
            alert(name + ' says: ' + thing);
          }
        });

        App.Soldier = App.Person.extend({
          say: function(thing) {
            this._super(thing + ", sir!");
          },
          march: function(numberOfHours) {
            alert(this.get('name') + ' marches for ' + numberOfHours + ' hours.')
          }
        });

        var yehuda = App.Soldier.create({
          name: "Yehuda Katz"
        });

        yehuda.say("Yes");  // alerts "Yehuda Katz says: Yes, sir!"
        ```

        The `create()` on line #17 creates an *instance* of the `App.Soldier` class. The `extend()` on line #8 creates a *subclass* of `App.Person`. Any instance of the `App.Person` class will *not* have the `march()` method.

        You can also pass `Mixin` classes to add additional properties to the subclass.

        ```javascript
        App.Person = Ember.Object.extend({
          say: function(thing) {
            alert(this.get('name') + ' says: ' + thing);
          }
        });

        App.SingingMixin = Mixin.create({
          sing: function(thing){
            alert(this.get('name') + ' sings: la la la ' + thing);
          }
        });

        App.BroadwayStar = App.Person.extend(App.SingingMixin, {
          dance: function() {
            alert(this.get('name') + ' dances: tap tap tap tap ');
          }
        });
        ```

        The `App.BroadwayStar` class contains three methods: `say()`, `sing()`, and `dance()`.

        @method extend
        @static

        @param {Mixin} [mixins]* One or more Mixin classes
        @param {Object} [arguments]* Object containing values to use within the new class
      */
      extend: function() {
        var Class = makeCtor(), proto;
        Class.ClassMixin = Mixin.create(this.ClassMixin);
        Class.PrototypeMixin = Mixin.create(this.PrototypeMixin);

        Class.ClassMixin.ownerConstructor = Class;
        Class.PrototypeMixin.ownerConstructor = Class;

        reopen.apply(Class.PrototypeMixin, arguments);

        Class.superclass = this;
        Class.__super__  = this.prototype;

        proto = Class.prototype = o_create(this.prototype);
        proto.constructor = Class;
        generateGuid(proto);
        meta(proto).proto = proto; // this will disable observers on prototype

        Class.ClassMixin.apply(Class);
        return Class;
      },

      /**
        Equivalent to doing `extend(arguments).create()`.
        If possible use the normal `create` method instead.

        @method createWithMixins
        @static
        @param [arguments]*
      */
      createWithMixins: function() {
        var C = this;
        if (arguments.length>0) { this._initMixins(arguments); }
        return new C();
      },

      /**
        Creates an instance of a class. Accepts either no arguments, or an object
        containing values to initialize the newly instantiated object with.

        ```javascript
        App.Person = Ember.Object.extend({
          helloWorld: function() {
            alert("Hi, my name is " + this.get('name'));
          }
        });

        var tom = App.Person.create({
          name: 'Tom Dale'
        });

        tom.helloWorld(); // alerts "Hi, my name is Tom Dale".
        ```

        `create` will call the `init` function if defined during
        `Ember.AnyObject.extend`

        If no arguments are passed to `create`, it will not set values to the new
        instance during initialization:

        ```javascript
        var noName = App.Person.create();
        noName.helloWorld(); // alerts undefined
        ```

        NOTE: For performance reasons, you cannot declare methods or computed
        properties during `create`. You should instead declare methods and computed
        properties when using `extend` or use the `createWithMixins` shorthand.

        @method create
        @static
        @param [arguments]*
      */
      create: function() {
        var C = this;
        if (arguments.length>0) { this._initProperties(arguments); }
        return new C();
      },

      /**
        Augments a constructor's prototype with additional
        properties and functions:

        ```javascript
        MyObject = Ember.Object.extend({
          name: 'an object'
        });

        o = MyObject.create();
        o.get('name'); // 'an object'

        MyObject.reopen({
          say: function(msg){
            console.log(msg);
          }
        })

        o2 = MyObject.create();
        o2.say("hello"); // logs "hello"

        o.say("goodbye"); // logs "goodbye"
        ```

        To add functions and properties to the constructor itself,
        see `reopenClass`

        @method reopen
      */
      reopen: function() {
        this.willReopen();
        apply(this.PrototypeMixin, reopen, arguments);
        return this;
      },

      /**
        Augments a constructor's own properties and functions:

        ```javascript
        MyObject = Ember.Object.extend({
          name: 'an object'
        });

        MyObject.reopenClass({
          canBuild: false
        });

        MyObject.canBuild; // false
        o = MyObject.create();
        ```

        In other words, this creates static properties and functions for the class. These are only available on the class
        and not on any instance of that class.

        ```javascript
        App.Person = Ember.Object.extend({
          name : "",
          sayHello : function(){
            alert("Hello. My name is " + this.get('name'));
          }
        });

        App.Person.reopenClass({
          species : "Homo sapiens",
          createPerson: function(newPersonsName){
            return App.Person.create({
              name:newPersonsName
            });
          }
        });

        var tom = App.Person.create({
          name : "Tom Dale"
        });
        var yehuda = App.Person.createPerson("Yehuda Katz");

        tom.sayHello(); // "Hello. My name is Tom Dale"
        yehuda.sayHello(); // "Hello. My name is Yehuda Katz"
        alert(App.Person.species); // "Homo sapiens"
        ```

        Note that `species` and `createPerson` are *not* valid on the `tom` and `yehuda`
        variables. They are only valid on `App.Person`.

        To add functions and properties to instances of
        a constructor by extending the constructor's prototype
        see `reopen`

        @method reopenClass
      */
      reopenClass: function() {
        apply(this.ClassMixin, reopen, arguments);
        applyMixin(this, arguments, false);
        return this;
      },

      detect: function(obj) {
        if ('function' !== typeof obj) { return false; }
        while(obj) {
          if (obj===this) { return true; }
          obj = obj.superclass;
        }
        return false;
      },

      detectInstance: function(obj) {
        return obj instanceof this;
      },

      /**
        In some cases, you may want to annotate computed properties with additional
        metadata about how they function or what values they operate on. For
        example, computed property functions may close over variables that are then
        no longer available for introspection.

        You can pass a hash of these values to a computed property like this:

        ```javascript
        person: function() {
          var personId = this.get('personId');
          return App.Person.create({ id: personId });
        }.property().meta({ type: App.Person })
        ```

        Once you've done this, you can retrieve the values saved to the computed
        property from your class like this:

        ```javascript
        MyClass.metaForProperty('person');
        ```

        This will return the original hash that was passed to `meta()`.

        @method metaForProperty
        @param key {String} property name
      */
      metaForProperty: function(key) {
        var meta = this.proto()[META_KEY],
            desc = meta && meta.descs[key];

        Ember.assert("metaForProperty() could not find a computed property with key '"+key+"'.", !!desc && desc instanceof ComputedProperty);
        return desc._meta || {};
      },

      /**
        Iterate over each computed property for the class, passing its name
        and any associated metadata (see `metaForProperty`) to the callback.

        @method eachComputedProperty
        @param {Function} callback
        @param {Object} binding
      */
      eachComputedProperty: function(callback, binding) {
        var proto = this.proto(),
            descs = meta(proto).descs,
            empty = {},
            property;

        for (var name in descs) {
          property = descs[name];

          if (property instanceof ComputedProperty) {
            callback.call(binding || this, name, property._meta || empty);
          }
        }
      }

    });

    ClassMixin.ownerConstructor = CoreObject;

    if (Ember.config.overrideClassMixin) {
      Ember.config.overrideClassMixin(ClassMixin);
    }

    CoreObject.ClassMixin = ClassMixin;
    ClassMixin.apply(CoreObject);

    __exports__["default"] = CoreObject;
  });
define("ember-runtime/system/deferred",
  ["ember-runtime/mixins/deferred","ember-metal/property_get","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var DeferredMixin = __dependency1__["default"];
    var get = __dependency2__.get;
    var EmberObject = __dependency3__["default"];

    var Deferred = EmberObject.extend(DeferredMixin);

    Deferred.reopenClass({
      promise: function(callback, binding) {
        var deferred = Deferred.create();
        callback.call(binding, deferred);
        return deferred;
      }
    });

    __exports__["default"] = Deferred;
  });
define("ember-runtime/system/each_proxy",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/enumerable_utils","ember-metal/array","ember-runtime/mixins/array","ember-runtime/system/object","ember-metal/computed","ember-metal/observer","ember-metal/events","ember-metal/properties","ember-metal/property_events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var Ember = __dependency1__["default"];
    // Ember.assert

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var guidFor = __dependency4__.guidFor;
    var EnumerableUtils = __dependency5__["default"];
    var indexOf = __dependency6__.indexOf;
    var EmberArray = __dependency7__["default"];
    // ES6TODO: WAT? Circular dep?
    var EmberObject = __dependency8__["default"];
    var computed = __dependency9__.computed;
    var addObserver = __dependency10__.addObserver;
    var addBeforeObserver = __dependency10__.addBeforeObserver;
    var removeBeforeObserver = __dependency10__.removeBeforeObserver;
    var removeObserver = __dependency10__.removeObserver;
    var typeOf = __dependency4__.typeOf;
    var watchedEvents = __dependency11__.watchedEvents;
    var defineProperty = __dependency12__.defineProperty;
    var beginPropertyChanges = __dependency13__.beginPropertyChanges;
    var propertyDidChange = __dependency13__.propertyDidChange;
    var propertyWillChange = __dependency13__.propertyWillChange;
    var endPropertyChanges = __dependency13__.endPropertyChanges;
    var changeProperties = __dependency13__.changeProperties;

    var forEach = EnumerableUtils.forEach;

    var EachArray = EmberObject.extend(EmberArray, {

      init: function(content, keyName, owner) {
        this._super();
        this._keyName = keyName;
        this._owner   = owner;
        this._content = content;
      },

      objectAt: function(idx) {
        var item = this._content.objectAt(idx);
        return item && get(item, this._keyName);
      },

      length: computed(function() {
        var content = this._content;
        return content ? get(content, 'length') : 0;
      })

    });

    var IS_OBSERVER = /^.+:(before|change)$/;

    function addObserverForContentKey(content, keyName, proxy, idx, loc) {
      var objects = proxy._objects, guid;
      if (!objects) objects = proxy._objects = {};

      while(--loc>=idx) {
        var item = content.objectAt(loc);
        if (item) {
          Ember.assert('When using @each to observe the array ' + content + ', the array must return an object', typeOf(item) === 'instance' || typeOf(item) === 'object');
          addBeforeObserver(item, keyName, proxy, 'contentKeyWillChange');
          addObserver(item, keyName, proxy, 'contentKeyDidChange');

          // keep track of the index each item was found at so we can map
          // it back when the obj changes.
          guid = guidFor(item);
          if (!objects[guid]) objects[guid] = [];
          objects[guid].push(loc);
        }
      }
    }

    function removeObserverForContentKey(content, keyName, proxy, idx, loc) {
      var objects = proxy._objects;
      if (!objects) objects = proxy._objects = {};
      var indicies, guid;

      while(--loc>=idx) {
        var item = content.objectAt(loc);
        if (item) {
          removeBeforeObserver(item, keyName, proxy, 'contentKeyWillChange');
          removeObserver(item, keyName, proxy, 'contentKeyDidChange');

          guid = guidFor(item);
          indicies = objects[guid];
          indicies[indexOf.call(indicies, loc)] = null;
        }
      }
    }

    /**
      This is the object instance returned when you get the `@each` property on an
      array. It uses the unknownProperty handler to automatically create
      EachArray instances for property names.

      @private
      @class EachProxy
      @namespace Ember
      @extends Ember.Object
    */
    var EachProxy = EmberObject.extend({

      init: function(content) {
        this._super();
        this._content = content;
        content.addArrayObserver(this);

        // in case someone is already observing some keys make sure they are
        // added
        forEach(watchedEvents(this), function(eventName) {
          this.didAddListener(eventName);
        }, this);
      },

      /**
        You can directly access mapped properties by simply requesting them.
        The `unknownProperty` handler will generate an EachArray of each item.

        @method unknownProperty
        @param keyName {String}
        @param value {*}
      */
      unknownProperty: function(keyName, value) {
        var ret;
        ret = new EachArray(this._content, keyName, this);
        defineProperty(this, keyName, null, ret);
        this.beginObservingContentKey(keyName);
        return ret;
      },

      // ..........................................................
      // ARRAY CHANGES
      // Invokes whenever the content array itself changes.

      arrayWillChange: function(content, idx, removedCnt, addedCnt) {
        var keys = this._keys, key, lim;

        lim = removedCnt>0 ? idx+removedCnt : -1;
        beginPropertyChanges(this);

        for(key in keys) {
          if (!keys.hasOwnProperty(key)) { continue; }

          if (lim>0) { removeObserverForContentKey(content, key, this, idx, lim); }

          propertyWillChange(this, key);
        }

        propertyWillChange(this._content, '@each');
        endPropertyChanges(this);
      },

      arrayDidChange: function(content, idx, removedCnt, addedCnt) {
        var keys = this._keys, lim;

        lim = addedCnt>0 ? idx+addedCnt : -1;
        changeProperties(function() {
          for(var key in keys) {
            if (!keys.hasOwnProperty(key)) { continue; }

            if (lim>0) { addObserverForContentKey(content, key, this, idx, lim); }

            propertyDidChange(this, key);
          }

          propertyDidChange(this._content, '@each');
        }, this);
      },

      // ..........................................................
      // LISTEN FOR NEW OBSERVERS AND OTHER EVENT LISTENERS
      // Start monitoring keys based on who is listening...

      didAddListener: function(eventName) {
        if (IS_OBSERVER.test(eventName)) {
          this.beginObservingContentKey(eventName.slice(0, -7));
        }
      },

      didRemoveListener: function(eventName) {
        if (IS_OBSERVER.test(eventName)) {
          this.stopObservingContentKey(eventName.slice(0, -7));
        }
      },

      // ..........................................................
      // CONTENT KEY OBSERVING
      // Actual watch keys on the source content.

      beginObservingContentKey: function(keyName) {
        var keys = this._keys;
        if (!keys) keys = this._keys = {};
        if (!keys[keyName]) {
          keys[keyName] = 1;
          var content = this._content,
              len = get(content, 'length');
          addObserverForContentKey(content, keyName, this, 0, len);
        } else {
          keys[keyName]++;
        }
      },

      stopObservingContentKey: function(keyName) {
        var keys = this._keys;
        if (keys && (keys[keyName]>0) && (--keys[keyName]<=0)) {
          var content = this._content,
              len     = get(content, 'length');
          removeObserverForContentKey(content, keyName, this, 0, len);
        }
      },

      contentKeyWillChange: function(obj, keyName) {
        propertyWillChange(this, keyName);
      },

      contentKeyDidChange: function(obj, keyName) {
        propertyDidChange(this, keyName);
      }

    });

    __exports__.EachArray = EachArray;
    __exports__.EachProxy = EachProxy;
  });
define("ember-runtime/system/lazy_load",
  ["ember-metal/core","ember-metal/array","ember-runtime/system/native_array","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /*globals CustomEvent */

    var Ember = __dependency1__["default"];
    // Ember.ENV.EMBER_LOAD_HOOKS
    var forEach = __dependency2__.forEach;
    // make sure Ember.A is setup.

    /**
      @module ember
      @submodule ember-runtime
    */

    var loadHooks = Ember.ENV.EMBER_LOAD_HOOKS || {};
    var loaded = {};

    /**
      Detects when a specific package of Ember (e.g. 'Ember.Handlebars')
      has fully loaded and is available for extension.

      The provided `callback` will be called with the `name` passed
      resolved from a string into the object:

      ``` javascript
      Ember.onLoad('Ember.Handlebars' function(hbars) {
        hbars.registerHelper(...);
      });
      ```

      @method onLoad
      @for Ember
      @param name {String} name of hook
      @param callback {Function} callback to be called
    */
    function onLoad(name, callback) {
      var object;

      loadHooks[name] = loadHooks[name] || Ember.A();
      loadHooks[name].pushObject(callback);

      if (object = loaded[name]) {
        callback(object);
      }
    };

    /**
      Called when an Ember.js package (e.g Ember.Handlebars) has finished
      loading. Triggers any callbacks registered for this event.

      @method runLoadHooks
      @for Ember
      @param name {String} name of hook
      @param object {Object} object to pass to callbacks
    */
    function runLoadHooks(name, object) {
      loaded[name] = object;

      if (typeof window === 'object' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === "function") {
        var event = new CustomEvent(name, {detail: object, name: name});
        window.dispatchEvent(event);
      }

      if (loadHooks[name]) {
        forEach.call(loadHooks[name], function(callback) {
          callback(object);
        });
      }
    };

    __exports__.onLoad = onLoad;
    __exports__.runLoadHooks = runLoadHooks;
  });
define("ember-runtime/system/namespace",
  ["ember-metal/core","ember-metal/property_get","ember-metal/array","ember-metal/utils","ember-metal/mixin","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    // Ember.lookup, Ember.BOOTED, Ember.deprecate, Ember.NAME_KEY, Ember.anyUnprocessedMixins
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var indexOf = __dependency3__.indexOf;
    var GUID_KEY = __dependency4__.GUID_KEY;
    var guidFor = __dependency4__.guidFor;
    var Mixin = __dependency5__.Mixin;

    var EmberObject = __dependency6__["default"];

    /**
      A Namespace is an object usually used to contain other objects or methods
      such as an application or framework. Create a namespace anytime you want
      to define one of these new containers.

      # Example Usage

      ```javascript
      MyFramework = Ember.Namespace.create({
        VERSION: '1.0.0'
      });
      ```

      @class Namespace
      @namespace Ember
      @extends Ember.Object
    */
    var Namespace = EmberObject.extend({
      isNamespace: true,

      init: function() {
        Namespace.NAMESPACES.push(this);
        Namespace.PROCESSED = false;
      },

      toString: function() {
        var name = get(this, 'name');
        if (name) { return name; }

        findNamespaces();
        return this[NAME_KEY];
      },

      nameClasses: function() {
        processNamespace([this.toString()], this, {});
      },

      destroy: function() {
        var namespaces = Namespace.NAMESPACES,
            toString = this.toString();

        if (toString) {
          Ember.lookup[toString] = undefined;
          delete Namespace.NAMESPACES_BY_ID[toString];
        }
        namespaces.splice(indexOf.call(namespaces, this), 1);
        this._super();
      }
    });

    Namespace.reopenClass({
      NAMESPACES: [Ember],
      NAMESPACES_BY_ID: {},
      PROCESSED: false,
      processAll: processAllNamespaces,
      byName: function(name) {
        if (!Ember.BOOTED) {
          processAllNamespaces();
        }

        return NAMESPACES_BY_ID[name];
      }
    });

    var NAMESPACES_BY_ID = Namespace.NAMESPACES_BY_ID;

    var hasOwnProp = ({}).hasOwnProperty;

    function processNamespace(paths, root, seen) {
      var idx = paths.length;

      NAMESPACES_BY_ID[paths.join('.')] = root;

      // Loop over all of the keys in the namespace, looking for classes
      for(var key in root) {
        if (!hasOwnProp.call(root, key)) { continue; }
        var obj = root[key];

        // If we are processing the `Ember` namespace, for example, the
        // `paths` will start with `["Ember"]`. Every iteration through
        // the loop will update the **second** element of this list with
        // the key, so processing `Ember.View` will make the Array
        // `['Ember', 'View']`.
        paths[idx] = key;

        // If we have found an unprocessed class
        if (obj && obj.toString === classToString) {
          // Replace the class' `toString` with the dot-separated path
          // and set its `NAME_KEY`
          obj.toString = makeToString(paths.join('.'));
          obj[NAME_KEY] = paths.join('.');

        // Support nested namespaces
        } else if (obj && obj.isNamespace) {
          // Skip aliased namespaces
          if (seen[guidFor(obj)]) { continue; }
          seen[guidFor(obj)] = true;

          // Process the child namespace
          processNamespace(paths, obj, seen);
        }
      }

      paths.length = idx; // cut out last item
    }

    var STARTS_WITH_UPPERCASE = /^[A-Z]/;

    function findNamespaces() {
      var lookup = Ember.lookup, obj, isNamespace;

      if (Namespace.PROCESSED) { return; }

      for (var prop in lookup) {
        // Only process entities that start with uppercase A-Z
        if (!STARTS_WITH_UPPERCASE.test(prop)) { continue; }

        // Unfortunately, some versions of IE don't support window.hasOwnProperty
        if (lookup.hasOwnProperty && !lookup.hasOwnProperty(prop)) { continue; }

        // At times we are not allowed to access certain properties for security reasons.
        // There are also times where even if we can access them, we are not allowed to access their properties.
        try {
          obj = lookup[prop];
          isNamespace = obj && obj.isNamespace;
        } catch (e) {
          continue;
        }

        if (isNamespace) {
          obj[NAME_KEY] = prop;
        }
      }
    }

    var NAME_KEY = Ember.NAME_KEY = GUID_KEY + '_name';

    function superClassString(mixin) {
      var superclass = mixin.superclass;
      if (superclass) {
        if (superclass[NAME_KEY]) { return superclass[NAME_KEY]; }
        else { return superClassString(superclass); }
      } else {
        return;
      }
    }

    function classToString() {
      if (!Ember.BOOTED && !this[NAME_KEY]) {
        processAllNamespaces();
      }

      var ret;

      if (this[NAME_KEY]) {
        ret = this[NAME_KEY];
      } else if (this._toString) {
        ret = this._toString;
      } else {
        var str = superClassString(this);
        if (str) {
          ret = "(subclass of " + str + ")";
        } else {
          ret = "(unknown mixin)";
        }
        this.toString = makeToString(ret);
      }

      return ret;
    }

    function processAllNamespaces() {
      var unprocessedNamespaces = !Namespace.PROCESSED,
          unprocessedMixins = Ember.anyUnprocessedMixins;

      if (unprocessedNamespaces) {
        findNamespaces();
        Namespace.PROCESSED = true;
      }

      if (unprocessedNamespaces || unprocessedMixins) {
        var namespaces = Namespace.NAMESPACES, namespace;
        for (var i=0, l=namespaces.length; i<l; i++) {
          namespace = namespaces[i];
          processNamespace([namespace.toString()], namespace, {});
        }

        Ember.anyUnprocessedMixins = false;
      }
    }

    function makeToString(ret) {
      return function() { return ret; };
    }

    Mixin.prototype.toString = classToString; // ES6TODO: altering imported objects. SBB.

    __exports__["default"] = Namespace;
  });
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
define("ember-runtime/system/object",
  ["ember-runtime/system/core_object","ember-runtime/mixins/observable","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */

    var CoreObject = __dependency1__["default"];
    var Observable = __dependency2__["default"];

    /**
      `Ember.Object` is the main base class for all Ember objects. It is a subclass
      of `Ember.CoreObject` with the `Ember.Observable` mixin applied. For details,
      see the documentation for each of these.

      @class Object
      @namespace Ember
      @extends Ember.CoreObject
      @uses Ember.Observable
    */
    var EmberObject = CoreObject.extend(Observable);
    EmberObject.toString = function() { return "Ember.Object"; };

    __exports__["default"] = EmberObject;
  });
define("ember-runtime/system/object_proxy",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/observer","ember-metal/property_events","ember-metal/computed","ember-metal/properties","ember-metal/mixin","ember-runtime/system/string","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.assert
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var meta = __dependency4__.meta;
    var addObserver = __dependency5__.addObserver;
    var removeObserver = __dependency5__.removeObserver;
    var addBeforeObserver = __dependency5__.addBeforeObserver;
    var removeBeforeObserver = __dependency5__.removeBeforeObserver;
    var propertyWillChange = __dependency6__.propertyWillChange;
    var propertyDidChange = __dependency6__.propertyDidChange;
    var computed = __dependency7__.computed;
    var defineProperty = __dependency8__.defineProperty;
    var observer = __dependency9__.observer;
    var fmt = __dependency10__.fmt;
    var EmberObject = __dependency11__["default"];

    function contentPropertyWillChange(content, contentKey) {
      var key = contentKey.slice(8); // remove "content."
      if (key in this) { return; }  // if shadowed in proxy
      propertyWillChange(this, key);
    }

    function contentPropertyDidChange(content, contentKey) {
      var key = contentKey.slice(8); // remove "content."
      if (key in this) { return; } // if shadowed in proxy
      propertyDidChange(this, key);
    }

    /**
      `Ember.ObjectProxy` forwards all properties not defined by the proxy itself
      to a proxied `content` object.

      ```javascript
      object = Ember.Object.create({
        name: 'Foo'
      });

      proxy = Ember.ObjectProxy.create({
        content: object
      });

      // Access and change existing properties
      proxy.get('name')          // 'Foo'
      proxy.set('name', 'Bar');
      object.get('name')         // 'Bar'

      // Create new 'description' property on `object`
      proxy.set('description', 'Foo is a whizboo baz');
      object.get('description')  // 'Foo is a whizboo baz'
      ```

      While `content` is unset, setting a property to be delegated will throw an
      Error.

      ```javascript
      proxy = Ember.ObjectProxy.create({
        content: null,
        flag: null
      });
      proxy.set('flag', true);
      proxy.get('flag');         // true
      proxy.get('foo');          // undefined
      proxy.set('foo', 'data');  // throws Error
      ```

      Delegated properties can be bound to and will change when content is updated.

      Computed properties on the proxy itself can depend on delegated properties.

      ```javascript
      ProxyWithComputedProperty = Ember.ObjectProxy.extend({
        fullName: function () {
          var firstName = this.get('firstName'),
              lastName = this.get('lastName');
          if (firstName && lastName) {
            return firstName + ' ' + lastName;
          }
          return firstName || lastName;
        }.property('firstName', 'lastName')
      });

      proxy = ProxyWithComputedProperty.create();

      proxy.get('fullName');  // undefined
      proxy.set('content', {
        firstName: 'Tom', lastName: 'Dale'
      }); // triggers property change for fullName on proxy

      proxy.get('fullName');  // 'Tom Dale'
      ```

      @class ObjectProxy
      @namespace Ember
      @extends Ember.Object
    */
    var ObjectProxy = EmberObject.extend({
      /**
        The object whose properties will be forwarded.

        @property content
        @type Ember.Object
        @default null
      */
      content: null,
      _contentDidChange: observer('content', function() {
        Ember.assert("Can't set ObjectProxy's content to itself", get(this, 'content') !== this);
      }),

      isTruthy: computed.bool('content'),

      _debugContainerKey: null,

      willWatchProperty: function (key) {
        var contentKey = 'content.' + key;
        addBeforeObserver(this, contentKey, null, contentPropertyWillChange);
        addObserver(this, contentKey, null, contentPropertyDidChange);
      },

      didUnwatchProperty: function (key) {
        var contentKey = 'content.' + key;
        removeBeforeObserver(this, contentKey, null, contentPropertyWillChange);
        removeObserver(this, contentKey, null, contentPropertyDidChange);
      },

      unknownProperty: function (key) {
        var content = get(this, 'content');
        if (content) {
          return get(content, key);
        }
      },

      setUnknownProperty: function (key, value) {
        var m = meta(this);
        if (m.proto === this) {
          // if marked as prototype then just defineProperty
          // rather than delegate
          defineProperty(this, key, null, value);
          return value;
        }

        var content = get(this, 'content');
        Ember.assert(fmt("Cannot delegate set('%@', %@) to the 'content' property of object proxy %@: its 'content' is undefined.", [key, value, this]), content);
        return set(content, key, value);
      }

    });

    __exports__["default"] = ObjectProxy;
  });
define("ember-runtime/system/set",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/is_none","ember-runtime/system/string","ember-runtime/system/core_object","ember-runtime/mixins/mutable_enumerable","ember-runtime/mixins/enumerable","ember-runtime/mixins/copyable","ember-runtime/mixins/freezable","ember-metal/error","ember-metal/property_events","ember-metal/mixin","ember-metal/computed","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.isNone

    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var guidFor = __dependency4__.guidFor;
    var isNone = __dependency5__.isNone;
    var fmt = __dependency6__.fmt;
    var CoreObject = __dependency7__["default"];
    var MutableEnumerable = __dependency8__["default"];
    var Enumerable = __dependency9__["default"];
    var Copyable = __dependency10__["default"];
    var Freezable = __dependency11__.Freezable;
    var FROZEN_ERROR = __dependency11__.FROZEN_ERROR;
    var EmberError = __dependency12__["default"];
    var propertyWillChange = __dependency13__.propertyWillChange;
    var propertyDidChange = __dependency13__.propertyDidChange;
    var aliasMethod = __dependency14__.aliasMethod;
    var computed = __dependency15__.computed;

    /**
      An unordered collection of objects.

      A Set works a bit like an array except that its items are not ordered. You
      can create a set to efficiently test for membership for an object. You can
      also iterate through a set just like an array, even accessing objects by
      index, however there is no guarantee as to their order.

      All Sets are observable via the Enumerable Observer API - which works
      on any enumerable object including both Sets and Arrays.

      ## Creating a Set

      You can create a set like you would most objects using
      `new Ember.Set()`. Most new sets you create will be empty, but you can
      also initialize the set with some content by passing an array or other
      enumerable of objects to the constructor.

      Finally, you can pass in an existing set and the set will be copied. You
      can also create a copy of a set by calling `Ember.Set#copy()`.

      ```javascript
      // creates a new empty set
      var foundNames = new Ember.Set();

      // creates a set with four names in it.
      var names = new Ember.Set(["Charles", "Tom", "Juan", "Alex"]); // :P

      // creates a copy of the names set.
      var namesCopy = new Ember.Set(names);

      // same as above.
      var anotherNamesCopy = names.copy();
      ```

      ## Adding/Removing Objects

      You generally add or remove objects from a set using `add()` or
      `remove()`. You can add any type of object including primitives such as
      numbers, strings, and booleans.

      Unlike arrays, objects can only exist one time in a set. If you call `add()`
      on a set with the same object multiple times, the object will only be added
      once. Likewise, calling `remove()` with the same object multiple times will
      remove the object the first time and have no effect on future calls until
      you add the object to the set again.

      NOTE: You cannot add/remove `null` or `undefined` to a set. Any attempt to do
      so will be ignored.

      In addition to add/remove you can also call `push()`/`pop()`. Push behaves
      just like `add()` but `pop()`, unlike `remove()` will pick an arbitrary
      object, remove it and return it. This is a good way to use a set as a job
      queue when you don't care which order the jobs are executed in.

      ## Testing for an Object

      To test for an object's presence in a set you simply call
      `Ember.Set#contains()`.

      ## Observing changes

      When using `Ember.Set`, you can observe the `"[]"` property to be
      alerted whenever the content changes. You can also add an enumerable
      observer to the set to be notified of specific objects that are added and
      removed from the set. See [Ember.Enumerable](/api/classes/Ember.Enumerable.html)
      for more information on enumerables.

      This is often unhelpful. If you are filtering sets of objects, for instance,
      it is very inefficient to re-filter all of the items each time the set
      changes. It would be better if you could just adjust the filtered set based
      on what was changed on the original set. The same issue applies to merging
      sets, as well.

      ## Other Methods

      `Ember.Set` primary implements other mixin APIs. For a complete reference
      on the methods you will use with `Ember.Set`, please consult these mixins.
      The most useful ones will be `Ember.Enumerable` and
      `Ember.MutableEnumerable` which implement most of the common iterator
      methods you are used to on Array.

      Note that you can also use the `Ember.Copyable` and `Ember.Freezable`
      APIs on `Ember.Set` as well. Once a set is frozen it can no longer be
      modified. The benefit of this is that when you call `frozenCopy()` on it,
      Ember will avoid making copies of the set. This allows you to write
      code that can know with certainty when the underlying set data will or
      will not be modified.

      @class Set
      @namespace Ember
      @extends Ember.CoreObject
      @uses Ember.MutableEnumerable
      @uses Ember.Copyable
      @uses Ember.Freezable
      @since Ember 0.9
    */
    var Set = CoreObject.extend(MutableEnumerable, Copyable, Freezable,
      {

      // ..........................................................
      // IMPLEMENT ENUMERABLE APIS
      //

      /**
        This property will change as the number of objects in the set changes.

        @property length
        @type number
        @default 0
      */
      length: 0,

      /**
        Clears the set. This is useful if you want to reuse an existing set
        without having to recreate it.

        ```javascript
        var colors = new Ember.Set(["red", "green", "blue"]);
        colors.length;  // 3
        colors.clear();
        colors.length;  // 0
        ```

        @method clear
        @return {Ember.Set} An empty Set
      */
      clear: function() {
        if (this.isFrozen) { throw new EmberError(FROZEN_ERROR); }

        var len = get(this, 'length');
        if (len === 0) { return this; }

        var guid;

        this.enumerableContentWillChange(len, 0);
        propertyWillChange(this, 'firstObject');
        propertyWillChange(this, 'lastObject');

        for (var i=0; i < len; i++) {
          guid = guidFor(this[i]);
          delete this[guid];
          delete this[i];
        }

        set(this, 'length', 0);

        propertyDidChange(this, 'firstObject');
        propertyDidChange(this, 'lastObject');
        this.enumerableContentDidChange(len, 0);

        return this;
      },

      /**
        Returns true if the passed object is also an enumerable that contains the
        same objects as the receiver.

        ```javascript
        var colors = ["red", "green", "blue"],
            same_colors = new Ember.Set(colors);

        same_colors.isEqual(colors);               // true
        same_colors.isEqual(["purple", "brown"]);  // false
        ```

        @method isEqual
        @param {Ember.Set} obj the other object.
        @return {Boolean}
      */
      isEqual: function(obj) {
        // fail fast
        if (!Enumerable.detect(obj)) return false;

        var loc = get(this, 'length');
        if (get(obj, 'length') !== loc) return false;

        while(--loc >= 0) {
          if (!obj.contains(this[loc])) return false;
        }

        return true;
      },

      /**
        Adds an object to the set. Only non-`null` objects can be added to a set
        and those can only be added once. If the object is already in the set or
        the passed value is null this method will have no effect.

        This is an alias for `Ember.MutableEnumerable.addObject()`.

        ```javascript
        var colors = new Ember.Set();
        colors.add("blue");     // ["blue"]
        colors.add("blue");     // ["blue"]
        colors.add("red");      // ["blue", "red"]
        colors.add(null);       // ["blue", "red"]
        colors.add(undefined);  // ["blue", "red"]
        ```

        @method add
        @param {Object} obj The object to add.
        @return {Ember.Set} The set itself.
      */
      add: aliasMethod('addObject'),

      /**
        Removes the object from the set if it is found. If you pass a `null` value
        or an object that is already not in the set, this method will have no
        effect. This is an alias for `Ember.MutableEnumerable.removeObject()`.

        ```javascript
        var colors = new Ember.Set(["red", "green", "blue"]);
        colors.remove("red");     // ["blue", "green"]
        colors.remove("purple");  // ["blue", "green"]
        colors.remove(null);      // ["blue", "green"]
        ```

        @method remove
        @param {Object} obj The object to remove
        @return {Ember.Set} The set itself.
      */
      remove: aliasMethod('removeObject'),

      /**
        Removes the last element from the set and returns it, or `null` if it's empty.

        ```javascript
        var colors = new Ember.Set(["green", "blue"]);
        colors.pop();  // "blue"
        colors.pop();  // "green"
        colors.pop();  // null
        ```

        @method pop
        @return {Object} The removed object from the set or null.
      */
      pop: function() {
        if (get(this, 'isFrozen')) throw new EmberError(FROZEN_ERROR);
        var obj = this.length > 0 ? this[this.length-1] : null;
        this.remove(obj);
        return obj;
      },

      /**
        Inserts the given object on to the end of the set. It returns
        the set itself.

        This is an alias for `Ember.MutableEnumerable.addObject()`.

        ```javascript
        var colors = new Ember.Set();
        colors.push("red");   // ["red"]
        colors.push("green"); // ["red", "green"]
        colors.push("blue");  // ["red", "green", "blue"]
        ```

        @method push
        @return {Ember.Set} The set itself.
      */
      push: aliasMethod('addObject'),

      /**
        Removes the last element from the set and returns it, or `null` if it's empty.

        This is an alias for `Ember.Set.pop()`.

        ```javascript
        var colors = new Ember.Set(["green", "blue"]);
        colors.shift();  // "blue"
        colors.shift();  // "green"
        colors.shift();  // null
        ```

        @method shift
        @return {Object} The removed object from the set or null.
      */
      shift: aliasMethod('pop'),

      /**
        Inserts the given object on to the end of the set. It returns
        the set itself.

        This is an alias of `Ember.Set.push()`

        ```javascript
        var colors = new Ember.Set();
        colors.unshift("red");    // ["red"]
        colors.unshift("green");  // ["red", "green"]
        colors.unshift("blue");   // ["red", "green", "blue"]
        ```

        @method unshift
        @return {Ember.Set} The set itself.
      */
      unshift: aliasMethod('push'),

      /**
        Adds each object in the passed enumerable to the set.

        This is an alias of `Ember.MutableEnumerable.addObjects()`

        ```javascript
        var colors = new Ember.Set();
        colors.addEach(["red", "green", "blue"]);  // ["red", "green", "blue"]
        ```

        @method addEach
        @param {Ember.Enumerable} objects the objects to add.
        @return {Ember.Set} The set itself.
      */
      addEach: aliasMethod('addObjects'),

      /**
        Removes each object in the passed enumerable to the set.

        This is an alias of `Ember.MutableEnumerable.removeObjects()`

        ```javascript
        var colors = new Ember.Set(["red", "green", "blue"]);
        colors.removeEach(["red", "blue"]);  //  ["green"]
        ```

        @method removeEach
        @param {Ember.Enumerable} objects the objects to remove.
        @return {Ember.Set} The set itself.
      */
      removeEach: aliasMethod('removeObjects'),

      // ..........................................................
      // PRIVATE ENUMERABLE SUPPORT
      //

      init: function(items) {
        this._super();
        if (items) this.addObjects(items);
      },

      // implement Ember.Enumerable
      nextObject: function(idx) {
        return this[idx];
      },

      // more optimized version
      firstObject: computed(function() {
        return this.length > 0 ? this[0] : undefined;
      }),

      // more optimized version
      lastObject: computed(function() {
        return this.length > 0 ? this[this.length-1] : undefined;
      }),

      // implements Ember.MutableEnumerable
      addObject: function(obj) {
        if (get(this, 'isFrozen')) throw new EmberError(FROZEN_ERROR);
        if (isNone(obj)) return this; // nothing to do

        var guid = guidFor(obj),
            idx  = this[guid],
            len  = get(this, 'length'),
            added ;

        if (idx>=0 && idx<len && (this[idx] === obj)) return this; // added

        added = [obj];

        this.enumerableContentWillChange(null, added);
        propertyWillChange(this, 'lastObject');

        len = get(this, 'length');
        this[guid] = len;
        this[len] = obj;
        set(this, 'length', len+1);

        propertyDidChange(this, 'lastObject');
        this.enumerableContentDidChange(null, added);

        return this;
      },

      // implements Ember.MutableEnumerable
      removeObject: function(obj) {
        if (get(this, 'isFrozen')) throw new EmberError(FROZEN_ERROR);
        if (isNone(obj)) return this; // nothing to do

        var guid = guidFor(obj),
            idx  = this[guid],
            len = get(this, 'length'),
            isFirst = idx === 0,
            isLast = idx === len-1,
            last, removed;


        if (idx>=0 && idx<len && (this[idx] === obj)) {
          removed = [obj];

          this.enumerableContentWillChange(removed, null);
          if (isFirst) { propertyWillChange(this, 'firstObject'); }
          if (isLast)  { propertyWillChange(this, 'lastObject'); }

          // swap items - basically move the item to the end so it can be removed
          if (idx < len-1) {
            last = this[len-1];
            this[idx] = last;
            this[guidFor(last)] = idx;
          }

          delete this[guid];
          delete this[len-1];
          set(this, 'length', len-1);

          if (isFirst) { propertyDidChange(this, 'firstObject'); }
          if (isLast)  { propertyDidChange(this, 'lastObject'); }
          this.enumerableContentDidChange(removed, null);
        }

        return this;
      },

      // optimized version
      contains: function(obj) {
        return this[guidFor(obj)]>=0;
      },

      copy: function() {
        var C = this.constructor, ret = new C(), loc = get(this, 'length');
        set(ret, 'length', loc);
        while(--loc>=0) {
          ret[loc] = this[loc];
          ret[guidFor(this[loc])] = loc;
        }
        return ret;
      },

      toString: function() {
        var len = this.length, idx, array = [];
        for(idx = 0; idx < len; idx++) {
          array[idx] = this[idx];
        }
        return fmt("Ember.Set<%@>", [array.join(',')]);
      }

    });


    __exports__["default"] = Set;
  });
define("ember-runtime/system/string",
  ["ember-metal/core","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.STRINGS, Ember.FEATURES
    var EmberInspect = __dependency2__.inspect;


    var STRING_DASHERIZE_REGEXP = (/[ _]/g);
    var STRING_DASHERIZE_CACHE = {};
    var STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
    var STRING_CAMELIZE_REGEXP = (/(\-|_|\.|\s)+(.)?/g);
    var STRING_UNDERSCORE_REGEXP_1 = (/([a-z\d])([A-Z]+)/g);
    var STRING_UNDERSCORE_REGEXP_2 = (/\-|\s+/g);

    function fmt(str, formats) {
      // first, replace any ORDERED replacements.
      var idx  = 0; // the current index for non-numerical replacements
      return str.replace(/%@([0-9]+)?/g, function(s, argIndex) {
        argIndex = (argIndex) ? parseInt(argIndex, 10) - 1 : idx++;
        s = formats[argIndex];
        return (s === null) ? '(null)' : (s === undefined) ? '' : EmberInspect(s);
      }) ;
    }

    function loc(str, formats) {
      str = Ember.STRINGS[str] || str;
      return fmt(str, formats);
    }

    function w(str) {
      return str.split(/\s+/);
    }

    function decamelize(str) {
      return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
    }

    function dasherize(str) {
      var cache = STRING_DASHERIZE_CACHE,
          hit   = cache.hasOwnProperty(str),
          ret;

      if (hit) {
        return cache[str];
      } else {
        ret = decamelize(str).replace(STRING_DASHERIZE_REGEXP,'-');
        cache[str] = ret;
      }

      return ret;
    }

    function camelize(str) {
      return str.replace(STRING_CAMELIZE_REGEXP, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
      }).replace(/^([A-Z])/, function(match, separator, chr) {
        return match.toLowerCase();
      });
    }

    function classify(str) {
      var parts = str.split("."),
          out = [];

      for (var i=0, l=parts.length; i<l; i++) {
        var camelized = camelize(parts[i]);
        out.push(camelized.charAt(0).toUpperCase() + camelized.substr(1));
      }

      return out.join(".");
    }

    function underscore(str) {
      return str.replace(STRING_UNDERSCORE_REGEXP_1, '$1_$2').
        replace(STRING_UNDERSCORE_REGEXP_2, '_').toLowerCase();
    }

    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
    }

    /**
      Defines the hash of localized strings for the current language. Used by
      the `Ember.String.loc()` helper. To localize, add string values to this
      hash.

      @property STRINGS
      @for Ember
      @type Hash
    */
    Ember.STRINGS = {};

    /**
      Defines string helper methods including string formatting and localization.
      Unless `Ember.EXTEND_PROTOTYPES.String` is `false` these methods will also be
      added to the `String.prototype` as well.

      @class String
      @namespace Ember
      @static
    */
    var EmberStringUtils = {

      /**
        Apply formatting options to the string. This will look for occurrences
        of "%@" in your string and substitute them with the arguments you pass into
        this method. If you want to control the specific order of replacement,
        you can add a number after the key as well to indicate which argument
        you want to insert.

        Ordered insertions are most useful when building loc strings where values
        you need to insert may appear in different orders.

        ```javascript
        "Hello %@ %@".fmt('John', 'Doe');     // "Hello John Doe"
        "Hello %@2, %@1".fmt('John', 'Doe');  // "Hello Doe, John"
        ```

        @method fmt
        @param {String} str The string to format
        @param {Array} formats An array of parameters to interpolate into string.
        @return {String} formatted string
      */
      fmt: fmt,

      /**
        Formats the passed string, but first looks up the string in the localized
        strings hash. This is a convenient way to localize text. See
        `Ember.String.fmt()` for more information on formatting.

        Note that it is traditional but not required to prefix localized string
        keys with an underscore or other character so you can easily identify
        localized strings.

        ```javascript
        Ember.STRINGS = {
          '_Hello World': 'Bonjour le monde',
          '_Hello %@ %@': 'Bonjour %@ %@'
        };

        Ember.String.loc("_Hello World");  // 'Bonjour le monde';
        Ember.String.loc("_Hello %@ %@", ["John", "Smith"]);  // "Bonjour John Smith";
        ```

        @method loc
        @param {String} str The string to format
        @param {Array} formats Optional array of parameters to interpolate into string.
        @return {String} formatted string
      */
      loc: loc,

      /**
        Splits a string into separate units separated by spaces, eliminating any
        empty strings in the process. This is a convenience method for split that
        is mostly useful when applied to the `String.prototype`.

        ```javascript
        Ember.String.w("alpha beta gamma").forEach(function(key) {
          console.log(key);
        });

        // > alpha
        // > beta
        // > gamma
        ```

        @method w
        @param {String} str The string to split
        @return {Array} array containing the split strings
      */
      w: w,

      /**
        Converts a camelized string into all lower case separated by underscores.

        ```javascript
        'innerHTML'.decamelize();           // 'inner_html'
        'action_name'.decamelize();        // 'action_name'
        'css-class-name'.decamelize();     // 'css-class-name'
        'my favorite items'.decamelize();  // 'my favorite items'
        ```

        @method decamelize
        @param {String} str The string to decamelize.
        @return {String} the decamelized string.
      */
      decamelize: decamelize,

      /**
        Replaces underscores, spaces, or camelCase with dashes.

        ```javascript
        'innerHTML'.dasherize();          // 'inner-html'
        'action_name'.dasherize();        // 'action-name'
        'css-class-name'.dasherize();     // 'css-class-name'
        'my favorite items'.dasherize();  // 'my-favorite-items'
        ```

        @method dasherize
        @param {String} str The string to dasherize.
        @return {String} the dasherized string.
      */
      dasherize: dasherize,

      /**
        Returns the lowerCamelCase form of a string.

        ```javascript
        'innerHTML'.camelize();          // 'innerHTML'
        'action_name'.camelize();        // 'actionName'
        'css-class-name'.camelize();     // 'cssClassName'
        'my favorite items'.camelize();  // 'myFavoriteItems'
        'My Favorite Items'.camelize();  // 'myFavoriteItems'
        ```

        @method camelize
        @param {String} str The string to camelize.
        @return {String} the camelized string.
      */
      camelize: camelize,

      /**
        Returns the UpperCamelCase form of a string.

        ```javascript
        'innerHTML'.classify();          // 'InnerHTML'
        'action_name'.classify();        // 'ActionName'
        'css-class-name'.classify();     // 'CssClassName'
        'my favorite items'.classify();  // 'MyFavoriteItems'
        ```

        @method classify
        @param {String} str the string to classify
        @return {String} the classified string
      */
      classify: classify,

      /**
        More general than decamelize. Returns the lower\_case\_and\_underscored
        form of a string.

        ```javascript
        'innerHTML'.underscore();          // 'inner_html'
        'action_name'.underscore();        // 'action_name'
        'css-class-name'.underscore();     // 'css_class_name'
        'my favorite items'.underscore();  // 'my_favorite_items'
        ```

        @method underscore
        @param {String} str The string to underscore.
        @return {String} the underscored string.
      */
      underscore: underscore,

      /**
        Returns the Capitalized form of a string

        ```javascript
        'innerHTML'.capitalize()         // 'InnerHTML'
        'action_name'.capitalize()       // 'Action_name'
        'css-class-name'.capitalize()    // 'Css-class-name'
        'my favorite items'.capitalize() // 'My favorite items'
        ```

        @method capitalize
        @param {String} str The string to capitalize.
        @return {String} The capitalized string.
      */
      capitalize: capitalize
    };

    __exports__["default"] = EmberStringUtils;
    __exports__.fmt = fmt;
    __exports__.loc = loc;
    __exports__.w = w;
    __exports__.decamelize = decamelize;
    __exports__.dasherize = dasherize;
    __exports__.camelize = camelize;
    __exports__.classify = classify;
    __exports__.underscore = underscore;
    __exports__.capitalize = capitalize;
  });
define("ember-runtime/system/subarray",
  ["ember-metal/property_get","ember-metal/error","ember-metal/enumerable_utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var EmberError = __dependency2__["default"];
    var EnumerableUtils = __dependency3__["default"];

    var RETAIN = 'r',
        FILTER = 'f';

    function Operation (type, count) {
      this.type = type;
      this.count = count;
    }

    /**
      An `Ember.SubArray` tracks an array in a way similar to, but more specialized
      than, `Ember.TrackedArray`.  It is useful for keeping track of the indexes of
      items within a filtered array.

      @class SubArray
      @namespace Ember
    */
    function SubArray (length) {
      if (arguments.length < 1) { length = 0; }

      if (length > 0) {
        this._operations = [new Operation(RETAIN, length)];
      } else {
        this._operations = [];
      }
    };

    SubArray.prototype = {
      /**
        Track that an item was added to the tracked array.

        @method addItem

        @param {number} index The index of the item in the tracked array.
        @param {boolean} match `true` iff the item is included in the subarray.

        @return {number} The index of the item in the subarray.
      */
      addItem: function(index, match) {
        var returnValue = -1,
            itemType = match ? RETAIN : FILTER,
            self = this;

        this._findOperation(index, function(operation, operationIndex, rangeStart, rangeEnd, seenInSubArray) {
          var newOperation, splitOperation;

          if (itemType === operation.type) {
            ++operation.count;
          } else if (index === rangeStart) {
            // insert to the left of `operation`
            self._operations.splice(operationIndex, 0, new Operation(itemType, 1));
          } else {
            newOperation = new Operation(itemType, 1);
            splitOperation = new Operation(operation.type, rangeEnd - index + 1);
            operation.count = index - rangeStart;

            self._operations.splice(operationIndex + 1, 0, newOperation, splitOperation);
          }

          if (match) {
            if (operation.type === RETAIN) {
              returnValue = seenInSubArray + (index - rangeStart);
            } else {
              returnValue = seenInSubArray;
            }
          }

          self._composeAt(operationIndex);
        }, function(seenInSubArray) {
          self._operations.push(new Operation(itemType, 1));

          if (match) {
            returnValue = seenInSubArray;
          }

          self._composeAt(self._operations.length-1);
        });

        return returnValue;
      },

      /**
        Track that an item was removed from the tracked array.

        @method removeItem

        @param {number} index The index of the item in the tracked array.

        @return {number} The index of the item in the subarray, or `-1` if the item
        was not in the subarray.
      */
      removeItem: function(index) {
        var returnValue = -1,
            self = this;

        this._findOperation(index, function (operation, operationIndex, rangeStart, rangeEnd, seenInSubArray) {
          if (operation.type === RETAIN) {
            returnValue = seenInSubArray + (index - rangeStart);
          }

          if (operation.count > 1) {
            --operation.count;
          } else {
            self._operations.splice(operationIndex, 1);
            self._composeAt(operationIndex);
          }
        }, function() {
          throw new EmberError("Can't remove an item that has never been added.");
        });

        return returnValue;
      },


      _findOperation: function (index, foundCallback, notFoundCallback) {
        var operationIndex,
            len,
            operation,
            rangeStart,
            rangeEnd,
            seenInSubArray = 0;

        // OPTIMIZE: change to balanced tree
        // find leftmost operation to the right of `index`
        for (operationIndex = rangeStart = 0, len = this._operations.length; operationIndex < len; rangeStart = rangeEnd + 1, ++operationIndex) {
          operation = this._operations[operationIndex];
          rangeEnd = rangeStart + operation.count - 1;

          if (index >= rangeStart && index <= rangeEnd) {
            foundCallback(operation, operationIndex, rangeStart, rangeEnd, seenInSubArray);
            return;
          } else if (operation.type === RETAIN) {
            seenInSubArray += operation.count;
          }
        }

        notFoundCallback(seenInSubArray);
      },

      _composeAt: function(index) {
        var op = this._operations[index],
            otherOp;

        if (!op) {
          // Composing out of bounds is a no-op, as when removing the last operation
          // in the list.
          return;
        }

        if (index > 0) {
          otherOp = this._operations[index-1];
          if (otherOp.type === op.type) {
            op.count += otherOp.count;
            this._operations.splice(index-1, 1);
            --index;
          }
        }

        if (index < this._operations.length-1) {
          otherOp = this._operations[index+1];
          if (otherOp.type === op.type) {
            op.count += otherOp.count;
            this._operations.splice(index+1, 1);
          }
        }
      },

      toString: function () {
        var str = "";
        forEach(this._operations, function (operation) {
          str += " " + operation.type + ":" + operation.count;
        });
        return str.substring(1);
      }
    };

    __exports__["default"] = SubArray;
  });
define("ember-runtime/system/tracked_array",
  ["ember-metal/property_get","ember-metal/enumerable_utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var EnumerableUtils = __dependency2__["default"];

    var forEach = EnumerableUtils.forEach,
        RETAIN = 'r',
        INSERT = 'i',
        DELETE = 'd';


    /**
      An `Ember.TrackedArray` tracks array operations.  It's useful when you want to
      lazily compute the indexes of items in an array after they've been shifted by
      subsequent operations.

      @class TrackedArray
      @namespace Ember
      @param {array} [items=[]] The array to be tracked.  This is used just to get
      the initial items for the starting state of retain:n.
    */
    function TrackedArray(items) {
      if (arguments.length < 1) { items = []; }

      var length = get(items, 'length');

      if (length) {
        this._operations = [new ArrayOperation(RETAIN, length, items)];
      } else {
        this._operations = [];
      }
    }

    TrackedArray.RETAIN = RETAIN;
    TrackedArray.INSERT = INSERT;
    TrackedArray.DELETE = DELETE;

    TrackedArray.prototype = {

      /**
        Track that `newItems` were added to the tracked array at `index`.

        @method addItems
        @param index
        @param newItems
      */
      addItems: function (index, newItems) {
        var count = get(newItems, 'length');
        if (count < 1) { return; }

        var match = this._findArrayOperation(index),
            arrayOperation = match.operation,
            arrayOperationIndex = match.index,
            arrayOperationRangeStart = match.rangeStart,
            composeIndex,
            splitIndex,
            splitItems,
            splitArrayOperation,
            newArrayOperation;

        newArrayOperation = new ArrayOperation(INSERT, count, newItems);

        if (arrayOperation) {
          if (!match.split) {
            // insert left of arrayOperation
            this._operations.splice(arrayOperationIndex, 0, newArrayOperation);
            composeIndex = arrayOperationIndex;
          } else {
            this._split(arrayOperationIndex, index - arrayOperationRangeStart, newArrayOperation);
            composeIndex = arrayOperationIndex + 1;
          }
        } else {
          // insert at end
          this._operations.push(newArrayOperation);
          composeIndex = arrayOperationIndex;
        }

        this._composeInsert(composeIndex);
      },

      /**
        Track that `count` items were removed at `index`.

        @method removeItems
        @param index
        @param count
      */
      removeItems: function (index, count) {
        if (count < 1) { return; }

        var match = this._findArrayOperation(index),
            arrayOperation = match.operation,
            arrayOperationIndex = match.index,
            arrayOperationRangeStart = match.rangeStart,
            newArrayOperation,
            composeIndex;

        newArrayOperation = new ArrayOperation(DELETE, count);
        if (!match.split) {
          // insert left of arrayOperation
          this._operations.splice(arrayOperationIndex, 0, newArrayOperation);
          composeIndex = arrayOperationIndex;
        } else {
          this._split(arrayOperationIndex, index - arrayOperationRangeStart, newArrayOperation);
          composeIndex = arrayOperationIndex + 1;
        }

        return this._composeDelete(composeIndex);
      },

      /**
        Apply all operations, reducing them to retain:n, for `n`, the number of
        items in the array.

        `callback` will be called for each operation and will be passed the following arguments:

        * {array} items The items for the given operation
        * {number} offset The computed offset of the items, ie the index in the
        array of the first item for this operation.
        * {string} operation The type of the operation.  One of
        `Ember.TrackedArray.{RETAIN, DELETE, INSERT}`

        @method apply
        @param {function} callback
      */
      apply: function (callback) {
        var items = [],
            offset = 0;

        forEach(this._operations, function (arrayOperation, operationIndex) {
          callback(arrayOperation.items, offset, arrayOperation.type, operationIndex);

          if (arrayOperation.type !== DELETE) {
            offset += arrayOperation.count;
            items = items.concat(arrayOperation.items);
          }
        });

        this._operations = [new ArrayOperation(RETAIN, items.length, items)];
      },

      /**
        Return an `ArrayOperationMatch` for the operation that contains the item at `index`.

        @method _findArrayOperation

        @param {number} index the index of the item whose operation information
        should be returned.
        @private
      */
      _findArrayOperation: function (index) {
        var arrayOperationIndex,
            len,
            split = false,
            arrayOperation,
            arrayOperationRangeStart,
            arrayOperationRangeEnd;

        // OPTIMIZE: we could search these faster if we kept a balanced tree.
        // find leftmost arrayOperation to the right of `index`
        for (arrayOperationIndex = arrayOperationRangeStart = 0, len = this._operations.length; arrayOperationIndex < len; ++arrayOperationIndex) {
          arrayOperation = this._operations[arrayOperationIndex];

          if (arrayOperation.type === DELETE) { continue; }

          arrayOperationRangeEnd = arrayOperationRangeStart + arrayOperation.count - 1;

          if (index === arrayOperationRangeStart) {
            break;
          } else if (index > arrayOperationRangeStart && index <= arrayOperationRangeEnd) {
            split = true;
            break;
          } else {
            arrayOperationRangeStart = arrayOperationRangeEnd + 1;
          }
        }

        return new ArrayOperationMatch(arrayOperation, arrayOperationIndex, split, arrayOperationRangeStart);
      },

      _split: function (arrayOperationIndex, splitIndex, newArrayOperation) {
        var arrayOperation = this._operations[arrayOperationIndex],
            splitItems = arrayOperation.items.slice(splitIndex),
            splitArrayOperation = new ArrayOperation(arrayOperation.type, splitItems.length, splitItems);

        // truncate LHS
        arrayOperation.count = splitIndex;
        arrayOperation.items = arrayOperation.items.slice(0, splitIndex);

        this._operations.splice(arrayOperationIndex + 1, 0, newArrayOperation, splitArrayOperation);
      },

      // see SubArray for a better implementation.
      _composeInsert: function (index) {
        var newArrayOperation = this._operations[index],
            leftArrayOperation = this._operations[index-1], // may be undefined
            rightArrayOperation = this._operations[index+1], // may be undefined
            leftOp = leftArrayOperation && leftArrayOperation.type,
            rightOp = rightArrayOperation && rightArrayOperation.type;

        if (leftOp === INSERT) {
            // merge left
            leftArrayOperation.count += newArrayOperation.count;
            leftArrayOperation.items = leftArrayOperation.items.concat(newArrayOperation.items);

          if (rightOp === INSERT) {
            // also merge right (we have split an insert with an insert)
            leftArrayOperation.count += rightArrayOperation.count;
            leftArrayOperation.items = leftArrayOperation.items.concat(rightArrayOperation.items);
            this._operations.splice(index, 2);
          } else {
            // only merge left
            this._operations.splice(index, 1);
          }
        } else if (rightOp === INSERT) {
          // merge right
          newArrayOperation.count += rightArrayOperation.count;
          newArrayOperation.items = newArrayOperation.items.concat(rightArrayOperation.items);
          this._operations.splice(index + 1, 1);
        }
      },

      _composeDelete: function (index) {
        var arrayOperation = this._operations[index],
            deletesToGo = arrayOperation.count,
            leftArrayOperation = this._operations[index-1], // may be undefined
            leftOp = leftArrayOperation && leftArrayOperation.type,
            nextArrayOperation,
            nextOp,
            nextCount,
            removeNewAndNextOp = false,
            removedItems = [];

        if (leftOp === DELETE) {
          arrayOperation = leftArrayOperation;
          index -= 1;
        }

        for (var i = index + 1; deletesToGo > 0; ++i) {
          nextArrayOperation = this._operations[i];
          nextOp = nextArrayOperation.type;
          nextCount = nextArrayOperation.count;

          if (nextOp === DELETE) {
            arrayOperation.count += nextCount;
            continue;
          }

          if (nextCount > deletesToGo) {
            // d:2 {r,i}:5  we reduce the retain or insert, but it stays
            removedItems = removedItems.concat(nextArrayOperation.items.splice(0, deletesToGo));
            nextArrayOperation.count -= deletesToGo;

            // In the case where we truncate the last arrayOperation, we don't need to
            // remove it; also the deletesToGo reduction is not the entirety of
            // nextCount
            i -= 1;
            nextCount = deletesToGo;

            deletesToGo = 0;
          } else {
            if (nextCount === deletesToGo) {
              // Handle edge case of d:2 i:2 in which case both operations go away
              // during composition.
              removeNewAndNextOp = true;
            }
            removedItems = removedItems.concat(nextArrayOperation.items);
            deletesToGo -= nextCount;
          }

          if (nextOp === INSERT) {
            // d:2 i:3 will result in delete going away
            arrayOperation.count -= nextCount;
          }
        }

        if (arrayOperation.count > 0) {
          // compose our new delete with possibly several operations to the right of
          // disparate types
          this._operations.splice(index+1, i-1-index);
        } else {
          // The delete operation can go away; it has merely reduced some other
          // operation, as in d:3 i:4; it may also have eliminated that operation,
          // as in d:3 i:3.
          this._operations.splice(index, removeNewAndNextOp ? 2 : 1);
        }

        return removedItems;
      },

      toString: function () {
        var str = "";
        forEach(this._operations, function (operation) {
          str += " " + operation.type + ":" + operation.count;
        });
        return str.substring(1);
      }
    };

    /**
      Internal data structure to represent an array operation.

      @method ArrayOperation
      @private
      @param {string} type The type of the operation.  One of
      `Ember.TrackedArray.{RETAIN, INSERT, DELETE}`
      @param {number} count The number of items in this operation.
      @param {array} items The items of the operation, if included.  RETAIN and
      INSERT include their items, DELETE does not.
    */
    function ArrayOperation (operation, count, items) {
      this.type = operation; // RETAIN | INSERT | DELETE
      this.count = count;
      this.items = items;
    }

    /**
      Internal data structure used to include information when looking up operations
      by item index.

      @method ArrayOperationMatch
      @private
      @param {ArrayOperation} operation
      @param {number} index The index of `operation` in the array of operations.
      @param {boolean} split Whether or not the item index searched for would
      require a split for a new operation type.
      @param {number} rangeStart The index of the first item in the operation,
      with respect to the tracked array.  The index of the last item can be computed
      from `rangeStart` and `operation.count`.
    */
    function ArrayOperationMatch(operation, index, split, rangeStart) {
      this.operation = operation;
      this.index = index;
      this.split = split;
      this.rangeStart = rangeStart;
    }

    __exports__["default"] = TrackedArray;
  });
})();

