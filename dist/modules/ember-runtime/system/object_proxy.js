define("ember-runtime/system/object_proxy",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/observer","ember-metal/property_events","ember-metal/computed","ember-metal/properties","ember-metal/mixin","ember-runtime/system/string","ember-runtime/system/object","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-runtime
    */
    var Ember = __dependency1__["default"];
    // Ember.assert
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var meta = __dependency4__.meta;
    var addObserver = __dependency5__.addObserver;
    var removeObserver = __dependency5__.removeObserver;
    var addBeforeObserver = __dependency5__.addBeforeObserver;
    var removeBeforeObserver = __dependency5__.removeBeforeObserver;
    var propertyWillChange = __dependency6__.propertyWillChange;
    var propertyDidChange = __dependency6__.propertyDidChange;
    var computed = __dependency7__.computed;
    var defineProperty = __dependency8__.defineProperty;
    var observer = __dependency9__.observer;
    var fmt = __dependency10__.fmt;
    var EmberObject = __dependency11__["default"];

    function contentPropertyWillChange(content, contentKey) {
      var key = contentKey.slice(8); // remove "content."
      if (key in this) { return; }  // if shadowed in proxy
      propertyWillChange(this, key);
    }

    function contentPropertyDidChange(content, contentKey) {
      var key = contentKey.slice(8); // remove "content."
      if (key in this) { return; } // if shadowed in proxy
      propertyDidChange(this, key);
    }

    /**
      `Ember.ObjectProxy` forwards all properties not defined by the proxy itself
      to a proxied `content` object.

      ```javascript
      object = Ember.Object.create({
        name: 'Foo'
      });

      proxy = Ember.ObjectProxy.create({
        content: object
      });

      // Access and change existing properties
      proxy.get('name')          // 'Foo'
      proxy.set('name', 'Bar');
      object.get('name')         // 'Bar'

      // Create new 'description' property on `object`
      proxy.set('description', 'Foo is a whizboo baz');
      object.get('description')  // 'Foo is a whizboo baz'
      ```

      While `content` is unset, setting a property to be delegated will throw an
      Error.

      ```javascript
      proxy = Ember.ObjectProxy.create({
        content: null,
        flag: null
      });
      proxy.set('flag', true);
      proxy.get('flag');         // true
      proxy.get('foo');          // undefined
      proxy.set('foo', 'data');  // throws Error
      ```

      Delegated properties can be bound to and will change when content is updated.

      Computed properties on the proxy itself can depend on delegated properties.

      ```javascript
      ProxyWithComputedProperty = Ember.ObjectProxy.extend({
        fullName: function () {
          var firstName = this.get('firstName'),
              lastName = this.get('lastName');
          if (firstName && lastName) {
            return firstName + ' ' + lastName;
          }
          return firstName || lastName;
        }.property('firstName', 'lastName')
      });

      proxy = ProxyWithComputedProperty.create();

      proxy.get('fullName');  // undefined
      proxy.set('content', {
        firstName: 'Tom', lastName: 'Dale'
      }); // triggers property change for fullName on proxy

      proxy.get('fullName');  // 'Tom Dale'
      ```

      @class ObjectProxy
      @namespace Ember
      @extends Ember.Object
    */
    var ObjectProxy = EmberObject.extend({
      /**
        The object whose properties will be forwarded.

        @property content
        @type Ember.Object
        @default null
      */
      content: null,
      _contentDidChange: observer('content', function() {
        Ember.assert("Can't set ObjectProxy's content to itself", get(this, 'content') !== this);
      }),

      isTruthy: computed.bool('content'),

      _debugContainerKey: null,

      willWatchProperty: function (key) {
        var contentKey = 'content.' + key;
        addBeforeObserver(this, contentKey, null, contentPropertyWillChange);
        addObserver(this, contentKey, null, contentPropertyDidChange);
      },

      didUnwatchProperty: function (key) {
        var contentKey = 'content.' + key;
        removeBeforeObserver(this, contentKey, null, contentPropertyWillChange);
        removeObserver(this, contentKey, null, contentPropertyDidChange);
      },

      unknownProperty: function (key) {
        var content = get(this, 'content');
        if (content) {
          return get(content, key);
        }
      },

      setUnknownProperty: function (key, value) {
        var m = meta(this);
        if (m.proto === this) {
          // if marked as prototype then just defineProperty
          // rather than delegate
          defineProperty(this, key, null, value);
          return value;
        }

        var content = get(this, 'content');
        Ember.assert(fmt("Cannot delegate set('%@', %@) to the 'content' property of object proxy %@: its 'content' is undefined.", [key, value, this]), content);
        return set(content, key, value);
      }

    });

    __exports__["default"] = ObjectProxy;
  });