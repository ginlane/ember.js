define("ember-runtime/tests/suites/mutable_array",
  ["ember-runtime/tests/suites/array","ember-runtime/tests/suites/mutable_array/insertAt","ember-runtime/tests/suites/mutable_array/popObject","ember-runtime/tests/suites/mutable_array/pushObject","ember-runtime/tests/suites/mutable_array/pushObjects","ember-runtime/tests/suites/mutable_array/removeAt","ember-runtime/tests/suites/mutable_array/replace","ember-runtime/tests/suites/mutable_array/shiftObject","ember-runtime/tests/suites/mutable_array/unshiftObject","ember-runtime/tests/suites/mutable_array/reverseObjects","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __exports__) {
    "use strict";
    var ArrayTests = __dependency1__.ArrayTests;
    var ObserverClass = __dependency1__.ObserverClass;

    var insertAtTests = __dependency2__["default"];
    var popObjectTests = __dependency3__["default"];
    var pushObjectTests = __dependency4__["default"];
    var pushObjectsTest = __dependency5__["default"];
    var removeAtTests = __dependency6__["default"];
    var replaceTests = __dependency7__["default"];
    var shiftObjectTests = __dependency8__["default"];
    var unshiftObjectTests = __dependency9__["default"];
    var reverseObjectsTests = __dependency10__["default"];

    var MutableArrayTests = ArrayTests.extend();
    MutableArrayTests.importModuleTests(insertAtTests);
    MutableArrayTests.importModuleTests(popObjectTests);
    MutableArrayTests.importModuleTests(pushObjectTests);
    MutableArrayTests.importModuleTests(pushObjectsTest);
    MutableArrayTests.importModuleTests(removeAtTests);
    MutableArrayTests.importModuleTests(replaceTests);
    MutableArrayTests.importModuleTests(shiftObjectTests);
    MutableArrayTests.importModuleTests(unshiftObjectTests);
    MutableArrayTests.importModuleTests(reverseObjectsTests);

    __exports__["default"] = MutableArrayTests;
  });