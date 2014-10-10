define("ember-metal/set_properties",
  ["ember-metal/property_events","ember-metal/property_set","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var changeProperties = __dependency1__.changeProperties;
    var set = __dependency2__.set;

    /**
      Set a list of properties on an object. These properties are set inside
      a single `beginPropertyChanges` and `endPropertyChanges` batch, so
      observers will be buffered.

      ```javascript
      var anObject = Ember.Object.create();

      anObject.setProperties({
        firstName: 'Stanley',
        lastName: 'Stuart',
        age: 21
      });
      ```

      @method setProperties
      @param self
      @param {Object} hash
      @return self
    */
    function setProperties(self, hash) {
      changeProperties(function() {
        for(var prop in hash) {
          if (hash.hasOwnProperty(prop)) { set(self, prop, hash[prop]); }
        }
      });
      return self;
    };

    __exports__["default"] = setProperties;
  });