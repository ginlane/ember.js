define("ember-views/views/states/default",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];
    var EmberError = __dependency5__["default"];

    /**
    @module ember
    @submodule ember-views
    */
    var _default = {
      // appendChild is only legal while rendering the buffer.
      appendChild: function() {
        throw new EmberError("You can't use appendChild outside of the rendering process");
      },

      $: function() {
        return undefined;
      },

      getElement: function() {
        return null;
      },

      // Handle events from `Ember.EventDispatcher`
      handleEvent: function() {
        return true; // continue event propagation
      },

      destroyElement: function(view) {
        set(view, 'element', null);
        if (view._scheduledInsert) {
          run.cancel(view._scheduledInsert);
          view._scheduledInsert = null;
        }
        return view;
      },

      renderToBufferIfNeeded: function () {
        return false;
      },

      rerender: Ember.K,
      invokeObserver: Ember.K
    };

    __exports__["default"] = _default;
  });