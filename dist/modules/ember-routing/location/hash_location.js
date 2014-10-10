define("ember-routing/location/hash_location",
  ["ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-metal/utils","ember-runtime/system/object","ember-routing/location/api","ember-views/system/jquery","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var set = __dependency2__.set;
    var run = __dependency3__["default"];
    var guidFor = __dependency4__.guidFor;

    var EmberObject = __dependency5__["default"];
    var EmberLocation = __dependency6__["default"];
    var jQuery = __dependency7__["default"];

    /**
    @module ember
    @submodule ember-routing
    */

    /**
      `Ember.HashLocation` implements the location API using the browser's
      hash. At present, it relies on a `hashchange` event existing in the
      browser.

      @class HashLocation
      @namespace Ember
      @extends Ember.Object
    */
    var HashLocation = EmberObject.extend({
      implementation: 'hash',

      init: function() {
        set(this, 'location', get(this, '_location') || window.location);
      },

      /**
        @private

        Returns normalized location.hash

        @since 1.5.1
        @method getHash
      */
      getHash: EmberLocation._getHash,

      /**
        Returns the current `location.hash`, minus the '#' at the front.

        @private
        @method getURL
      */
      getURL: function() {
        return this.getHash().substr(1);
      },

      /**
        Set the `location.hash` and remembers what was set. This prevents
        `onUpdateURL` callbacks from triggering when the hash was set by
        `HashLocation`.

        @private
        @method setURL
        @param path {String}
      */
      setURL: function(path) {
        get(this, 'location').hash = path;
        set(this, 'lastSetURL', path);
      },

      /**
        Uses location.replace to update the url without a page reload
        or history modification.

        @private
        @method replaceURL
        @param path {String}
      */
      replaceURL: function(path) {
        get(this, 'location').replace('#' + path);
        set(this, 'lastSetURL', path);
      },

      /**
        Register a callback to be invoked when the hash changes. These
        callbacks will execute when the user presses the back or forward
        button, but not after `setURL` is invoked.

        @private
        @method onUpdateURL
        @param callback {Function}
      */
      onUpdateURL: function(callback) {
        var self = this;
        var guid = guidFor(this);

        jQuery(window).on('hashchange.ember-location-'+guid, function() {
          run(function() {
            var path = self.getURL();
            if (get(self, 'lastSetURL') === path) { return; }

            set(self, 'lastSetURL', null);

            callback(path);
          });
        });
      },

      /**
        Given a URL, formats it to be placed into the page as part
        of an element's `href` attribute.

        This is used, for example, when using the {{action}} helper
        to generate a URL based on an event.

        @private
        @method formatURL
        @param url {String}
      */
      formatURL: function(url) {
        return '#'+url;
      },

      /**
        Cleans up the HashLocation event listener.

        @private
        @method willDestroy
      */
      willDestroy: function() {
        var guid = guidFor(this);

        jQuery(window).off('hashchange.ember-location-'+guid);
      }
    });

    __exports__["default"] = HashLocation;
  });