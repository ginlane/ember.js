define("ember-runtime/tests/suites/array",
  ["ember-runtime/tests/suites/enumerable","ember-runtime/tests/suites/array/indexOf","ember-runtime/tests/suites/array/lastIndexOf","ember-runtime/tests/suites/array/objectAt","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var EnumerableTests = __dependency1__.EnumerableTests;
    var ObserverClass = __dependency1__.ObserverClass;
    var indexOfTests = __dependency2__["default"];
    var lastIndexOfTests = __dependency3__["default"];
    var objectAtTests = __dependency4__["default"];


    var EnumerableTestsObserverClass = ObserverClass;

    ObserverClass = EnumerableTestsObserverClass.extend({

       observeArray: function(obj) {
        obj.addArrayObserver(this);
        return this;
      },

      stopObserveArray: function(obj) {
        obj.removeArrayObserver(this);
        return this;
      },

      arrayWillChange: function() {
        equal(this._before, null, 'should only call once');
        this._before = Array.prototype.slice.call(arguments);
      },

      arrayDidChange: function() {
        equal(this._after, null, 'should only call once');
        this._after = Array.prototype.slice.call(arguments);
      }

    });

    var ArrayTests = EnumerableTests.extend({

      observerClass: ObserverClass

    });

    ArrayTests.ObserverClass = ObserverClass;

    ArrayTests.importModuleTests(indexOfTests);
    ArrayTests.importModuleTests(lastIndexOfTests);
    ArrayTests.importModuleTests(objectAtTests);

    __exports__.ArrayTests = ArrayTests;
    __exports__.ObserverClass = ObserverClass;
  });