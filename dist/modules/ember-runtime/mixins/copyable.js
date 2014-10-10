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