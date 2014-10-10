define("ember-runtime/system/lazy_load",
  ["ember-metal/core","ember-metal/array","ember-runtime/system/native_array","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /*globals CustomEvent */

    var Ember = __dependency1__["default"];
    // Ember.ENV.EMBER_LOAD_HOOKS
    var forEach = __dependency2__.forEach;
    // make sure Ember.A is setup.

    /**
      @module ember
      @submodule ember-runtime
    */

    var loadHooks = Ember.ENV.EMBER_LOAD_HOOKS || {};
    var loaded = {};

    /**
      Detects when a specific package of Ember (e.g. 'Ember.Handlebars')
      has fully loaded and is available for extension.

      The provided `callback` will be called with the `name` passed
      resolved from a string into the object:

      ``` javascript
      Ember.onLoad('Ember.Handlebars' function(hbars) {
        hbars.registerHelper(...);
      });
      ```

      @method onLoad
      @for Ember
      @param name {String} name of hook
      @param callback {Function} callback to be called
    */
    function onLoad(name, callback) {
      var object;

      loadHooks[name] = loadHooks[name] || Ember.A();
      loadHooks[name].pushObject(callback);

      if (object = loaded[name]) {
        callback(object);
      }
    };

    /**
      Called when an Ember.js package (e.g Ember.Handlebars) has finished
      loading. Triggers any callbacks registered for this event.

      @method runLoadHooks
      @for Ember
      @param name {String} name of hook
      @param object {Object} object to pass to callbacks
    */
    function runLoadHooks(name, object) {
      loaded[name] = object;

      if (typeof window === 'object' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === "function") {
        var event = new CustomEvent(name, {detail: object, name: name});
        window.dispatchEvent(event);
      }

      if (loadHooks[name]) {
        forEach.call(loadHooks[name], function(callback) {
          callback(object);
        });
      }
    };

    __exports__.onLoad = onLoad;
    __exports__.runLoadHooks = runLoadHooks;
  });