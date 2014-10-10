define("ember-metal/is_empty",
  ["ember-metal/core","ember-metal/property_get","ember-metal/is_none","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // deprecateFunc
    var get = __dependency2__.get;
    var isNone = __dependency3__["default"];

    /**
      Verifies that a value is `null` or an empty string, empty array,
      or empty function.

      Constrains the rules on `Ember.isNone` by returning false for empty
      string and empty arrays.

      ```javascript
      Ember.isEmpty();                // true
      Ember.isEmpty(null);            // true
      Ember.isEmpty(undefined);       // true
      Ember.isEmpty('');              // true
      Ember.isEmpty([]);              // true
      Ember.isEmpty('Adam Hawkins');  // false
      Ember.isEmpty([0,1,2]);         // false
      ```

      @method isEmpty
      @for Ember
      @param {Object} obj Value to test
      @return {Boolean}
    */
    var isEmpty = function(obj) {
      return isNone(obj) || (obj.length === 0 && typeof obj !== 'function') || (typeof obj === 'object' && get(obj, 'length') === 0);
    };
    var empty = Ember.deprecateFunc("Ember.empty is deprecated. Please use Ember.isEmpty instead.", isEmpty);

    __exports__["default"] = isEmpty;
    __exports__.isEmpty = isEmpty;
    __exports__.empty = empty;
  });