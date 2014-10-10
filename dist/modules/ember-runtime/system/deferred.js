define("ember-runtime/system/deferred",
  ["ember-runtime/mixins/deferred","ember-metal/property_get","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var DeferredMixin = __dependency1__["default"];
    var get = __dependency2__.get;
    var EmberObject = __dependency3__["default"];

    var Deferred = EmberObject.extend(DeferredMixin);

    Deferred.reopenClass({
      promise: function(callback, binding) {
        var deferred = Deferred.create();
        callback.call(binding, deferred);
        return deferred;
      }
    });

    __exports__["default"] = Deferred;
  });