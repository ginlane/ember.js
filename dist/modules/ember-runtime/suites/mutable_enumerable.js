define("ember-runtime/tests/suites/mutable_enumerable",
  ["ember-runtime/tests/suites/enumerable","ember-runtime/tests/suites/mutable_enumerable/addObject","ember-runtime/tests/suites/mutable_enumerable/removeObject","ember-runtime/tests/suites/mutable_enumerable/removeObjects","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var EnumerableTests = __dependency1__.EnumerableTests;
    var ObserverClass = __dependency1__.ObserverClass;

    var addObjectTests = __dependency2__["default"];
    var removeObjectTests = __dependency3__["default"];
    var removeObjectsTests = __dependency4__["default"];

    var MutableEnumerableTests = EnumerableTests.extend();
    MutableEnumerableTests.importModuleTests(addObjectTests);
    MutableEnumerableTests.importModuleTests(removeObjectTests);
    MutableEnumerableTests.importModuleTests(removeObjectsTests);

    __exports__["default"] = MutableEnumerableTests;
  });