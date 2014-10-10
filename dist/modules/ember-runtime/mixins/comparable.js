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