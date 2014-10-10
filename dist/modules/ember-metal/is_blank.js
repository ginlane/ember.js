define("ember-metal/is_blank",
  ["ember-metal/core","ember-metal/is_empty","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // deprecateFunc
    var isEmpty = __dependency2__["default"];

    /**
      A value is blank if it is empty or a whitespace string.

      ```javascript
      Ember.isBlank();                // true
      Ember.isBlank(null);            // true
      Ember.isBlank(undefined);       // true
      Ember.isBlank('');              // true
      Ember.isBlank([]);              // true
      Ember.isBlank('\n\t');          // true
      Ember.isBlank('  ');            // true
      Ember.isBlank({});              // false
      Ember.isBlank('\n\t Hello');    // false
      Ember.isBlank('Hello world');   // false
      Ember.isBlank([1,2,3]);         // false
      ```

      @method isBlank
      @for Ember
      @param {Object} obj Value to test
      @return {Boolean}
      @since 1.5.0
      */
    function isBlank(obj) {
      return isEmpty(obj) || (typeof obj === 'string' && obj.match(/\S/) === null);
    };

    __exports__["default"] = isBlank;
  });