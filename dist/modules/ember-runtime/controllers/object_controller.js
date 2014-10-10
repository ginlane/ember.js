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