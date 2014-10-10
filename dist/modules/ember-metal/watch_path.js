define("ember-metal/watch_path",
  ["ember-metal/utils","ember-metal/chains","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var meta = __dependency1__.meta;
    var typeOf = __dependency1__.typeOf;
    var ChainNode = __dependency2__.ChainNode;

    var metaFor = meta;

    // get the chains for the current object. If the current object has
    // chains inherited from the proto they will be cloned and reconfigured for
    // the current object.
    function chainsFor(obj, meta) {
      var m = meta || metaFor(obj), ret = m.chains;
      if (!ret) {
        ret = m.chains = new ChainNode(null, null, obj);
      } else if (ret.value() !== obj) {
        ret = m.chains = ret.copy(obj);
      }
      return ret;
    }

    function watchPath(obj, keyPath, meta) {
      // can't watch length on Array - it is special...
      if (keyPath === 'length' && typeOf(obj) === 'array') { return; }

      var m = meta || metaFor(obj), watching = m.watching;

      if (!watching[keyPath]) { // activate watching first time
        watching[keyPath] = 1;
        chainsFor(obj, m).add(keyPath);
      } else {
        watching[keyPath] = (watching[keyPath] || 0) + 1;
      }
    };

    function unwatchPath(obj, keyPath, meta) {
      var m = meta || metaFor(obj), watching = m.watching;

      if (watching[keyPath] === 1) {
        watching[keyPath] = 0;
        chainsFor(obj, m).remove(keyPath);
      } else if (watching[keyPath] > 1) {
        watching[keyPath]--;
      }
    };

    __exports__.watchPath = watchPath;
    __exports__.unwatchPath = unwatchPath;
  });