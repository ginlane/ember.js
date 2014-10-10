define("ember-metal/properties",
  ["ember-metal/core","ember-metal/utils","ember-metal/platform","ember-metal/property_events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    /**
    @module ember-metal
    */

    var Ember = __dependency1__["default"];
    var META_KEY = __dependency2__.META_KEY;
    var meta = __dependency2__.meta;
    var platform = __dependency3__.platform;
    var overrideChains = __dependency4__.overrideChains;
    var metaFor = meta,
        objectDefineProperty = platform.defineProperty;

    var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

    // ..........................................................
    // DESCRIPTOR
    //

    /**
      Objects of this type can implement an interface to respond to requests to
      get and set. The default implementation handles simple properties.

      You generally won't need to create or subclass this directly.

      @class Descriptor
      @namespace Ember
      @private
      @constructor
    */
    function Descriptor() {};

    // ..........................................................
    // DEFINING PROPERTIES API
    //

    var MANDATORY_SETTER_FUNCTION = Ember.MANDATORY_SETTER_FUNCTION = function(value) {
      Ember.assert("You must use Ember.set() to access this property (of " + this + ")", false);
    };

    var DEFAULT_GETTER_FUNCTION = Ember.DEFAULT_GETTER_FUNCTION = function(name) {
      return function() {
        var meta = this[META_KEY];
        return meta && meta.values[name];
      };
    };

    /**
      NOTE: This is a low-level method used by other parts of the API. You almost
      never want to call this method directly. Instead you should use
      `Ember.mixin()` to define new properties.

      Defines a property on an object. This method works much like the ES5
      `Object.defineProperty()` method except that it can also accept computed
      properties and other special descriptors.

      Normally this method takes only three parameters. However if you pass an
      instance of `Ember.Descriptor` as the third param then you can pass an
      optional value as the fourth parameter. This is often more efficient than
      creating new descriptor hashes for each property.

      ## Examples

      ```javascript
      // ES5 compatible mode
      Ember.defineProperty(contact, 'firstName', {
        writable: true,
        configurable: false,
        enumerable: true,
        value: 'Charles'
      });

      // define a simple property
      Ember.defineProperty(contact, 'lastName', undefined, 'Jolley');

      // define a computed property
      Ember.defineProperty(contact, 'fullName', Ember.computed(function() {
        return this.firstName+' '+this.lastName;
      }).property('firstName', 'lastName'));
      ```

      @private
      @method defineProperty
      @for Ember
      @param {Object} obj the object to define this property on. This may be a prototype.
      @param {String} keyName the name of the property
      @param {Ember.Descriptor} [desc] an instance of `Ember.Descriptor` (typically a
        computed property) or an ES5 descriptor.
        You must provide this or `data` but not both.
      @param {*} [data] something other than a descriptor, that will
        become the explicit value of this property.
    */
    function defineProperty(obj, keyName, desc, data, meta) {
      var descs, existingDesc, watching, value;

      if (!meta) meta = metaFor(obj);
      descs = meta.descs;
      existingDesc = meta.descs[keyName];
      watching = meta.watching[keyName] > 0;

      if (existingDesc instanceof Descriptor) {
        existingDesc.teardown(obj, keyName);
      }

      if (desc instanceof Descriptor) {
        value = desc;

        descs[keyName] = desc;
        if (MANDATORY_SETTER && watching) {
          objectDefineProperty(obj, keyName, {
            configurable: true,
            enumerable: true,
            writable: true,
            value: undefined // make enumerable
          });
        } else {
          obj[keyName] = undefined; // make enumerable
        }
      } else {
        descs[keyName] = undefined; // shadow descriptor in proto
        if (desc == null) {
          value = data;

          if (MANDATORY_SETTER && watching) {
            meta.values[keyName] = data;
            objectDefineProperty(obj, keyName, {
              configurable: true,
              enumerable: true,
              set: MANDATORY_SETTER_FUNCTION,
              get: DEFAULT_GETTER_FUNCTION(keyName)
            });
          } else {
            obj[keyName] = data;
          }
        } else {
          value = desc;

          // compatibility with ES5
          objectDefineProperty(obj, keyName, desc);
        }
      }

      // if key is being watched, override chains that
      // were initialized with the prototype
      if (watching) { overrideChains(obj, keyName, meta); }

      // The `value` passed to the `didDefineProperty` hook is
      // either the descriptor or data, whichever was passed.
      if (obj.didDefineProperty) { obj.didDefineProperty(obj, keyName, value); }

      return this;
    };

    __exports__.Descriptor = Descriptor;
    __exports__.defineProperty = defineProperty;
  });