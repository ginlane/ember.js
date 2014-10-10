define("ember-runtime/tests/suites/copyable",
  ["ember-runtime/tests/suites/suite","ember-metal/mixin","ember-runtime/tests/suites/copyable/copy","ember-runtime/tests/suites/copyable/frozenCopy","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Suite = __dependency1__.Suite;
    var SuiteModuleBuilder = __dependency1__.SuiteModuleBuilder;
    var required = __dependency2__.required;

    var CopyableTests = Suite.extend({

      /**
        Must be able to create a new object for testing.

        @returns {Object} object
      */
      newObject: required(Function),

      /**
        Compares the two passed in objects.  Returns true if the two objects
        are logically equivalent.

        @param {Object} a
          First object

        @param {Object} b
          Second object

        @returns {Boolean}
      */
      isEqual: required(Function),

      /**
        Set this to true if you expect the objects you test to be freezable.
        The suite will verify that your objects actually match this.  (i.e. if
        you say you can't test freezable it will verify that your objects really
        aren't freezable.)

        @type Boolean
      */
      shouldBeFreezable: false

    });

    var copyTests = __dependency3__["default"];
    var frozenCopyTests = __dependency4__["default"];

    CopyableTests.importModuleTests(copyTests);
    CopyableTests.importModuleTests(frozenCopyTests);

    __exports__["default"] = CopyableTests;
  });