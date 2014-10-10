define("ember-runtime/tests/suites/enumerable",
  ["ember-runtime/tests/suites/suite","ember-runtime/system/object","ember-metal/mixin","ember-metal/utils","ember-metal/computed","ember-metal/property_get","ember-runtime/tests/suites/enumerable/any","ember-runtime/tests/suites/enumerable/is_any","ember-runtime/tests/suites/enumerable/compact","ember-runtime/tests/suites/enumerable/contains","ember-runtime/tests/suites/enumerable/every","ember-runtime/tests/suites/enumerable/filter","ember-runtime/tests/suites/enumerable/find","ember-runtime/tests/suites/enumerable/firstObject","ember-runtime/tests/suites/enumerable/forEach","ember-runtime/tests/suites/enumerable/mapBy","ember-runtime/tests/suites/enumerable/invoke","ember-runtime/tests/suites/enumerable/lastObject","ember-runtime/tests/suites/enumerable/map","ember-runtime/tests/suites/enumerable/reduce","ember-runtime/tests/suites/enumerable/reject","ember-runtime/tests/suites/enumerable/sortBy","ember-runtime/tests/suites/enumerable/toArray","ember-runtime/tests/suites/enumerable/uniq","ember-runtime/tests/suites/enumerable/without","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __exports__) {
    "use strict";
    var Suite = __dependency1__.Suite;
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var EmberObject = __dependency2__["default"];
    var required = __dependency3__.required;
    var guidFor = __dependency4__.guidFor;
    var generateGuid = __dependency4__.generateGuid;
    var computed = __dependency5__.computed;
    var get = __dependency6__.get;

    var ObserverClass = EmberObject.extend({

      _keysBefore: null,
      _keys: null,
      _values: null,
      _before : null,
      _after: null,

      isEnabled: true,

      init: function() {
        this._super();
        this.reset();
      },


      propertyWillChange: function(target, key) {
        if (this._keysBefore[key] === undefined) { this._keysBefore[key] = 0; }
        this._keysBefore[key]++;
      },

      /**
        Invoked when the property changes.  Just records the parameters for
        later analysis.
      */
      propertyDidChange: function(target, key, value) {
        if (this._keys[key] === undefined) { this._keys[key] = 0; }
        this._keys[key]++;
        this._values[key] = value;
      },

      /**
        Resets the recorded results for another run.

        @returns {Object} receiver
      */
      reset: function() {
        this._keysBefore = {};
        this._keys = {};
        this._values = {};
        this._before = null;
        this._after = null;
        return this;
      },


      observeBefore: function(obj) {
        if (obj.addBeforeObserver) {
          var keys = Array.prototype.slice.call(arguments, 1),
              loc  = keys.length;
          while(--loc>=0) obj.addBeforeObserver(keys[loc], this, 'propertyWillChange');
        }
        return this;
      },

      /**
        Begins observing the passed key names on the passed object.  Any changes
        on the named properties will be recorded.

        @param {Ember.Enumerable} obj
          The enumerable to observe.

        @returns {Object} receiver
      */
      observe: function(obj) {
        if (obj.addObserver) {
          var keys = Array.prototype.slice.call(arguments, 1),
              loc  = keys.length;
          while(--loc>=0) obj.addObserver(keys[loc], this, 'propertyDidChange');
        } else {
          this.isEnabled = false;
        }
        return this;
      },

      /**
        Returns true if the passed key was invoked.  If you pass a value as
        well then validates that the values match.

        @param {String} key
          Key to validate

        @param {Object} value
          (Optional) value

        @returns {Boolean}
      */
      validate: function(key, value) {
        if (!this.isEnabled) return true;
        if (!this._keys[key]) return false;
        if (arguments.length>1) return this._values[key] === value;
        else return true;
      },

      /**
        Returns times the before observer as invoked.

        @param {String} key
          Key to check
      */
      timesCalledBefore: function(key) {
        return this._keysBefore[key] || 0;
      },

      /**
        Returns times the observer as invoked.

        @param {String} key
          Key to check
      */
      timesCalled: function(key) {
        return this._keys[key] || 0;
      },

      /**
        begins acting as an enumerable observer.
      */
      observeEnumerable: function(obj) {
        obj.addEnumerableObserver(this);
        return this;
      },

      stopObserveEnumerable: function(obj) {
        obj.removeEnumerableObserver(this);
        return this;
      },

      enumerableWillChange: function() {
        equal(this._before, null, 'should only call once');
        this._before = Array.prototype.slice.call(arguments);
      },

      enumerableDidChange: function() {
        equal(this._after, null, 'should only call once');
        this._after = Array.prototype.slice.call(arguments);
      }

    });


    var EnumerableTests = Suite.extend({
      /**
        Implement to return a new enumerable object for testing.  Should accept
        either no parameters, a single number (indicating the desired length of
        the collection) or an array of objects.

        @param {Array} content
          An array of items to include in the enumerable optionally.

        @returns {Ember.Enumerable} a new enumerable
      */
      newObject: required(Function),

      /**
        Implement to return a set of new fixture strings that can be applied to
        the enumerable.  This may be passed into the newObject method.

        @param {Number} count
          The number of items required.

        @returns {Array} array of strings
      */
      newFixture: function(cnt) {
        var ret = [];
        while(--cnt >= 0) ret.push(generateGuid());
        return ret;
      },

      /**
        Implement to return a set of new fixture objects that can be applied to
        the enumerable.  This may be passed into the newObject method.

        @param {Number} cnt
          The number of items required.

        @returns {Array} array of objects
      */
      newObjectsFixture: function(cnt) {
        var ret = [];
        var item;
        while(--cnt >= 0) {
          item = {};
          guidFor(item);
          ret.push(item);
        }
        return ret;
      },

      /**
        Implement accept an instance of the enumerable and return an array
        containing the objects in the enumerable.  This is used only for testing
        so performance is not important.

        @param {Ember.Enumerable} enumerable
          The enumerable to convert.

        @returns {Array} array of items
      */
      toArray: required(Function),

      /**
        Implement this method if your object can mutate internally (even if it
        does not support the MutableEnumerable API).  The method should accept
        an object of your desired type and modify it somehow.  Suite tests will
        use this to ensure that all appropriate caches, etc. clear when the
        mutation occurs.

        If you do not define this optional method, then mutation-related tests
        will be skipped.

        @param {Ember.Enumerable} enumerable
          The enumerable to mutate

        @returns {void}
      */
      mutate: function() {},

      /**
        Becomes true when you define a new mutate() method, indicating that
        mutation tests should run.  This is calculated automatically.

        @type Boolean
      */
      canTestMutation: computed(function() {
        return this.mutate !== EnumerableTests.prototype.mutate;
      }),

      /**
        Invoked to actually run the test - overridden by mixins
      */
      run: function() {},


      /**
        Creates a new observer object for testing.  You can add this object as an
        observer on an array and it will record results anytime it is invoked.
        After running the test, call the validate() method on the observer to
        validate the results.
      */
      newObserver: function(obj) {
        var ret = get(this, 'observerClass').create();
        if (arguments.length>0) ret.observeBefore.apply(ret, arguments);
        if (arguments.length>0) ret.observe.apply(ret, arguments);
        return ret;
      },

      observerClass: ObserverClass
    });

    var anyTests = __dependency7__["default"];
    var isAnyTests = __dependency8__["default"];
    var compactTests = __dependency9__["default"];
    var containsTests = __dependency10__["default"];
    var everyTests = __dependency11__["default"];
    var filterTests = __dependency12__["default"];
    var findTests = __dependency13__["default"];
    var firstObjectTests = __dependency14__["default"];
    var forEachTests = __dependency15__["default"];
    var mapByTests = __dependency16__["default"];
    var invokeTests = __dependency17__["default"];
    var lastObjectTests = __dependency18__["default"];
    var mapTests = __dependency19__["default"];
    var reduceTests = __dependency20__["default"];
    var rejectTests = __dependency21__["default"];
    var sortByTests = __dependency22__["default"];
    var toArrayTests = __dependency23__["default"];
    var uniqTests = __dependency24__["default"];
    var withoutTests = __dependency25__["default"];

    EnumerableTests.importModuleTests(anyTests);
    EnumerableTests.importModuleTests(isAnyTests);
    EnumerableTests.importModuleTests(compactTests);
    EnumerableTests.importModuleTests(containsTests);
    EnumerableTests.importModuleTests(everyTests);
    EnumerableTests.importModuleTests(filterTests);
    EnumerableTests.importModuleTests(findTests);
    EnumerableTests.importModuleTests(firstObjectTests);
    EnumerableTests.importModuleTests(forEachTests);
    EnumerableTests.importModuleTests(mapByTests);
    EnumerableTests.importModuleTests(invokeTests);
    EnumerableTests.importModuleTests(lastObjectTests);
    EnumerableTests.importModuleTests(mapTests);
    EnumerableTests.importModuleTests(reduceTests);
    EnumerableTests.importModuleTests(rejectTests);
    EnumerableTests.importModuleTests(sortByTests);
    EnumerableTests.importModuleTests(toArrayTests);
    EnumerableTests.importModuleTests(uniqTests);
    EnumerableTests.importModuleTests(withoutTests);

    __exports__["default"] = EnumerableTests;
    __exports__.EnumerableTests = EnumerableTests;
    __exports__.ObserverClass = ObserverClass;
  });