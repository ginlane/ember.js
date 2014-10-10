define("ember-metal/watching",
  ["ember-metal/utils","ember-metal/chains","ember-metal/watch_key","ember-metal/watch_path","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    /**
    @module ember-metal
    */

    var meta = __dependency1__.meta;
    var META_KEY = __dependency1__.META_KEY;
    var GUID_KEY = __dependency1__.GUID_KEY;
    var typeOf = __dependency1__.typeOf;
    var generateGuid = __dependency1__.generateGuid;
    var removeChainWatcher = __dependency2__.removeChainWatcher;
    var flushPendingChains = __dependency2__.flushPendingChains;
    var watchKey = __dependency3__.watchKey;
    var unwatchKey = __dependency3__.unwatchKey;
    var watchPath = __dependency4__.watchPath;
    var unwatchPath = __dependency4__.unwatchPath;

    var metaFor = meta; // utils.js

    // returns true if the passed path is just a keyName
    function isKeyName(path) {
      return path.indexOf('.') === -1;
    }

    /**
      Starts watching a property on an object. Whenever the property changes,
      invokes `Ember.propertyWillChange` and `Ember.propertyDidChange`. This is the
      primitive used by observers and dependent keys; usually you will never call
      this method directly but instead use higher level methods like
      `Ember.addObserver()`

      @private
      @method watch
      @for Ember
      @param obj
      @param {String} keyName
    */
    function watch(obj, _keyPath, m) {
      // can't watch length on Array - it is special...
      if (_keyPath === 'length' && typeOf(obj) === 'array') { return; }

      if (isKeyName(_keyPath)) {
        watchKey(obj, _keyPath, m);
      } else {
        watchPath(obj, _keyPath, m);
      }
    };

    function isWatching(obj, key) {
      var meta = obj[META_KEY];
      return (meta && meta.watching[key]) > 0;
    };

    watch.flushPending = flushPendingChains;

    function unwatch(obj, _keyPath, m) {
      // can't watch length on Array - it is special...
      if (_keyPath === 'length' && typeOf(obj) === 'array') { return; }

      if (isKeyName(_keyPath)) {
        unwatchKey(obj, _keyPath, m);
      } else {
        unwatchPath(obj, _keyPath, m);
      }
    };

    /**
      Call on an object when you first beget it from another object. This will
      setup any chained watchers on the object instance as needed. This method is
      safe to call multiple times.

      @private
      @method rewatch
      @for Ember
      @param obj
    */
    function rewatch(obj) {
      var m = obj[META_KEY], chains = m && m.chains;

      // make sure the object has its own guid.
      if (GUID_KEY in obj && !obj.hasOwnProperty(GUID_KEY)) {
        generateGuid(obj);
      }

      // make sure any chained watchers update.
      if (chains && chains.value() !== obj) {
        m.chains = chains.copy(obj);
      }
    };

    var NODE_STACK = [];

    /**
      Tears down the meta on an object so that it can be garbage collected.
      Multiple calls will have no effect.

      @method destroy
      @for Ember
      @param {Object} obj  the object to destroy
      @return {void}
    */
    function destroy(obj) {
      var meta = obj[META_KEY], node, nodes, key, nodeObject;
      if (meta) {
        obj[META_KEY] = null;
        // remove chainWatchers to remove circular references that would prevent GC
        node = meta.chains;
        if (node) {
          NODE_STACK.push(node);
          // process tree
          while (NODE_STACK.length > 0) {
            node = NODE_STACK.pop();
            // push children
            nodes = node._chains;
            if (nodes) {
              for (key in nodes) {
                if (nodes.hasOwnProperty(key)) {
                  NODE_STACK.push(nodes[key]);
                }
              }
            }
            // remove chainWatcher in node object
            if (node._watching) {
              nodeObject = node._object;
              if (nodeObject) {
                removeChainWatcher(nodeObject, node._key, node);
              }
            }
          }
        }
      }
    };

    __exports__.watch = watch;
    __exports__.isWatching = isWatching;
    __exports__.unwatch = unwatch;
    __exports__.rewatch = rewatch;
    __exports__.destroy = destroy;
  });