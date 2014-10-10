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