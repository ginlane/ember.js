define("ember-views/views/states/destroying",
  ["ember-metal/merge","ember-metal/platform","ember-runtime/system/string","ember-views/views/states/default","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var merge = __dependency1__["default"];
    var create = __dependency2__.create;
    var fmt = __dependency3__.fmt;
    var _default = __dependency4__["default"];
    var EmberError = __dependency5__["default"];
    /**
    @module ember
    @submodule ember-views
    */

    var destroyingError = "You can't call %@ on a view being destroyed";

    var destroying = create(_default);

    merge(destroying, {
      appendChild: function() {
        throw new EmberError(fmt(destroyingError, ['appendChild']));
      },
      rerender: function() {
        throw new EmberError(fmt(destroyingError, ['rerender']));
      },
      destroyElement: function() {
        throw new EmberError(fmt(destroyingError, ['destroyElement']));
      },
      empty: function() {
        throw new EmberError(fmt(destroyingError, ['empty']));
      },

      setElement: function() {
        throw new EmberError(fmt(destroyingError, ["set('element', ...)"]));
      },

      renderToBufferIfNeeded: function() {
        return false;
      },

      // Since element insertion is scheduled, don't do anything if
      // the view has been destroyed between scheduling and execution
      insertElement: Ember.K
    });

    __exports__["default"] = destroying;
  });