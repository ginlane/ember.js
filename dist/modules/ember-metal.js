(function() {
define("ember-metal/array",
  ["exports"],
  function(__exports__) {
    "use strict";
    /*jshint newcap:false*/
    /**
    @module ember-metal
    */

    var ArrayPrototype = Array.prototype;

    // NOTE: There is a bug in jshint that doesn't recognize `Object()` without `new`
    // as being ok unless both `newcap:false` and not `use strict`.
    // https://github.com/jshint/jshint/issues/392

    // Testing this is not ideal, but we want to use native functions
    // if available, but not to use versions created by libraries like Prototype
    var isNativeFunc = function(func) {
      // This should probably work in all browsers likely to have ES5 array methods
      return func && Function.prototype.toString.call(func).indexOf('[native code]') > -1;
    };

    // From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/map
    var map = isNativeFunc(ArrayPrototype.map) ? ArrayPrototype.map : function(fun /*, thisp */) {
      //"use strict";

      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      var res = new Array(len);
      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          res[i] = fun.call(thisp, t[i], i, t);
        }
      }

      return res;
    };

    // From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
    var forEach = isNativeFunc(ArrayPrototype.forEach) ? ArrayPrototype.forEach : function(fun /*, thisp */) {
      //"use strict";

      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== "function") {
        throw new TypeError();
      }

      var thisp = arguments[1];
      for (var i = 0; i < len; i++) {
        if (i in t) {
          fun.call(thisp, t[i], i, t);
        }
      }
    };

    var indexOf = isNativeFunc(ArrayPrototype.indexOf) ? ArrayPrototype.indexOf : function (obj, fromIndex) {
      if (fromIndex === null || fromIndex === undefined) { fromIndex = 0; }
      else if (fromIndex < 0) { fromIndex = Math.max(0, this.length + fromIndex); }
      for (var i = fromIndex, j = this.length; i < j; i++) {
        if (this[i] === obj) { return i; }
      }
      return -1;
    };

    var filter = isNativeFunc(ArrayPrototype.filter) ? ArrayPrototype.filter : function (fn, context) {
      var i,
      value,
      result = [],
      length = this.length;

      for (i = 0; i < length; i++) {
        if (this.hasOwnProperty(i)) {
          value = this[i];
          if (fn.call(context, value, i, this)) {
            result.push(value);
          }
        }
      }
      return result;
    };


    if (Ember.SHIM_ES5) {
      if (!ArrayPrototype.map) {
        ArrayPrototype.map = map;
      }

      if (!ArrayPrototype.forEach) {
        ArrayPrototype.forEach = forEach;
      }

      if (!ArrayPrototype.filter) {
        ArrayPrototype.filter = filter;
      }

      if (!ArrayPrototype.indexOf) {
        ArrayPrototype.indexOf = indexOf;
      }
    }

    /**
      Array polyfills to support ES5 features in older browsers.

      @namespace Ember
      @property ArrayPolyfills
    */
    __exports__.map = map;
    __exports__.forEach = forEach;
    __exports__.filter = filter;
    __exports__.indexOf = indexOf;
  });
define("ember-metal/binding",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/map","ember-metal/observer","ember-metal/run_loop","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.Logger, Ember.LOG_BINDINGS, assert
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var trySet = __dependency3__.trySet;
    var guidFor = __dependency4__.guidFor;
    var Map = __dependency5__.Map;
    var addObserver = __dependency6__.addObserver;
    var removeObserver = __dependency6__.removeObserver;
    var _suspendObserver = __dependency6__._suspendObserver;
    var run = __dependency7__["default"];

    // ES6TODO: where is Ember.lookup defined?
    /**
    @module ember-metal
    */

    // ..........................................................
    // CONSTANTS
    //

    /**
      Debug parameter you can turn on. This will log all bindings that fire to
      the console. This should be disabled in production code. Note that you
      can also enable this from the console or temporarily.

      @property LOG_BINDINGS
      @for Ember
      @type Boolean
      @default false
    */
    Ember.LOG_BINDINGS = false || !!Ember.ENV.LOG_BINDINGS;

    var IS_GLOBAL = /^([A-Z$]|([0-9][A-Z$]))/;

    /**
      Returns true if the provided path is global (e.g., `MyApp.fooController.bar`)
      instead of local (`foo.bar.baz`).

      @method isGlobalPath
      @for Ember
      @private
      @param {String} path
      @return Boolean
    */
    function isGlobalPath(path) {
      return IS_GLOBAL.test(path);
    };

    function getWithGlobals(obj, path) {
      return get(isGlobalPath(path) ? Ember.lookup : obj, path);
    }

    // ..........................................................
    // BINDING
    //

    var Binding = function(toPath, fromPath) {
      this._direction = 'fwd';
      this._from = fromPath;
      this._to   = toPath;
      this._directionMap = Map.create();
    };

    /**
    @class Binding
    @namespace Ember
    */

    Binding.prototype = {
      /**
        This copies the Binding so it can be connected to another object.

        @method copy
        @return {Ember.Binding} `this`
      */
      copy: function () {
        var copy = new Binding(this._to, this._from);
        if (this._oneWay) { copy._oneWay = true; }
        return copy;
      },

      // ..........................................................
      // CONFIG
      //

      /**
        This will set `from` property path to the specified value. It will not
        attempt to resolve this property path to an actual object until you
        connect the binding.

        The binding will search for the property path starting at the root object
        you pass when you `connect()` the binding. It follows the same rules as
        `get()` - see that method for more information.

        @method from
        @param {String} path the property path to connect to
        @return {Ember.Binding} `this`
      */
      from: function(path) {
        this._from = path;
        return this;
      },

      /**
        This will set the `to` property path to the specified value. It will not
        attempt to resolve this property path to an actual object until you
        connect the binding.

        The binding will search for the property path starting at the root object
        you pass when you `connect()` the binding. It follows the same rules as
        `get()` - see that method for more information.

        @method to
        @param {String|Tuple} path A property path or tuple
        @return {Ember.Binding} `this`
      */
      to: function(path) {
        this._to = path;
        return this;
      },

      /**
        Configures the binding as one way. A one-way binding will relay changes
        on the `from` side to the `to` side, but not the other way around. This
        means that if you change the `to` side directly, the `from` side may have
        a different value.

        @method oneWay
        @return {Ember.Binding} `this`
      */
      oneWay: function() {
        this._oneWay = true;
        return this;
      },

      /**
        @method toString
        @return {String} string representation of binding
      */
      toString: function() {
        var oneWay = this._oneWay ? '[oneWay]' : '';
        return "Ember.Binding<" + guidFor(this) + ">(" + this._from + " -> " + this._to + ")" + oneWay;
      },

      // ..........................................................
      // CONNECT AND SYNC
      //

      /**
        Attempts to connect this binding instance so that it can receive and relay
        changes. This method will raise an exception if you have not set the
        from/to properties yet.

        @method connect
        @param {Object} obj The root object for this binding.
        @return {Ember.Binding} `this`
      */
      connect: function(obj) {
        Ember.assert('Must pass a valid object to Ember.Binding.connect()', !!obj);

        var fromPath = this._from, toPath = this._to;
        trySet(obj, toPath, getWithGlobals(obj, fromPath));

        // add an observer on the object to be notified when the binding should be updated
        addObserver(obj, fromPath, this, this.fromDidChange);

        // if the binding is a two-way binding, also set up an observer on the target
        if (!this._oneWay) { addObserver(obj, toPath, this, this.toDidChange); }

        this._readyToSync = true;

        return this;
      },

      /**
        Disconnects the binding instance. Changes will no longer be relayed. You
        will not usually need to call this method.

        @method disconnect
        @param {Object} obj The root object you passed when connecting the binding.
        @return {Ember.Binding} `this`
      */
      disconnect: function(obj) {
        Ember.assert('Must pass a valid object to Ember.Binding.disconnect()', !!obj);

        var twoWay = !this._oneWay;

        // remove an observer on the object so we're no longer notified of
        // changes that should update bindings.
        removeObserver(obj, this._from, this, this.fromDidChange);

        // if the binding is two-way, remove the observer from the target as well
        if (twoWay) { removeObserver(obj, this._to, this, this.toDidChange); }

        this._readyToSync = false; // disable scheduled syncs...
        return this;
      },

      // ..........................................................
      // PRIVATE
      //

      /* called when the from side changes */
      fromDidChange: function(target) {
        this._scheduleSync(target, 'fwd');
      },

      /* called when the to side changes */
      toDidChange: function(target) {
        this._scheduleSync(target, 'back');
      },

      _scheduleSync: function(obj, dir) {
        var directionMap = this._directionMap;
        var existingDir = directionMap.get(obj);

        // if we haven't scheduled the binding yet, schedule it
        if (!existingDir) {
          run.schedule('sync', this, this._sync, obj);
          directionMap.set(obj, dir);
        }

        // If both a 'back' and 'fwd' sync have been scheduled on the same object,
        // default to a 'fwd' sync so that it remains deterministic.
        if (existingDir === 'back' && dir === 'fwd') {
          directionMap.set(obj, 'fwd');
        }
      },

      _sync: function(obj) {
        var log = Ember.LOG_BINDINGS;

        // don't synchronize destroyed objects or disconnected bindings
        if (obj.isDestroyed || !this._readyToSync) { return; }

        // get the direction of the binding for the object we are
        // synchronizing from
        var directionMap = this._directionMap;
        var direction = directionMap.get(obj);

        var fromPath = this._from, toPath = this._to;

        directionMap.remove(obj);

        // if we're synchronizing from the remote object...
        if (direction === 'fwd') {
          var fromValue = getWithGlobals(obj, this._from);
          if (log) {
            Ember.Logger.log(' ', this.toString(), '->', fromValue, obj);
          }
          if (this._oneWay) {
            trySet(obj, toPath, fromValue);
          } else {
            _suspendObserver(obj, toPath, this, this.toDidChange, function () {
              trySet(obj, toPath, fromValue);
            });
          }
        // if we're synchronizing *to* the remote object
        } else if (direction === 'back') {
          var toValue = get(obj, this._to);
          if (log) {
            Ember.Logger.log(' ', this.toString(), '<-', toValue, obj);
          }
          _suspendObserver(obj, fromPath, this, this.fromDidChange, function () {
            trySet(isGlobalPath(fromPath) ? Ember.lookup : obj, fromPath, toValue);
          });
        }
      }

    };

    function mixinProperties(to, from) {
      for (var key in from) {
        if (from.hasOwnProperty(key)) {
          to[key] = from[key];
        }
      }
    }

    mixinProperties(Binding, {

      /*
        See `Ember.Binding.from`.

        @method from
        @static
      */
      from: function() {
        var C = this, binding = new C();
        return binding.from.apply(binding, arguments);
      },

      /*
        See `Ember.Binding.to`.

        @method to
        @static
      */
      to: function() {
        var C = this, binding = new C();
        return binding.to.apply(binding, arguments);
      },

      /**
        Creates a new Binding instance and makes it apply in a single direction.
        A one-way binding will relay changes on the `from` side object (supplied
        as the `from` argument) the `to` side, but not the other way around.
        This means that if you change the "to" side directly, the "from" side may have
        a different value.

        See `Binding.oneWay`.

        @method oneWay
        @param {String} from from path.
        @param {Boolean} [flag] (Optional) passing nothing here will make the
          binding `oneWay`. You can instead pass `false` to disable `oneWay`, making the
          binding two way again.
        @return {Ember.Binding} `this`
      */
      oneWay: function(from, flag) {
        var C = this, binding = new C(null, from);
        return binding.oneWay(flag);
      }

    });

    /**
      An `Ember.Binding` connects the properties of two objects so that whenever
      the value of one property changes, the other property will be changed also.

      ## Automatic Creation of Bindings with `/^*Binding/`-named Properties

      You do not usually create Binding objects directly but instead describe
      bindings in your class or object definition using automatic binding
      detection.

      Properties ending in a `Binding` suffix will be converted to `Ember.Binding`
      instances. The value of this property should be a string representing a path
      to another object or a custom binding instanced created using Binding helpers
      (see "One Way Bindings"):

      ```
      valueBinding: "MyApp.someController.title"
      ```

      This will create a binding from `MyApp.someController.title` to the `value`
      property of your object instance automatically. Now the two values will be
      kept in sync.

      ## One Way Bindings

      One especially useful binding customization you can use is the `oneWay()`
      helper. This helper tells Ember that you are only interested in
      receiving changes on the object you are binding from. For example, if you
      are binding to a preference and you want to be notified if the preference
      has changed, but your object will not be changing the preference itself, you
      could do:

      ```
      bigTitlesBinding: Ember.Binding.oneWay("MyApp.preferencesController.bigTitles")
      ```

      This way if the value of `MyApp.preferencesController.bigTitles` changes the
      `bigTitles` property of your object will change also. However, if you
      change the value of your `bigTitles` property, it will not update the
      `preferencesController`.

      One way bindings are almost twice as fast to setup and twice as fast to
      execute because the binding only has to worry about changes to one side.

      You should consider using one way bindings anytime you have an object that
      may be created frequently and you do not intend to change a property; only
      to monitor it for changes (such as in the example above).

      ## Adding Bindings Manually

      All of the examples above show you how to configure a custom binding, but the
      result of these customizations will be a binding template, not a fully active
      Binding instance. The binding will actually become active only when you
      instantiate the object the binding belongs to. It is useful however, to
      understand what actually happens when the binding is activated.

      For a binding to function it must have at least a `from` property and a `to`
      property. The `from` property path points to the object/key that you want to
      bind from while the `to` path points to the object/key you want to bind to.

      When you define a custom binding, you are usually describing the property
      you want to bind from (such as `MyApp.someController.value` in the examples
      above). When your object is created, it will automatically assign the value
      you want to bind `to` based on the name of your binding key. In the
      examples above, during init, Ember objects will effectively call
      something like this on your binding:

      ```javascript
      binding = Ember.Binding.from(this.valueBinding).to("value");
      ```

      This creates a new binding instance based on the template you provide, and
      sets the to path to the `value` property of the new object. Now that the
      binding is fully configured with a `from` and a `to`, it simply needs to be
      connected to become active. This is done through the `connect()` method:

      ```javascript
      binding.connect(this);
      ```

      Note that when you connect a binding you pass the object you want it to be
      connected to. This object will be used as the root for both the from and
      to side of the binding when inspecting relative paths. This allows the
      binding to be automatically inherited by subclassed objects as well.

      Now that the binding is connected, it will observe both the from and to side
      and relay changes.

      If you ever needed to do so (you almost never will, but it is useful to
      understand this anyway), you could manually create an active binding by
      using the `Ember.bind()` helper method. (This is the same method used by
      to setup your bindings on objects):

      ```javascript
      Ember.bind(MyApp.anotherObject, "value", "MyApp.someController.value");
      ```

      Both of these code fragments have the same effect as doing the most friendly
      form of binding creation like so:

      ```javascript
      MyApp.anotherObject = Ember.Object.create({
        valueBinding: "MyApp.someController.value",

        // OTHER CODE FOR THIS OBJECT...
      });
      ```

      Ember's built in binding creation method makes it easy to automatically
      create bindings for you. You should always use the highest-level APIs
      available, even if you understand how it works underneath.

      @class Binding
      @namespace Ember
      @since Ember 0.9
    */
    // Ember.Binding = Binding; ES6TODO: where to put this?


    /**
      Global helper method to create a new binding. Just pass the root object
      along with a `to` and `from` path to create and connect the binding.

      @method bind
      @for Ember
      @param {Object} obj The root object of the transform.
      @param {String} to The path to the 'to' side of the binding.
        Must be relative to obj.
      @param {String} from The path to the 'from' side of the binding.
        Must be relative to obj or a global path.
      @return {Ember.Binding} binding instance
    */
    function bind(obj, to, from) {
      return new Binding(to, from).connect(obj);
    };

    /**
      @method oneWay
      @for Ember
      @param {Object} obj The root object of the transform.
      @param {String} to The path to the 'to' side of the binding.
        Must be relative to obj.
      @param {String} from The path to the 'from' side of the binding.
        Must be relative to obj or a global path.
      @return {Ember.Binding} binding instance
    */
    function oneWay(obj, to, from) {
      return new Binding(to, from).oneWay().connect(obj);
    };

    __exports__.Binding = Binding;
    __exports__.bind = bind;
    __exports__.oneWay = oneWay;
    __exports__.isGlobalPath = isGlobalPath;
  });
define("ember-metal/chains",
  ["ember-metal/core","ember-metal/property_get","ember-metal/utils","ember-metal/array","ember-metal/watch_key","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // warn, assert, etc;
    var get = __dependency2__.get;
    var normalizeTuple = __dependency2__.normalizeTuple;
    var meta = __dependency3__.meta;
    var META_KEY = __dependency3__.META_KEY;
    var forEach = __dependency4__.forEach;
    var watchKey = __dependency5__.watchKey;
    var unwatchKey = __dependency5__.unwatchKey;

    var metaFor = meta,
        warn = Ember.warn,
        FIRST_KEY = /^([^\.]+)/;

    function firstKey(path) {
      return path.match(FIRST_KEY)[0];
    }

    var pendingQueue = [];

    // attempts to add the pendingQueue chains again. If some of them end up
    // back in the queue and reschedule is true, schedules a timeout to try
    // again.
    function flushPendingChains() {
      if (pendingQueue.length === 0) { return; } // nothing to do

      var queue = pendingQueue;
      pendingQueue = [];

      forEach.call(queue, function(q) { q[0].add(q[1]); });

      warn('Watching an undefined global, Ember expects watched globals to be setup by the time the run loop is flushed, check for typos', pendingQueue.length === 0);
    };


    function addChainWatcher(obj, keyName, node) {
      if (!obj || ('object' !== typeof obj)) { return; } // nothing to do

      var m = metaFor(obj), nodes = m.chainWatchers;

      if (!m.hasOwnProperty('chainWatchers')) {
        nodes = m.chainWatchers = {};
      }

      if (!nodes[keyName]) { nodes[keyName] = []; }
      nodes[keyName].push(node);
      watchKey(obj, keyName, m);
    }

    function removeChainWatcher(obj, keyName, node) {
      if (!obj || 'object' !== typeof obj) { return; } // nothing to do

      var m = obj[META_KEY];
      if (m && !m.hasOwnProperty('chainWatchers')) { return; } // nothing to do

      var nodes = m && m.chainWatchers;

      if (nodes && nodes[keyName]) {
        nodes = nodes[keyName];
        for (var i = 0, l = nodes.length; i < l; i++) {
          if (nodes[i] === node) { nodes.splice(i, 1); }
        }
      }
      unwatchKey(obj, keyName, m);
    };

    // A ChainNode watches a single key on an object. If you provide a starting
    // value for the key then the node won't actually watch it. For a root node
    // pass null for parent and key and object for value.
    function ChainNode(parent, key, value) {
      this._parent = parent;
      this._key    = key;

      // _watching is true when calling get(this._parent, this._key) will
      // return the value of this node.
      //
      // It is false for the root of a chain (because we have no parent)
      // and for global paths (because the parent node is the object with
      // the observer on it)
      this._watching = value===undefined;

      this._value  = value;
      this._paths = {};
      if (this._watching) {
        this._object = parent.value();
        if (this._object) { addChainWatcher(this._object, this._key, this); }
      }

      // Special-case: the EachProxy relies on immediate evaluation to
      // establish its observers.
      //
      // TODO: Replace this with an efficient callback that the EachProxy
      // can implement.
      if (this._parent && this._parent._key === '@each') {
        this.value();
      }
    };

    var ChainNodePrototype = ChainNode.prototype;

    function lazyGet(obj, key) {
      if (!obj) return undefined;

      var meta = obj[META_KEY];
      // check if object meant only to be a prototype
      if (meta && meta.proto === obj) return undefined;

      if (key === "@each") return get(obj, key);

      // if a CP only return cached value
      var desc = meta && meta.descs[key];
      if (desc && desc._cacheable) {
        if (key in meta.cache) {
          return meta.cache[key];
        } else {
          return undefined;
        }
      }

      return get(obj, key);
    }

    ChainNodePrototype.value = function() {
      if (this._value === undefined && this._watching) {
        var obj = this._parent.value();
        this._value = lazyGet(obj, this._key);
      }
      return this._value;
    };

    ChainNodePrototype.destroy = function() {
      if (this._watching) {
        var obj = this._object;
        if (obj) { removeChainWatcher(obj, this._key, this); }
        this._watching = false; // so future calls do nothing
      }
    };

    // copies a top level object only
    ChainNodePrototype.copy = function(obj) {
      var ret = new ChainNode(null, null, obj),
          paths = this._paths, path;
      for (path in paths) {
        if (paths[path] <= 0) { continue; } // this check will also catch non-number vals.
        ret.add(path);
      }
      return ret;
    };

    // called on the root node of a chain to setup watchers on the specified
    // path.
    ChainNodePrototype.add = function(path) {
      var obj, tuple, key, src, paths;

      paths = this._paths;
      paths[path] = (paths[path] || 0) + 1;

      obj = this.value();
      tuple = normalizeTuple(obj, path);

      // the path was a local path
      if (tuple[0] && tuple[0] === obj) {
        path = tuple[1];
        key  = firstKey(path);
        path = path.slice(key.length+1);

      // global path, but object does not exist yet.
      // put into a queue and try to connect later.
      } else if (!tuple[0]) {
        pendingQueue.push([this, path]);
        tuple.length = 0;
        return;

      // global path, and object already exists
      } else {
        src  = tuple[0];
        key  = path.slice(0, 0-(tuple[1].length+1));
        path = tuple[1];
      }

      tuple.length = 0;
      this.chain(key, path, src);
    };

    // called on the root node of a chain to teardown watcher on the specified
    // path
    ChainNodePrototype.remove = function(path) {
      var obj, tuple, key, src, paths;

      paths = this._paths;
      if (paths[path] > 0) { paths[path]--; }

      obj = this.value();
      tuple = normalizeTuple(obj, path);
      if (tuple[0] === obj) {
        path = tuple[1];
        key  = firstKey(path);
        path = path.slice(key.length+1);
      } else {
        src  = tuple[0];
        key  = path.slice(0, 0-(tuple[1].length+1));
        path = tuple[1];
      }

      tuple.length = 0;
      this.unchain(key, path);
    };

    ChainNodePrototype.count = 0;

    ChainNodePrototype.chain = function(key, path, src) {
      var chains = this._chains, node;
      if (!chains) { chains = this._chains = {}; }

      node = chains[key];
      if (!node) { node = chains[key] = new ChainNode(this, key, src); }
      node.count++; // count chains...

      // chain rest of path if there is one
      if (path && path.length>0) {
        key = firstKey(path);
        path = path.slice(key.length+1);
        node.chain(key, path); // NOTE: no src means it will observe changes...
      }
    };

    ChainNodePrototype.unchain = function(key, path) {
      var chains = this._chains, node = chains[key];

      // unchain rest of path first...
      if (path && path.length>1) {
        key  = firstKey(path);
        path = path.slice(key.length+1);
        node.unchain(key, path);
      }

      // delete node if needed.
      node.count--;
      if (node.count<=0) {
        delete chains[node._key];
        node.destroy();
      }

    };

    ChainNodePrototype.willChange = function(events) {
      var chains = this._chains;
      if (chains) {
        for(var key in chains) {
          if (!chains.hasOwnProperty(key)) { continue; }
          chains[key].willChange(events);
        }
      }

      if (this._parent) { this._parent.chainWillChange(this, this._key, 1, events); }
    };

    ChainNodePrototype.chainWillChange = function(chain, path, depth, events) {
      if (this._key) { path = this._key + '.' + path; }

      if (this._parent) {
        this._parent.chainWillChange(this, path, depth+1, events);
      } else {
        if (depth > 1) {
          events.push(this.value(), path);
        }
        path = 'this.' + path;
        if (this._paths[path] > 0) {
          events.push(this.value(), path);
        }
      }
    };

    ChainNodePrototype.chainDidChange = function(chain, path, depth, events) {
      if (this._key) { path = this._key + '.' + path; }
      if (this._parent) {
        this._parent.chainDidChange(this, path, depth+1, events);
      } else {
        if (depth > 1) {
          events.push(this.value(), path);
        }
        path = 'this.' + path;
        if (this._paths[path] > 0) {
          events.push(this.value(), path);
        }
      }
    };

    ChainNodePrototype.didChange = function(events) {
      // invalidate my own value first.
      if (this._watching) {
        var obj = this._parent.value();
        if (obj !== this._object) {
          removeChainWatcher(this._object, this._key, this);
          this._object = obj;
          addChainWatcher(obj, this._key, this);
        }
        this._value  = undefined;

        // Special-case: the EachProxy relies on immediate evaluation to
        // establish its observers.
        if (this._parent && this._parent._key === '@each')
          this.value();
      }

      // then notify chains...
      var chains = this._chains;
      if (chains) {
        for(var key in chains) {
          if (!chains.hasOwnProperty(key)) { continue; }
          chains[key].didChange(events);
        }
      }

      // if no events are passed in then we only care about the above wiring update
      if (events === null) { return; }

      // and finally tell parent about my path changing...
      if (this._parent) { this._parent.chainDidChange(this, this._key, 1, events); }
    };

    function finishChains(obj) {
      // We only create meta if we really have to
      var m = obj[META_KEY], chains = m && m.chains;
      if (chains) {
        if (chains.value() !== obj) {
          metaFor(obj).chains = chains = chains.copy(obj);
        } else {
          chains.didChange(null);
        }
      }
    };

    __exports__.flushPendingChains = flushPendingChains;
    __exports__.removeChainWatcher = removeChainWatcher;
    __exports__.ChainNode = ChainNode;
    __exports__.finishChains = finishChains;
  });
define("ember-metal/computed",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/utils","ember-metal/enumerable_utils","ember-metal/platform","ember-metal/watching","ember-metal/expand_properties","ember-metal/error","ember-metal/properties","ember-metal/property_events","ember-metal/is_empty","ember-metal/is_none","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var meta = __dependency4__.meta;
    var META_KEY = __dependency4__.META_KEY;
    var guidFor = __dependency4__.guidFor;
    var typeOf = __dependency4__.typeOf;
    var inspect = __dependency4__.inspect;
    var EnumerableUtils = __dependency5__["default"];
    var create = __dependency6__.create;
    var watch = __dependency7__.watch;
    var unwatch = __dependency7__.unwatch;
    var expandProperties = __dependency8__["default"];
    var EmberError = __dependency9__["default"];
    var Descriptor = __dependency10__.Descriptor;
    var defineProperty = __dependency10__.defineProperty;
    var propertyWillChange = __dependency11__.propertyWillChange;
    var propertyDidChange = __dependency11__.propertyDidChange;
    var isEmpty = __dependency12__["default"];
    var isNone = __dependency13__.isNone;

    /**
    @module ember-metal
    */

    Ember.warn("The CP_DEFAULT_CACHEABLE flag has been removed and computed properties are always cached by default. Use `volatile` if you don't want caching.", Ember.ENV.CP_DEFAULT_CACHEABLE !== false);


    var metaFor = meta,
        a_slice = [].slice,
        o_create = create;

    function UNDEFINED() { }

    var lengthPattern = /\.(length|\[\])$/;

    // ..........................................................
    // DEPENDENT KEYS
    //

    // data structure:
    //  meta.deps = {
    //    'depKey': {
    //      'keyName': count,
    //    }
    //  }

    /*
      This function returns a map of unique dependencies for a
      given object and key.
    */
    function keysForDep(depsMeta, depKey) {
      var keys = depsMeta[depKey];
      if (!keys) {
        // if there are no dependencies yet for a the given key
        // create a new empty list of dependencies for the key
        keys = depsMeta[depKey] = {};
      } else if (!depsMeta.hasOwnProperty(depKey)) {
        // otherwise if the dependency list is inherited from
        // a superclass, clone the hash
        keys = depsMeta[depKey] = o_create(keys);
      }
      return keys;
    }

    function metaForDeps(meta) {
      return keysForDep(meta, 'deps');
    }

    function addDependentKeys(desc, obj, keyName, meta) {
      // the descriptor has a list of dependent keys, so
      // add all of its dependent keys.
      var depKeys = desc._dependentKeys, depsMeta, idx, len, depKey, keys;
      if (!depKeys) return;

      depsMeta = metaForDeps(meta);

      for(idx = 0, len = depKeys.length; idx < len; idx++) {
        depKey = depKeys[idx];
        // Lookup keys meta for depKey
        keys = keysForDep(depsMeta, depKey);
        // Increment the number of times depKey depends on keyName.
        keys[keyName] = (keys[keyName] || 0) + 1;
        // Watch the depKey
        watch(obj, depKey, meta);
      }
    }

    function removeDependentKeys(desc, obj, keyName, meta) {
      // the descriptor has a list of dependent keys, so
      // add all of its dependent keys.
      var depKeys = desc._dependentKeys, depsMeta, idx, len, depKey, keys;
      if (!depKeys) return;

      depsMeta = metaForDeps(meta);

      for(idx = 0, len = depKeys.length; idx < len; idx++) {
        depKey = depKeys[idx];
        // Lookup keys meta for depKey
        keys = keysForDep(depsMeta, depKey);
        // Increment the number of times depKey depends on keyName.
        keys[keyName] = (keys[keyName] || 0) - 1;
        // Watch the depKey
        unwatch(obj, depKey, meta);
      }
    }

    // ..........................................................
    // COMPUTED PROPERTY
    //

    /**
      A computed property transforms an objects function into a property.

      By default the function backing the computed property will only be called
      once and the result will be cached. You can specify various properties
      that your computed property is dependent on. This will force the cached
      result to be recomputed if the dependencies are modified.

      In the following example we declare a computed property (by calling
      `.property()` on the fullName function) and setup the properties
      dependencies (depending on firstName and lastName). The fullName function
      will be called once (regardless of how many times it is accessed) as long
      as it's dependencies have not been changed. Once firstName or lastName are updated
      any future calls (or anything bound) to fullName will incorporate the new
      values.

      ```javascript
      var Person = Ember.Object.extend({
        // these will be supplied by `create`
        firstName: null,
        lastName: null,

        fullName: function() {
          var firstName = this.get('firstName');
          var lastName = this.get('lastName');

         return firstName + ' ' + lastName;
        }.property('firstName', 'lastName')
      });

      var tom = Person.create({
        firstName: 'Tom',
        lastName: 'Dale'
      });

      tom.get('fullName') // 'Tom Dale'
      ```

      You can also define what Ember should do when setting a computed property.
      If you try to set a computed property, it will be invoked with the key and
      value you want to set it to. You can also accept the previous value as the
      third parameter.

      ```javascript
      var Person = Ember.Object.extend({
        // these will be supplied by `create`
        firstName: null,
        lastName: null,

        fullName: function(key, value, oldValue) {
          // getter
          if (arguments.length === 1) {
            var firstName = this.get('firstName');
            var lastName = this.get('lastName');

            return firstName + ' ' + lastName;

          // setter
          } else {
            var name = value.split(' ');

            this.set('firstName', name[0]);
            this.set('lastName', name[1]);

            return value;
          }
        }.property('firstName', 'lastName')
      });

      var person = Person.create();

      person.set('fullName', 'Peter Wagenet');
      person.get('firstName'); // 'Peter'
      person.get('lastName');  // 'Wagenet'
      ```

      @class ComputedProperty
      @namespace Ember
      @extends Ember.Descriptor
      @constructor
    */
    function ComputedProperty(func, opts) {
      func.__ember_arity__ = func.length;
      this.func = func;

      this._cacheable = (opts && opts.cacheable !== undefined) ? opts.cacheable : true;
      this._dependentKeys = opts && opts.dependentKeys;
      this._readOnly = opts && (opts.readOnly !== undefined || !!opts.readOnly) || false;
    }

    ComputedProperty.prototype = new Descriptor();

    var ComputedPropertyPrototype = ComputedProperty.prototype;
    ComputedPropertyPrototype._dependentKeys = undefined;
    ComputedPropertyPrototype._suspended = undefined;
    ComputedPropertyPrototype._meta = undefined;

    /**
      Properties are cacheable by default. Computed property will automatically
      cache the return value of your function until one of the dependent keys changes.

      Call `volatile()` to set it into non-cached mode. When in this mode
      the computed property will not automatically cache the return value.

      However, if a property is properly observable, there is no reason to disable
      caching.

      @method cacheable
      @param {Boolean} aFlag optional set to `false` to disable caching
      @return {Ember.ComputedProperty} this
      @chainable
    */
    ComputedPropertyPrototype.cacheable = function(aFlag) {
      this._cacheable = aFlag !== false;
      return this;
    };

    /**
      Call on a computed property to set it into non-cached mode. When in this
      mode the computed property will not automatically cache the return value.

      ```javascript
      var outsideService = Ember.Object.extend({
        value: function() {
          return OutsideService.getValue();
        }.property().volatile()
      }).create();
      ```

      @method volatile
      @return {Ember.ComputedProperty} this
      @chainable
    */
    ComputedPropertyPrototype.volatile = function() {
      return this.cacheable(false);
    };

    /**
      Call on a computed property to set it into read-only mode. When in this
      mode the computed property will throw an error when set.

      ```javascript
      var Person = Ember.Object.extend({
        guid: function() {
          return 'guid-guid-guid';
        }.property().readOnly()
      });

      var person = Person.create();

      person.set('guid', 'new-guid'); // will throw an exception
      ```

      @method readOnly
      @return {Ember.ComputedProperty} this
      @chainable
    */
    ComputedPropertyPrototype.readOnly = function(readOnly) {
      this._readOnly = readOnly === undefined || !!readOnly;
      return this;
    };

    /**
      Sets the dependent keys on this computed property. Pass any number of
      arguments containing key paths that this computed property depends on.

      ```javascript
      var President = Ember.Object.extend({
        fullName: computed(function() {
          return this.get('firstName') + ' ' + this.get('lastName');

          // Tell Ember that this computed property depends on firstName
          // and lastName
        }).property('firstName', 'lastName')
      });

      var president = President.create({
        firstName: 'Barack',
        lastName: 'Obama',
      });

      president.get('fullName'); // 'Barack Obama'
      ```

      @method property
      @param {String} path* zero or more property paths
      @return {Ember.ComputedProperty} this
      @chainable
    */
    ComputedPropertyPrototype.property = function() {
      var args;

      var addArg = function (property) {
        args.push(property);
      };

      args = [];
      for (var i = 0, l = arguments.length; i < l; i++) {
        expandProperties(arguments[i], addArg);
      }

      this._dependentKeys = args;
      return this;
    };

    /**
      In some cases, you may want to annotate computed properties with additional
      metadata about how they function or what values they operate on. For example,
      computed property functions may close over variables that are then no longer
      available for introspection.

      You can pass a hash of these values to a computed property like this:

      ```
      person: function() {
        var personId = this.get('personId');
        return App.Person.create({ id: personId });
      }.property().meta({ type: App.Person })
      ```

      The hash that you pass to the `meta()` function will be saved on the
      computed property descriptor under the `_meta` key. Ember runtime
      exposes a public API for retrieving these values from classes,
      via the `metaForProperty()` function.

      @method meta
      @param {Hash} meta
      @chainable
    */

    ComputedPropertyPrototype.meta = function(meta) {
      if (arguments.length === 0) {
        return this._meta || {};
      } else {
        this._meta = meta;
        return this;
      }
    };

    /* impl descriptor API */
    ComputedPropertyPrototype.didChange = function(obj, keyName) {
      // _suspended is set via a CP.set to ensure we don't clear
      // the cached value set by the setter
      if (this._cacheable && this._suspended !== obj) {
        var meta = metaFor(obj);
        if (meta.cache[keyName] !== undefined) {
          meta.cache[keyName] = undefined;
          removeDependentKeys(this, obj, keyName, meta);
        }
      }
    };

    function finishChains(chainNodes)
    {
      for (var i=0, l=chainNodes.length; i<l; i++) {
        chainNodes[i].didChange(null);
      }
    }

    /**
      Access the value of the function backing the computed property.
      If this property has already been cached, return the cached result.
      Otherwise, call the function passing the property name as an argument.

      ```javascript
      var Person = Ember.Object.extend({
        fullName: function(keyName) {
          // the keyName parameter is 'fullName' in this case.
          return this.get('firstName') + ' ' + this.get('lastName');
        }.property('firstName', 'lastName')
      });


      var tom = Person.create({
        firstName: 'Tom',
        lastName: 'Dale'
      });

      tom.get('fullName') // 'Tom Dale'
      ```

      @method get
      @param {String} keyName The key being accessed.
      @return {Object} The return value of the function backing the CP.
    */
    ComputedPropertyPrototype.get = function(obj, keyName) {
      var ret, cache, meta, chainNodes;
      if (this._cacheable) {
        meta = metaFor(obj);
        cache = meta.cache;

        var result = cache[keyName];

        if (result === UNDEFINED) {
          return undefined;
        }  else if (result !== undefined) {
          return result;
        }

        ret = this.func.call(obj, keyName);
        if (ret === undefined) {
          cache[keyName] = UNDEFINED;
        } else {
          cache[keyName] = ret;
        }

        chainNodes = meta.chainWatchers && meta.chainWatchers[keyName];
        if (chainNodes) { finishChains(chainNodes); }
        addDependentKeys(this, obj, keyName, meta);
      } else {
        ret = this.func.call(obj, keyName);
      }
      return ret;
    };

    /**
      Set the value of a computed property. If the function that backs your
      computed property does not accept arguments then the default action for
      setting would be to define the property on the current object, and set
      the value of the property to the value being set.

      Generally speaking if you intend for your computed property to be set
      your backing function should accept either two or three arguments.

      @method set
      @param {String} keyName The key being accessed.
      @param {Object} newValue The new value being assigned.
      @param {String} oldValue The old value being replaced.
      @return {Object} The return value of the function backing the CP.
    */
    ComputedPropertyPrototype.set = function(obj, keyName, value) {
      var cacheable = this._cacheable,
          func = this.func,
          meta = metaFor(obj, cacheable),
          oldSuspended = this._suspended,
          hadCachedValue = false,
          cache = meta.cache,
          funcArgLength, cachedValue, ret;

      if (this._readOnly) {
        throw new EmberError('Cannot set read-only property "' + keyName + '" on object: ' + inspect(obj));
      }

      this._suspended = obj;

      try {

        if (cacheable && cache[keyName] !== undefined) {
          cachedValue = cache[keyName];
          hadCachedValue = true;
        }

        // Check if the CP has been wrapped. If it has, use the
        // length from the wrapped function.

        funcArgLength = func.wrappedFunction ? func.wrappedFunction.__ember_arity__ : func.__ember_arity__;

        // For backwards-compatibility with computed properties
        // that check for arguments.length === 2 to determine if
        // they are being get or set, only pass the old cached
        // value if the computed property opts into a third
        // argument.
        if (funcArgLength === 3) {
          ret = func.call(obj, keyName, value, cachedValue);
        } else if (funcArgLength === 2) {
          ret = func.call(obj, keyName, value);
        } else {
          defineProperty(obj, keyName, null, cachedValue);
          set(obj, keyName, value);
          return;
        }

        if (hadCachedValue && cachedValue === ret) { return; }

        var watched = meta.watching[keyName];
        if (watched) { propertyWillChange(obj, keyName); }

        if (hadCachedValue) {
          cache[keyName] = undefined;
        }

        if (cacheable) {
          if (!hadCachedValue) {
            addDependentKeys(this, obj, keyName, meta);
          }
          if (ret === undefined) {
            cache[keyName] = UNDEFINED;
          } else {
            cache[keyName] = ret;
          }
        }

        if (watched) { propertyDidChange(obj, keyName); }
      } finally {
        this._suspended = oldSuspended;
      }
      return ret;
    };

    /* called before property is overridden */
    ComputedPropertyPrototype.teardown = function(obj, keyName) {
      var meta = metaFor(obj);

      if (keyName in meta.cache) {
        removeDependentKeys(this, obj, keyName, meta);
      }

      if (this._cacheable) { delete meta.cache[keyName]; }

      return null; // no value to restore
    };


    /**
      This helper returns a new property descriptor that wraps the passed
      computed property function. You can use this helper to define properties
      with mixins or via `Ember.defineProperty()`.

      The function you pass will be used to both get and set property values.
      The function should accept two parameters, key and value. If value is not
      undefined you should set the value first. In either case return the
      current value of the property.

      @method computed
      @for Ember
      @param {Function} func The computed property function.
      @return {Ember.ComputedProperty} property descriptor instance
    */
    function computed(func) {
      var args;

      if (arguments.length > 1) {
        args = a_slice.call(arguments, 0, -1);
        func = a_slice.call(arguments, -1)[0];
      }

      if (typeof func !== "function") {
        throw new EmberError("Computed Property declared without a property function");
      }

      var cp = new ComputedProperty(func);

      if (args) {
        cp.property.apply(cp, args);
      }

      return cp;
    };

    /**
      Returns the cached value for a property, if one exists.
      This can be useful for peeking at the value of a computed
      property that is generated lazily, without accidentally causing
      it to be created.

      @method cacheFor
      @for Ember
      @param {Object} obj the object whose property you want to check
      @param {String} key the name of the property whose cached value you want
        to return
      @return {Object} the cached value
    */
    function cacheFor(obj, key) {
      var meta = obj[META_KEY],
          cache = meta && meta.cache,
          ret = cache && cache[key];

      if (ret === UNDEFINED) { return undefined; }
      return ret;
    };

    cacheFor.set = function(cache, key, value) {
      if (value === undefined) {
        cache[key] = UNDEFINED;
      } else {
        cache[key] = value;
      }
    };

    cacheFor.get = function(cache, key) {
      var ret = cache[key];
      if (ret === UNDEFINED) { return undefined; }
      return ret;
    };

    cacheFor.remove = function(cache, key) {
      cache[key] = undefined;
    };

    function getProperties(self, propertyNames) {
      var ret = {};
      for(var i = 0; i < propertyNames.length; i++) {
        ret[propertyNames[i]] = get(self, propertyNames[i]);
      }
      return ret;
    }

    function registerComputed(name, macro) {
      computed[name] = function(dependentKey) {
        var args = a_slice.call(arguments);
        return computed(dependentKey, function() {
          return macro.apply(this, args);
        });
      };
    };

    function registerComputedWithProperties(name, macro) {
      computed[name] = function() {
        var properties = a_slice.call(arguments);

        var computedFunc = computed(function() {
          return macro.apply(this, [getProperties(this, properties)]);
        });

        return computedFunc.property.apply(computedFunc, properties);
      };
    };

    /**
      A computed property that returns true if the value of the dependent
      property is null, an empty string, empty array, or empty function.

      Example

      ```javascript
      var ToDoList = Ember.Object.extend({
        done: Ember.computed.empty('todos')
      });

      var todoList = ToDoList.create({
        todos: ['Unit Test', 'Documentation', 'Release']
      });

      todoList.get('done'); // false
      todoList.get('todos').clear();
      todoList.get('done'); // true
      ```

      @since 1.6.0
      @method computed.empty
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which negate
      the original value for property
    */
    computed.empty = function (dependentKey) {
      return computed(dependentKey + '.length', function () {
        return isEmpty(get(this, dependentKey));
      });
    };

    /**
      A computed property that returns true if the value of the dependent
      property is NOT null, an empty string, empty array, or empty function.

      Note: When using `computed.notEmpty` to watch an array make sure to
      use the `array.[]` syntax so the computed can subscribe to transitions
      from empty to non-empty states.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        hasStuff: Ember.computed.notEmpty('backpack.[]')
      });

      var hamster = Hamster.create({ backpack: ['Food', 'Sleeping Bag', 'Tent'] });

      hamster.get('hasStuff');         // true
      hamster.get('backpack').clear(); // []
      hamster.get('hasStuff');         // false
      ```

      @method computed.notEmpty
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which returns true if
      original value for property is not empty.
    */
    registerComputed('notEmpty', function(dependentKey) {
      return !isEmpty(get(this, dependentKey));
    });

    /**
      A computed property that returns true if the value of the dependent
      property is null or undefined. This avoids errors from JSLint complaining
      about use of ==, which can be technically confusing.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        isHungry: Ember.computed.none('food')
      });

      var hamster = Hamster.create();

      hamster.get('isHungry'); // true
      hamster.set('food', 'Banana');
      hamster.get('isHungry'); // false
      hamster.set('food', null);
      hamster.get('isHungry'); // true
      ```

      @method computed.none
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which
      returns true if original value for property is null or undefined.
    */
    registerComputed('none', function(dependentKey) {
      return isNone(get(this, dependentKey));
    });

    /**
      A computed property that returns the inverse boolean value
      of the original value for the dependent property.

      Example

      ```javascript
      var User = Ember.Object.extend({
        isAnonymous: Ember.computed.not('loggedIn')
      });

      var user = User.create({loggedIn: false});

      user.get('isAnonymous'); // true
      user.set('loggedIn', true);
      user.get('isAnonymous'); // false
      ```

      @method computed.not
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which returns
      inverse of the original value for property
    */
    registerComputed('not', function(dependentKey) {
      return !get(this, dependentKey);
    });

    /**
      A computed property that converts the provided dependent property
      into a boolean value.

      ```javascript
      var Hamster = Ember.Object.extend({
        hasBananas: Ember.computed.bool('numBananas')
      });

      var hamster = Hamster.create();

      hamster.get('hasBananas'); // false
      hamster.set('numBananas', 0);
      hamster.get('hasBananas'); // false
      hamster.set('numBananas', 1);
      hamster.get('hasBananas'); // true
      hamster.set('numBananas', null);
      hamster.get('hasBananas'); // false
      ```

      @method computed.bool
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which converts
      to boolean the original value for property
    */
    registerComputed('bool', function(dependentKey) {
      return !!get(this, dependentKey);
    });

    /**
      A computed property which matches the original value for the
      dependent property against a given RegExp, returning `true`
      if they values matches the RegExp and `false` if it does not.

      Example

      ```javascript
      var User = Ember.Object.extend({
        hasValidEmail: Ember.computed.match('email', /^.+@.+\..+$/)
      });

      var user = User.create({loggedIn: false});

      user.get('hasValidEmail'); // false
      user.set('email', '');
      user.get('hasValidEmail'); // false
      user.set('email', 'ember_hamster@example.com');
      user.get('hasValidEmail'); // true
      ```

      @method computed.match
      @for Ember
      @param {String} dependentKey
      @param {RegExp} regexp
      @return {Ember.ComputedProperty} computed property which match
      the original value for property against a given RegExp
    */
    registerComputed('match', function(dependentKey, regexp) {
      var value = get(this, dependentKey);
      return typeof value === 'string' ? regexp.test(value) : false;
    });

    /**
      A computed property that returns true if the provided dependent property
      is equal to the given value.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        napTime: Ember.computed.equal('state', 'sleepy')
      });

      var hamster = Hamster.create();

      hamster.get('napTime'); // false
      hamster.set('state', 'sleepy');
      hamster.get('napTime'); // true
      hamster.set('state', 'hungry');
      hamster.get('napTime'); // false
      ```

      @method computed.equal
      @for Ember
      @param {String} dependentKey
      @param {String|Number|Object} value
      @return {Ember.ComputedProperty} computed property which returns true if
      the original value for property is equal to the given value.
    */
    registerComputed('equal', function(dependentKey, value) {
      return get(this, dependentKey) === value;
    });

    /**
      A computed property that returns true if the provied dependent property
      is greater than the provided value.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        hasTooManyBananas: Ember.computed.gt('numBananas', 10)
      });

      var hamster = Hamster.create();

      hamster.get('hasTooManyBananas'); // false
      hamster.set('numBananas', 3);
      hamster.get('hasTooManyBananas'); // false
      hamster.set('numBananas', 11);
      hamster.get('hasTooManyBananas'); // true
      ```

      @method computed.gt
      @for Ember
      @param {String} dependentKey
      @param {Number} value
      @return {Ember.ComputedProperty} computed property which returns true if
      the original value for property is greater then given value.
    */
    registerComputed('gt', function(dependentKey, value) {
      return get(this, dependentKey) > value;
    });

    /**
      A computed property that returns true if the provided dependent property
      is greater than or equal to the provided value.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        hasTooManyBananas: Ember.computed.gte('numBananas', 10)
      });

      var hamster = Hamster.create();

      hamster.get('hasTooManyBananas'); // false
      hamster.set('numBananas', 3);
      hamster.get('hasTooManyBananas'); // false
      hamster.set('numBananas', 10);
      hamster.get('hasTooManyBananas'); // true
      ```

      @method computed.gte
      @for Ember
      @param {String} dependentKey
      @param {Number} value
      @return {Ember.ComputedProperty} computed property which returns true if
      the original value for property is greater or equal then given value.
    */
    registerComputed('gte', function(dependentKey, value) {
      return get(this, dependentKey) >= value;
    });

    /**
      A computed property that returns true if the provided dependent property
      is less than the provided value.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        needsMoreBananas: Ember.computed.lt('numBananas', 3)
      });

      var hamster = Hamster.create();

      hamster.get('needsMoreBananas'); // true
      hamster.set('numBananas', 3);
      hamster.get('needsMoreBananas'); // false
      hamster.set('numBananas', 2);
      hamster.get('needsMoreBananas'); // true
      ```

      @method computed.lt
      @for Ember
      @param {String} dependentKey
      @param {Number} value
      @return {Ember.ComputedProperty} computed property which returns true if
      the original value for property is less then given value.
    */
    registerComputed('lt', function(dependentKey, value) {
      return get(this, dependentKey) < value;
    });

    /**
      A computed property that returns true if the provided dependent property
      is less than or equal to the provided value.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        needsMoreBananas: Ember.computed.lte('numBananas', 3)
      });

      var hamster = Hamster.create();

      hamster.get('needsMoreBananas'); // true
      hamster.set('numBananas', 5);
      hamster.get('needsMoreBananas'); // false
      hamster.set('numBananas', 3);
      hamster.get('needsMoreBananas'); // true
      ```

      @method computed.lte
      @for Ember
      @param {String} dependentKey
      @param {Number} value
      @return {Ember.ComputedProperty} computed property which returns true if
      the original value for property is less or equal then given value.
    */
    registerComputed('lte', function(dependentKey, value) {
      return get(this, dependentKey) <= value;
    });

    /**
      A computed property that performs a logical `and` on the
      original values for the provided dependent properties.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        readyForCamp: Ember.computed.and('hasTent', 'hasBackpack')
      });

      var hamster = Hamster.create();

      hamster.get('readyForCamp'); // false
      hamster.set('hasTent', true);
      hamster.get('readyForCamp'); // false
      hamster.set('hasBackpack', true);
      hamster.get('readyForCamp'); // true
      ```

      @method computed.and
      @for Ember
      @param {String} dependentKey*
      @return {Ember.ComputedProperty} computed property which performs
      a logical `and` on the values of all the original values for properties.
    */
    registerComputedWithProperties('and', function(properties) {
      for (var key in properties) {
        if (properties.hasOwnProperty(key) && !properties[key]) {
          return false;
        }
      }
      return true;
    });

    /**
      A computed property which performs a logical `or` on the
      original values for the provided dependent properties.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        readyForRain: Ember.computed.or('hasJacket', 'hasUmbrella')
      });

      var hamster = Hamster.create();

      hamster.get('readyForRain'); // false
      hamster.set('hasJacket', true);
      hamster.get('readyForRain'); // true
      ```

      @method computed.or
      @for Ember
      @param {String} dependentKey*
      @return {Ember.ComputedProperty} computed property which performs
      a logical `or` on the values of all the original values for properties.
    */
    registerComputedWithProperties('or', function(properties) {
      for (var key in properties) {
        if (properties.hasOwnProperty(key) && properties[key]) {
          return true;
        }
      }
      return false;
    });

    /**
      A computed property that returns the first truthy value
      from a list of dependent properties.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        hasClothes: Ember.computed.any('hat', 'shirt')
      });

      var hamster = Hamster.create();

      hamster.get('hasClothes'); // null
      hamster.set('shirt', 'Hawaiian Shirt');
      hamster.get('hasClothes'); // 'Hawaiian Shirt'
      ```

      @method computed.any
      @for Ember
      @param {String} dependentKey*
      @return {Ember.ComputedProperty} computed property which returns
      the first truthy value of given list of properties.
    */
    registerComputedWithProperties('any', function(properties) {
      for (var key in properties) {
        if (properties.hasOwnProperty(key) && properties[key]) {
          return properties[key];
        }
      }
      return null;
    });

    /**
      A computed property that returns the array of values
      for the provided dependent properties.

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        clothes: Ember.computed.collect('hat', 'shirt')
      });

      var hamster = Hamster.create();

      hamster.get('clothes'); // [null, null]
      hamster.set('hat', 'Camp Hat');
      hamster.set('shirt', 'Camp Shirt');
      hamster.get('clothes'); // ['Camp Hat', 'Camp Shirt']
      ```

      @method computed.collect
      @for Ember
      @param {String} dependentKey*
      @return {Ember.ComputedProperty} computed property which maps
      values of all passed properties in to an array.
    */
    registerComputedWithProperties('collect', function(properties) {
      var res = [];
      for (var key in properties) {
        if (properties.hasOwnProperty(key)) {
          if (isNone(properties[key])) {
            res.push(null);
          } else {
            res.push(properties[key]);
          }
        }
      }
      return res;
    });

    /**
      Creates a new property that is an alias for another property
      on an object. Calls to `get` or `set` this property behave as
      though they were called on the original property.

      ```javascript
      var Person = Ember.Object.extend({
        name: 'Alex Matchneer',
        nomen: Ember.computed.alias('name')
      });

      var alex = Person.create();

      alex.get('nomen'); // 'Alex Matchneer'
      alex.get('name');  // 'Alex Matchneer'

      alex.set('nomen', '@machty');
      alex.get('name');  // '@machty'
      ```

      @method computed.alias
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which creates an
      alias to the original value for property.
    */
    computed.alias = function(dependentKey) {
      return computed(dependentKey, function(key, value) {
        if (arguments.length > 1) {
          set(this, dependentKey, value);
          return get(this, dependentKey);
        } else {
          return get(this, dependentKey);
        }
      });
    };

    /**
      Where `computed.alias` aliases `get` and `set`, and allows for bidirectional
      data flow, `computed.oneWay` only provides an aliased `get`. The `set` will
      not mutate the upstream property, rather causes the current property to
      become the value set. This causes the downstream property to permanently
      diverge from the upstream property.

      Example

      ```javascript
      var User = Ember.Object.extend({
        firstName: null,
        lastName: null,
        nickName: Ember.computed.oneWay('firstName')
      });

      var teddy = User.create({
        firstName: 'Teddy',
        lastName:  'Zeenny'
      });

      teddy.get('nickName');              // 'Teddy'
      teddy.set('nickName', 'TeddyBear'); // 'TeddyBear'
      teddy.get('firstName');             // 'Teddy'
      ```

      @method computed.oneWay
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which creates a
      one way computed property to the original value for property.
    */
    computed.oneWay = function(dependentKey) {
      return computed(dependentKey, function() {
        return get(this, dependentKey);
      });
    };

    if (Ember.FEATURES.isEnabled('query-params-new')) {
      /**
        This is a more semantically meaningful alias of `computed.oneWay`,
        whose name is somewhat ambiguous as to which direction the data flows.

        @method computed.reads
        @for Ember
        @param {String} dependentKey
        @return {Ember.ComputedProperty} computed property which creates a
          one way computed property to the original value for property.
       */
      computed.reads = computed.oneWay;
    }

    /**
      Where `computed.oneWay` provides oneWay bindings, `computed.readOnly` provides
      a readOnly one way binding. Very often when using `computed.oneWay` one does
      not also want changes to propogate back up, as they will replace the value.

      This prevents the reverse flow, and also throws an exception when it occurs.

      Example

      ```javascript
      var User = Ember.Object.extend({
        firstName: null,
        lastName: null,
        nickName: Ember.computed.readOnly('firstName')
      });

      var teddy = User.create({
        firstName: 'Teddy',
        lastName:  'Zeenny'
      });

      teddy.get('nickName');              // 'Teddy'
      teddy.set('nickName', 'TeddyBear'); // throws Exception
      // throw new Ember.Error('Cannot Set: nickName on: <User:ember27288>' );`
      teddy.get('firstName');             // 'Teddy'
      ```

      @method computed.readOnly
      @for Ember
      @param {String} dependentKey
      @return {Ember.ComputedProperty} computed property which creates a
      one way computed property to the original value for property.
      @since 1.5.0
    */
    computed.readOnly = function(dependentKey) {
      return computed(dependentKey, function() {
        return get(this, dependentKey);
      }).readOnly();
    };
    /**
      A computed property that acts like a standard getter and setter,
      but returns the value at the provided `defaultPath` if the
      property itself has not been set to a value

      Example

      ```javascript
      var Hamster = Ember.Object.extend({
        wishList: Ember.computed.defaultTo('favoriteFood')
      });

      var hamster = Hamster.create({ favoriteFood: 'Banana' });

      hamster.get('wishList');                     // 'Banana'
      hamster.set('wishList', 'More Unit Tests');
      hamster.get('wishList');                     // 'More Unit Tests'
      hamster.get('favoriteFood');                 // 'Banana'
      ```

      @method computed.defaultTo
      @for Ember
      @param {String} defaultPath
      @return {Ember.ComputedProperty} computed property which acts like
      a standard getter and setter, but defaults to the value from `defaultPath`.
    */
    // ES6TODO: computed should have its own export path so you can do import {defaultTo} from computed
    computed.defaultTo = function(defaultPath) {
      return computed(function(key, newValue, cachedValue) {
        if (arguments.length === 1) {
          return get(this, defaultPath);
        }
        return newValue != null ? newValue : get(this, defaultPath);
      });
    };

    __exports__.ComputedProperty = ComputedProperty;
    __exports__.computed = computed;
    __exports__.cacheFor = cacheFor;
  });
define("ember-metal/core",
  ["exports"],
  function(__exports__) {
    "use strict";
    /*globals Em:true ENV EmberENV MetamorphENV:true */

    /**
    @module ember
    @submodule ember-metal
    */

    /**
      All Ember methods and functions are defined inside of this namespace. You
      generally should not add new properties to this namespace as it may be
      overwritten by future versions of Ember.

      You can also use the shorthand `Em` instead of `Ember`.

      Ember-Runtime is a framework that provides core functions for Ember including
      cross-platform functions, support for property observing and objects. Its
      focus is on small size and performance. You can use this in place of or
      along-side other cross-platform libraries such as jQuery.

      The core Runtime framework is based on the jQuery API with a number of
      performance optimizations.

      @class Ember
      @static
      @version 1.6.1
    */

    if ('undefined' === typeof Ember) {
      // Create core object. Make it act like an instance of Ember.Namespace so that
      // objects assigned to it are given a sane string representation.
      Ember = {};
    }

    // Default imports, exports and lookup to the global object;
    var imports = Ember.imports = Ember.imports || this;
    var exports = Ember.exports = Ember.exports || this;
    var lookup  = Ember.lookup  = Ember.lookup  || this;

    // aliases needed to keep minifiers from removing the global context
    exports.Em = exports.Ember = Ember;

    // Make sure these are set whether Ember was already defined or not

    Ember.isNamespace = true;

    Ember.toString = function() { return "Ember"; };


    /**
      @property VERSION
      @type String
      @default '1.6.1'
      @static
    */
    Ember.VERSION = '1.6.1';

    /**
      Standard environmental variables. You can define these in a global `EmberENV`
      variable before loading Ember to control various configuration settings.

      For backwards compatibility with earlier versions of Ember the global `ENV`
      variable will be used if `EmberENV` is not defined.

      @property ENV
      @type Hash
    */

    if (Ember.ENV) {
      // do nothing if Ember.ENV is already setup
    } else if ('undefined' !== typeof EmberENV) {
      Ember.ENV = EmberENV;
    } else if('undefined' !== typeof ENV) {
      Ember.ENV = ENV;
    } else {
      Ember.ENV = {};
    }

    Ember.config = Ember.config || {};

    // We disable the RANGE API by default for performance reasons
    if ('undefined' === typeof Ember.ENV.DISABLE_RANGE_API) {
      Ember.ENV.DISABLE_RANGE_API = true;
    }

    if ("undefined" === typeof MetamorphENV) {
      exports.MetamorphENV = {};
    }

    MetamorphENV.DISABLE_RANGE_API = Ember.ENV.DISABLE_RANGE_API;

    /**
      Hash of enabled Canary features. Add to before creating your application.

      You can also define `ENV.FEATURES` if you need to enable features flagged at runtime.

      @class FEATURES
      @namespace Ember
      @static
      @since 1.1.0
    */

    Ember.FEATURES = Ember.ENV.FEATURES || {};

    /**
      Test that a feature is enabled. Parsed by Ember's build tools to leave
      experimental features out of beta/stable builds.

      You can define the following configuration options:

      * `ENV.ENABLE_ALL_FEATURES` - force all features to be enabled.
      * `ENV.ENABLE_OPTIONAL_FEATURES` - enable any features that have not been explicitly
        enabled/disabled.

      @method isEnabled
      @param {String} feature
      @return {Boolean}
      @for Ember.FEATURES
      @since 1.1.0
    */

    Ember.FEATURES.isEnabled = function(feature) {
      var featureValue = Ember.FEATURES[feature];

      if (Ember.ENV.ENABLE_ALL_FEATURES) {
        return true;
      } else if (featureValue === true || featureValue === false || featureValue === undefined) {
        return featureValue;
      } else if (Ember.ENV.ENABLE_OPTIONAL_FEATURES) {
        return true;
      } else {
        return false;
      }
    };

    // ..........................................................
    // BOOTSTRAP
    //

    /**
      Determines whether Ember should enhance some built-in object prototypes to
      provide a more friendly API. If enabled, a few methods will be added to
      `Function`, `String`, and `Array`. `Object.prototype` will not be enhanced,
      which is the one that causes most trouble for people.

      In general we recommend leaving this option set to true since it rarely
      conflicts with other code. If you need to turn it off however, you can
      define an `ENV.EXTEND_PROTOTYPES` config to disable it.

      @property EXTEND_PROTOTYPES
      @type Boolean
      @default true
      @for Ember
    */
    Ember.EXTEND_PROTOTYPES = Ember.ENV.EXTEND_PROTOTYPES;

    if (typeof Ember.EXTEND_PROTOTYPES === 'undefined') {
      Ember.EXTEND_PROTOTYPES = true;
    }

    /**
      Determines whether Ember logs a full stack trace during deprecation warnings

      @property LOG_STACKTRACE_ON_DEPRECATION
      @type Boolean
      @default true
    */
    Ember.LOG_STACKTRACE_ON_DEPRECATION = (Ember.ENV.LOG_STACKTRACE_ON_DEPRECATION !== false);

    /**
      Determines whether Ember should add ECMAScript 5 shims to older browsers.

      @property SHIM_ES5
      @type Boolean
      @default Ember.EXTEND_PROTOTYPES
    */
    Ember.SHIM_ES5 = (Ember.ENV.SHIM_ES5 === false) ? false : Ember.EXTEND_PROTOTYPES;

    /**
      Determines whether Ember logs info about version of used libraries

      @property LOG_VERSION
      @type Boolean
      @default true
    */
    Ember.LOG_VERSION = (Ember.ENV.LOG_VERSION === false) ? false : true;

    /**
      Empty function. Useful for some operations. Always returns `this`.

      @method K
      @private
      @return {Object}
    */
    Ember.K = function() { return this; };


    // Stub out the methods defined by the ember-debug package in case it's not loaded

    if ('undefined' === typeof Ember.assert) { Ember.assert = Ember.K; }
    if ('undefined' === typeof Ember.warn) { Ember.warn = Ember.K; }
    if ('undefined' === typeof Ember.debug) { Ember.debug = Ember.K; }
    if ('undefined' === typeof Ember.runInDebug) { Ember.runInDebug = Ember.K; }
    if ('undefined' === typeof Ember.deprecate) { Ember.deprecate = Ember.K; }
    if ('undefined' === typeof Ember.deprecateFunc) {
      Ember.deprecateFunc = function(_, func) { return func; };
    }

    /**
      Previously we used `Ember.$.uuid`, however `$.uuid` has been removed from
      jQuery master. We'll just bootstrap our own uuid now.

      @property uuid
      @type Number
      @private
    */
    Ember.uuid = 0;

    __exports__["default"] = Ember;
  });
define("ember-metal/enumerable_utils",
  ["ember-metal/array","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var map, forEach, indexOf, splice, filter;

    var map = __dependency1__.map;
    var forEach = __dependency1__.forEach;
    var indexOf = __dependency1__.indexOf;
    var filter = __dependency1__.filter;

    // ES6TODO: doesn't array polyfills already do this?
    map     = Array.prototype.map     || map;
    forEach = Array.prototype.forEach || forEach;
    indexOf = Array.prototype.indexOf || indexOf;
    filter  = Array.prototype.filter   || filter;
    splice  = Array.prototype.splice;

    /**
     * Defines some convenience methods for working with Enumerables.
     * `Ember.EnumerableUtils` uses `Ember.ArrayPolyfills` when necessary.
     *
     * @class EnumerableUtils
     * @namespace Ember
     * @static
     * */
    var utils = {
      /**
       * Calls the map function on the passed object with a specified callback. This
       * uses `Ember.ArrayPolyfill`'s-map method when necessary.
       *
       * @method map
       * @param {Object} obj The object that should be mapped
       * @param {Function} callback The callback to execute
       * @param {Object} thisArg Value to use as this when executing *callback*
       *
       * @return {Array} An array of mapped values.
       */
      map: function(obj, callback, thisArg) {
        return obj.map ? obj.map.call(obj, callback, thisArg) : map.call(obj, callback, thisArg);
      },

      /**
       * Calls the forEach function on the passed object with a specified callback. This
       * uses `Ember.ArrayPolyfill`'s-forEach method when necessary.
       *
       * @method forEach
       * @param {Object} obj The object to call forEach on
       * @param {Function} callback The callback to execute
       * @param {Object} thisArg Value to use as this when executing *callback*
       *
       */
      forEach: function(obj, callback, thisArg) {
        return obj.forEach ? obj.forEach.call(obj, callback, thisArg) : forEach.call(obj, callback, thisArg);
      },

      /**
       * Calls the filter function on the passed object with a specified callback. This
       * uses `Ember.ArrayPolyfill`'s-filter method when necessary.
       *
       * @method filter
       * @param {Object} obj The object to call filter on
       * @param {Function} callback The callback to execute
       * @param {Object} thisArg Value to use as this when executing *callback*
       *
       * @return {Array} An array containing the filtered values
       * @since 1.4.0
       */
      filter: function(obj, callback, thisArg) {
        return obj.filter ? obj.filter.call(obj, callback, thisArg) : filter.call(obj, callback, thisArg);
      },

      /**
       * Calls the indexOf function on the passed object with a specified callback. This
       * uses `Ember.ArrayPolyfill`'s-indexOf method when necessary.
       *
       * @method indexOf
       * @param {Object} obj The object to call indexOn on
       * @param {Function} callback The callback to execute
       * @param {Object} index The index to start searching from
       *
       */
      indexOf: function(obj, element, index) {
        return obj.indexOf ? obj.indexOf.call(obj, element, index) : indexOf.call(obj, element, index);
      },

      /**
       * Returns an array of indexes of the first occurrences of the passed elements
       * on the passed object.
       *
       * ```javascript
       *  var array = [1, 2, 3, 4, 5];
       *  Ember.EnumerableUtils.indexesOf(array, [2, 5]); // [1, 4]
       *
       *  var fubar = "Fubarr";
       *  Ember.EnumerableUtils.indexesOf(fubar, ['b', 'r']); // [2, 4]
       * ```
       *
       * @method indexesOf
       * @param {Object} obj The object to check for element indexes
       * @param {Array} elements The elements to search for on *obj*
       *
       * @return {Array} An array of indexes.
       *
       */
      indexesOf: function(obj, elements) {
        return elements === undefined ? [] : utils.map(elements, function(item) {
          return utils.indexOf(obj, item);
        });
      },

      /**
       * Adds an object to an array. If the array already includes the object this
       * method has no effect.
       *
       * @method addObject
       * @param {Array} array The array the passed item should be added to
       * @param {Object} item The item to add to the passed array
       *
       * @return 'undefined'
       */
      addObject: function(array, item) {
        var index = utils.indexOf(array, item);
        if (index === -1) { array.push(item); }
      },

      /**
       * Removes an object from an array. If the array does not contain the passed
       * object this method has no effect.
       *
       * @method removeObject
       * @param {Array} array The array to remove the item from.
       * @param {Object} item The item to remove from the passed array.
       *
       * @return 'undefined'
       */
      removeObject: function(array, item) {
        var index = utils.indexOf(array, item);
        if (index !== -1) { array.splice(index, 1); }
      },

      _replace: function(array, idx, amt, objects) {
        var args = [].concat(objects), chunk, ret = [],
            // https://code.google.com/p/chromium/issues/detail?id=56588
            size = 60000, start = idx, ends = amt, count;

        while (args.length) {
          count = ends > size ? size : ends;
          if (count <= 0) { count = 0; }

          chunk = args.splice(0, size);
          chunk = [start, count].concat(chunk);

          start += size;
          ends -= count;

          ret = ret.concat(splice.apply(array, chunk));
        }
        return ret;
      },

      /**
       * Replaces objects in an array with the passed objects.
       *
       * ```javascript
       *   var array = [1,2,3];
       *   Ember.EnumerableUtils.replace(array, 1, 2, [4, 5]); // [1, 4, 5]
       *
       *   var array = [1,2,3];
       *   Ember.EnumerableUtils.replace(array, 1, 1, [4, 5]); // [1, 4, 5, 3]
       *
       *   var array = [1,2,3];
       *   Ember.EnumerableUtils.replace(array, 10, 1, [4, 5]); // [1, 2, 3, 4, 5]
       * ```
       *
       * @method replace
       * @param {Array} array The array the objects should be inserted into.
       * @param {Number} idx Starting index in the array to replace. If *idx* >=
       * length, then append to the end of the array.
       * @param {Number} amt Number of elements that should be removed from the array,
       * starting at *idx*
       * @param {Array} objects An array of zero or more objects that should be
       * inserted into the array at *idx*
       *
       * @return {Array} The modified array.
       */
      replace: function(array, idx, amt, objects) {
        if (array.replace) {
          return array.replace(idx, amt, objects);
        } else {
          return utils._replace(array, idx, amt, objects);
        }
      },

      /**
       * Calculates the intersection of two arrays. This method returns a new array
       * filled with the records that the two passed arrays share with each other.
       * If there is no intersection, an empty array will be returned.
       *
       * ```javascript
       * var array1 = [1, 2, 3, 4, 5];
       * var array2 = [1, 3, 5, 6, 7];
       *
       * Ember.EnumerableUtils.intersection(array1, array2); // [1, 3, 5]
       *
       * var array1 = [1, 2, 3];
       * var array2 = [4, 5, 6];
       *
       * Ember.EnumerableUtils.intersection(array1, array2); // []
       * ```
       *
       * @method intersection
       * @param {Array} array1 The first array
       * @param {Array} array2 The second array
       *
       * @return {Array} The intersection of the two passed arrays.
       */
      intersection: function(array1, array2) {
        var intersection = [];

        utils.forEach(array1, function(element) {
          if (utils.indexOf(array2, element) >= 0) {
            intersection.push(element);
          }
        });

        return intersection;
      }
    };

    __exports__["default"] = utils;
  });
define("ember-metal/error",
  ["ember-metal/platform","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var create = __dependency1__.create;

    var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

    /**
      A subclass of the JavaScript Error object for use in Ember.

      @class Error
      @namespace Ember
      @extends Error
      @constructor
    */
    var EmberError = function() {
      var tmp = Error.apply(this, arguments);

      // Adds a `stack` property to the given error object that will yield the
      // stack trace at the time captureStackTrace was called.
      // When collecting the stack trace all frames above the topmost call
      // to this function, including that call, will be left out of the
      // stack trace.
      // This is useful because we can hide Ember implementation details
      // that are not very helpful for the user.
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, Ember.Error);
      }
      // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
      for (var idx = 0; idx < errorProps.length; idx++) {
        this[errorProps[idx]] = tmp[errorProps[idx]];
      }
    };

    EmberError.prototype = create(Error.prototype);

    __exports__["default"] = EmberError;
  });
define("ember-metal/events",
  ["ember-metal/core","ember-metal/utils","ember-metal/platform","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /**
    @module ember-metal
    */
    var Ember = __dependency1__["default"];
    var meta = __dependency2__.meta;
    var META_KEY = __dependency2__.META_KEY;
    var tryFinally = __dependency2__.tryFinally;
    var apply = __dependency2__.apply;
    var applyStr = __dependency2__.applyStr;
    var create = __dependency3__.create;

    var a_slice = [].slice,
        metaFor = meta,
        /* listener flags */
        ONCE = 1, SUSPENDED = 2;


    /*
      The event system uses a series of nested hashes to store listeners on an
      object. When a listener is registered, or when an event arrives, these
      hashes are consulted to determine which target and action pair to invoke.

      The hashes are stored in the object's meta hash, and look like this:

          // Object's meta hash
          {
            listeners: {       // variable name: `listenerSet`
              "foo:changed": [ // variable name: `actions`
                target, method, flags
              ]
            }
          }

    */

    function indexOf(array, target, method) {
      var index = -1;
      // hashes are added to the end of the event array
      // so it makes sense to start searching at the end
      // of the array and search in reverse
      for (var i = array.length - 3 ; i >=0; i -= 3) {
        if (target === array[i] && method === array[i + 1]) {
             index = i; break;
        }
      }
      return index;
    }

    function actionsFor(obj, eventName) {
      var meta = metaFor(obj, true),
          actions;

      if (!meta.listeners) { meta.listeners = {}; }

      if (!meta.hasOwnProperty('listeners')) {
        // setup inherited copy of the listeners object
        meta.listeners = create(meta.listeners);
      }

      actions = meta.listeners[eventName];

      // if there are actions, but the eventName doesn't exist in our listeners, then copy them from the prototype
      if (actions && !meta.listeners.hasOwnProperty(eventName)) {
        actions = meta.listeners[eventName] = meta.listeners[eventName].slice();
      } else if (!actions) {
        actions = meta.listeners[eventName] = [];
      }

      return actions;
    }

    function listenersUnion(obj, eventName, otherActions) {
      var meta = obj[META_KEY],
          actions = meta && meta.listeners && meta.listeners[eventName];

      if (!actions) { return; }
      for (var i = actions.length - 3; i >= 0; i -= 3) {
        var target = actions[i],
            method = actions[i+1],
            flags = actions[i+2],
            actionIndex = indexOf(otherActions, target, method);

        if (actionIndex === -1) {
          otherActions.push(target, method, flags);
        }
      }
    }

    function listenersDiff(obj, eventName, otherActions) {
      var meta = obj[META_KEY],
          actions = meta && meta.listeners && meta.listeners[eventName],
          diffActions = [];

      if (!actions) { return; }
      for (var i = actions.length - 3; i >= 0; i -= 3) {
        var target = actions[i],
            method = actions[i+1],
            flags = actions[i+2],
            actionIndex = indexOf(otherActions, target, method);

        if (actionIndex !== -1) { continue; }

        otherActions.push(target, method, flags);
        diffActions.push(target, method, flags);
      }

      return diffActions;
    }

    /**
      Add an event listener

      @method addListener
      @for Ember
      @param obj
      @param {String} eventName
      @param {Object|Function} targetOrMethod A target object or a function
      @param {Function|String} method A function or the name of a function to be called on `target`
      @param {Boolean} once A flag whether a function should only be called once
    */
    function addListener(obj, eventName, target, method, once) {
      Ember.assert("You must pass at least an object and event name to Ember.addListener", !!obj && !!eventName);

      if (!method && 'function' === typeof target) {
        method = target;
        target = null;
      }

      var actions = actionsFor(obj, eventName),
          actionIndex = indexOf(actions, target, method),
          flags = 0;

      if (once) flags |= ONCE;

      if (actionIndex !== -1) { return; }

      actions.push(target, method, flags);

      if ('function' === typeof obj.didAddListener) {
        obj.didAddListener(eventName, target, method);
      }
    }

    /**
      Remove an event listener

      Arguments should match those passed to `Ember.addListener`.

      @method removeListener
      @for Ember
      @param obj
      @param {String} eventName
      @param {Object|Function} targetOrMethod A target object or a function
      @param {Function|String} method A function or the name of a function to be called on `target`
    */
    function removeListener(obj, eventName, target, method) {
      Ember.assert("You must pass at least an object and event name to Ember.removeListener", !!obj && !!eventName);

      if (!method && 'function' === typeof target) {
        method = target;
        target = null;
      }

      function _removeListener(target, method) {
        var actions = actionsFor(obj, eventName),
            actionIndex = indexOf(actions, target, method);

        // action doesn't exist, give up silently
        if (actionIndex === -1) { return; }

        actions.splice(actionIndex, 3);

        if ('function' === typeof obj.didRemoveListener) {
          obj.didRemoveListener(eventName, target, method);
        }
      }

      if (method) {
        _removeListener(target, method);
      } else {
        var meta = obj[META_KEY],
            actions = meta && meta.listeners && meta.listeners[eventName];

        if (!actions) { return; }
        for (var i = actions.length - 3; i >= 0; i -= 3) {
          _removeListener(actions[i], actions[i+1]);
        }
      }
    }

    /**
      Suspend listener during callback.

      This should only be used by the target of the event listener
      when it is taking an action that would cause the event, e.g.
      an object might suspend its property change listener while it is
      setting that property.

      @method suspendListener
      @for Ember

      @private
      @param obj
      @param {String} eventName
      @param {Object|Function} targetOrMethod A target object or a function
      @param {Function|String} method A function or the name of a function to be called on `target`
      @param {Function} callback
    */
    function suspendListener(obj, eventName, target, method, callback) {
      if (!method && 'function' === typeof target) {
        method = target;
        target = null;
      }

      var actions = actionsFor(obj, eventName),
          actionIndex = indexOf(actions, target, method);

      if (actionIndex !== -1) {
        actions[actionIndex+2] |= SUSPENDED; // mark the action as suspended
      }

      function tryable()   { return callback.call(target); }
      function finalizer() { if (actionIndex !== -1) { actions[actionIndex+2] &= ~SUSPENDED; } }

      return tryFinally(tryable, finalizer);
    }

    /**
      Suspends multiple listeners during a callback.

      @method suspendListeners
      @for Ember

      @private
      @param obj
      @param {Array} eventName Array of event names
      @param {Object|Function} targetOrMethod A target object or a function
      @param {Function|String} method A function or the name of a function to be called on `target`
      @param {Function} callback
    */
    function suspendListeners(obj, eventNames, target, method, callback) {
      if (!method && 'function' === typeof target) {
        method = target;
        target = null;
      }

      var suspendedActions = [],
          actionsList = [],
          eventName, actions, i, l;

      for (i=0, l=eventNames.length; i<l; i++) {
        eventName = eventNames[i];
        actions = actionsFor(obj, eventName);
        var actionIndex = indexOf(actions, target, method);

        if (actionIndex !== -1) {
          actions[actionIndex+2] |= SUSPENDED;
          suspendedActions.push(actionIndex);
          actionsList.push(actions);
        }
      }

      function tryable() { return callback.call(target); }

      function finalizer() {
        for (var i = 0, l = suspendedActions.length; i < l; i++) {
          var actionIndex = suspendedActions[i];
          actionsList[i][actionIndex+2] &= ~SUSPENDED;
        }
      }

      return tryFinally(tryable, finalizer);
    }

    /**
      Return a list of currently watched events

      @private
      @method watchedEvents
      @for Ember
      @param obj
    */
    function watchedEvents(obj) {
      var listeners = obj[META_KEY].listeners, ret = [];

      if (listeners) {
        for(var eventName in listeners) {
          if (listeners[eventName]) { ret.push(eventName); }
        }
      }
      return ret;
    }

    /**
      Send an event. The execution of suspended listeners
      is skipped, and once listeners are removed. A listener without
      a target is executed on the passed object. If an array of actions
      is not passed, the actions stored on the passed object are invoked.

      @method sendEvent
      @for Ember
      @param obj
      @param {String} eventName
      @param {Array} params Optional parameters for each listener.
      @param {Array} actions Optional array of actions (listeners).
      @return true
    */
    function sendEvent(obj, eventName, params, actions) {
      // first give object a chance to handle it
      if (obj !== Ember && 'function' === typeof obj.sendEvent) {
        obj.sendEvent(eventName, params);
      }

      if (!actions) {
        var meta = obj[META_KEY];
        actions = meta && meta.listeners && meta.listeners[eventName];
      }

      if (!actions) { return; }

      for (var i = actions.length - 3; i >= 0; i -= 3) { // looping in reverse for once listeners
        var target = actions[i], method = actions[i+1], flags = actions[i+2];
        if (!method) { continue; }
        if (flags & SUSPENDED) { continue; }
        if (flags & ONCE) { removeListener(obj, eventName, target, method); }
        if (!target) { target = obj; }
        if ('string' === typeof method) {
          if (params) {
            applyStr(target, method, params);
          } else {
            target[method]();
          }
        } else {
          if (params) {
            apply(target, method, params);
          } else {
            method.call(target);
          }
        }
      }
      return true;
    }

    /**
      @private
      @method hasListeners
      @for Ember
      @param obj
      @param {String} eventName
    */
    function hasListeners(obj, eventName) {
      var meta = obj[META_KEY],
          actions = meta && meta.listeners && meta.listeners[eventName];

      return !!(actions && actions.length);
    }

    /**
      @private
      @method listenersFor
      @for Ember
      @param obj
      @param {String} eventName
    */
    function listenersFor(obj, eventName) {
      var ret = [];
      var meta = obj[META_KEY],
          actions = meta && meta.listeners && meta.listeners[eventName];

      if (!actions) { return ret; }

      for (var i = 0, l = actions.length; i < l; i += 3) {
        var target = actions[i],
            method = actions[i+1];
        ret.push([target, method]);
      }

      return ret;
    }

    /**
      Define a property as a function that should be executed when
      a specified event or events are triggered.


      ``` javascript
      var Job = Ember.Object.extend({
        logCompleted: Ember.on('completed', function() {
          console.log('Job completed!');
        })
      });

      var job = Job.create();

      Ember.sendEvent(job, 'completed'); // Logs 'Job completed!'
     ```

      @method on
      @for Ember
      @param {String} eventNames*
      @param {Function} func
      @return func
    */
    function on(){
      var func = a_slice.call(arguments, -1)[0],
          events = a_slice.call(arguments, 0, -1);
      func.__ember_listens__ = events;
      return func;
    };

    __exports__.on = on;
    __exports__.addListener = addListener;
    __exports__.removeListener = removeListener;
    __exports__.suspendListener = suspendListener;
    __exports__.suspendListeners = suspendListeners;
    __exports__.sendEvent = sendEvent;
    __exports__.hasListeners = hasListeners;
    __exports__.watchedEvents = watchedEvents;
    __exports__.listenersFor = listenersFor;
    __exports__.listenersDiff = listenersDiff;
    __exports__.listenersUnion = listenersUnion;
  });
define("ember-metal/expand_properties",
  ["ember-metal/error","ember-metal/enumerable_utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var EmberError = __dependency1__["default"];
    var EnumerableUtils = __dependency2__["default"];

    /**
      @module ember-metal
      */

    var forEach = EnumerableUtils.forEach,
      BRACE_EXPANSION = /^((?:[^\.]*\.)*)\{(.*)\}$/;

    /**
      Expands `pattern`, invoking `callback` for each expansion.

      The only pattern supported is brace-expansion, anything else will be passed
      once to `callback` directly. Brace expansion can only appear at the end of a
      pattern, for an example see the last call below.

      Example
      ```js
      function echo(arg){ console.log(arg); }

      Ember.expandProperties('foo.bar', echo);        //=> 'foo.bar'
      Ember.expandProperties('{foo,bar}', echo);      //=> 'foo', 'bar'
      Ember.expandProperties('foo.{bar,baz}', echo);  //=> 'foo.bar', 'foo.baz'
      Ember.expandProperties('{foo,bar}.baz', echo);  //=> '{foo,bar}.baz'
      ```

      @method
      @private
      @param {string} pattern The property pattern to expand.
      @param {function} callback The callback to invoke.  It is invoked once per
      expansion, and is passed the expansion.
      */
    function expandProperties(pattern, callback) {
      var match, prefix, list;

      if (pattern.indexOf(' ') > -1) {
        throw new EmberError('Brace expanded properties cannot contain spaces, ' + 
          'e.g. `user.{firstName, lastName}` should be `user.{firstName,lastName}`');
      }

      if (match = BRACE_EXPANSION.exec(pattern)) {
        prefix = match[1];
        list = match[2];

        forEach(list.split(','), function (suffix) {
            callback(prefix + suffix);
        });
      } else {
        callback(pattern);
      }
    };

    __exports__["default"] = expandProperties;
  });
define("ember-metal/get_properties",
  ["ember-metal/property_get","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var typeOf = __dependency2__.typeOf;

    /**
      To get multiple properties at once, call `Ember.getProperties`
      with an object followed by a list of strings or an array:

      ```javascript
      Ember.getProperties(record, 'firstName', 'lastName', 'zipCode');
      // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
      ```

      is equivalent to:

      ```javascript
      Ember.getProperties(record, ['firstName', 'lastName', 'zipCode']);
      // { firstName: 'John', lastName: 'Doe', zipCode: '10011' }
      ```

      @method getProperties
      @param obj
      @param {String...|Array} list of keys to get
      @return {Hash}
    */
    function getProperties(obj) {
      var ret = {},
          propertyNames = arguments,
          i = 1;

      if (arguments.length === 2 && typeOf(arguments[1]) === 'array') {
        i = 0;
        propertyNames = arguments[1];
      }
      for(var len = propertyNames.length; i < len; i++) {
        ret[propertyNames[i]] = get(obj, propertyNames[i]);
      }
      return ret;
    };

    __exports__["default"] = getProperties;
  });
define("ember-metal/instrumentation",
  ["ember-metal/core","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var tryCatchFinally = __dependency2__.tryCatchFinally;

    /**
      The purpose of the Ember Instrumentation module is
      to provide efficient, general-purpose instrumentation
      for Ember.

      Subscribe to a listener by using `Ember.subscribe`:

      ```javascript
      Ember.subscribe("render", {
        before: function(name, timestamp, payload) {

        },

        after: function(name, timestamp, payload) {

        }
      });
      ```

      If you return a value from the `before` callback, that same
      value will be passed as a fourth parameter to the `after`
      callback.

      Instrument a block of code by using `Ember.instrument`:

      ```javascript
      Ember.instrument("render.handlebars", payload, function() {
        // rendering logic
      }, binding);
      ```

      Event names passed to `Ember.instrument` are namespaced
      by periods, from more general to more specific. Subscribers
      can listen for events by whatever level of granularity they
      are interested in.

      In the above example, the event is `render.handlebars`,
      and the subscriber listened for all events beginning with
      `render`. It would receive callbacks for events named
      `render`, `render.handlebars`, `render.container`, or
      even `render.handlebars.layout`.

      @class Instrumentation
      @namespace Ember
      @static
    */
    var subscribers = [], cache = {};

    var populateListeners = function(name) {
      var listeners = [], subscriber;

      for (var i=0, l=subscribers.length; i<l; i++) {
        subscriber = subscribers[i];
        if (subscriber.regex.test(name)) {
          listeners.push(subscriber.object);
        }
      }

      cache[name] = listeners;
      return listeners;
    };

    var time = (function() {
      var perf = 'undefined' !== typeof window ? window.performance || {} : {};
      var fn = perf.now || perf.mozNow || perf.webkitNow || perf.msNow || perf.oNow;
      // fn.bind will be available in all the browsers that support the advanced window.performance... ;-)
      return fn ? fn.bind(perf) : function() { return +new Date(); };
    })();

    /**
      Notifies event's subscribers, calls `before` and `after` hooks.

      @method instrument
      @namespace Ember.Instrumentation

      @param {String} [name] Namespaced event name.
      @param {Object} payload
      @param {Function} callback Function that you're instrumenting.
      @param {Object} binding Context that instrument function is called with.
    */
    function instrument(name, payload, callback, binding) {
      var listeners = cache[name], timeName, ret;

      // ES6TODO: Docs. What is this?
      if (Ember.STRUCTURED_PROFILE) {
        timeName = name + ": " + payload.object;
        console.time(timeName);
      }

      if (!listeners) {
        listeners = populateListeners(name);
      }

      if (listeners.length === 0) {
        ret = callback.call(binding);
        if (Ember.STRUCTURED_PROFILE) { console.timeEnd(timeName); }
        return ret;
      }

      var beforeValues = [], listener, i, l;

      function tryable() {
        for (i=0, l=listeners.length; i<l; i++) {
          listener = listeners[i];
          beforeValues[i] = listener.before(name, time(), payload);
        }

        return callback.call(binding);
      }

      function catchable(e) {
        payload = payload || {};
        payload.exception = e;
      }

      function finalizer() {
        for (i=0, l=listeners.length; i<l; i++) {
          listener = listeners[i];
          listener.after(name, time(), payload, beforeValues[i]);
        }

        if (Ember.STRUCTURED_PROFILE) {
          console.timeEnd(timeName);
        }
      }

      return tryCatchFinally(tryable, catchable, finalizer);
    };

    /**
      Subscribes to a particular event or instrumented block of code.

      @method subscribe
      @namespace Ember.Instrumentation

      @param {String} [pattern] Namespaced event name.
      @param {Object} [object] Before and After hooks.

      @return {Subscriber}
    */
    function subscribe(pattern, object) {
      var paths = pattern.split("."), path, regex = [];

      for (var i=0, l=paths.length; i<l; i++) {
        path = paths[i];
        if (path === "*") {
          regex.push("[^\\.]*");
        } else {
          regex.push(path);
        }
      }

      regex = regex.join("\\.");
      regex = regex + "(\\..*)?";

      var subscriber = {
        pattern: pattern,
        regex: new RegExp("^" + regex + "$"),
        object: object
      };

      subscribers.push(subscriber);
      cache = {};

      return subscriber;
    };

    /**
      Unsubscribes from a particular event or instrumented block of code.

      @method unsubscribe
      @namespace Ember.Instrumentation

      @param {Object} [subscriber]
    */
    function unsubscribe(subscriber) {
      var index;

      for (var i=0, l=subscribers.length; i<l; i++) {
        if (subscribers[i] === subscriber) {
          index = i;
        }
      }

      subscribers.splice(index, 1);
      cache = {};
    };

    /**
      Resets `Ember.Instrumentation` by flushing list of subscribers.

      @method reset
      @namespace Ember.Instrumentation
    */
    function reset() {
      subscribers = [];
      cache = {};
    };

    __exports__.instrument = instrument;
    __exports__.subscribe = subscribe;
    __exports__.unsubscribe = unsubscribe;
    __exports__.reset = reset;
  });
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
define("ember-metal/is_none",
  ["ember-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // deprecateFunc

    /**
      Returns true if the passed value is null or undefined. This avoids errors
      from JSLint complaining about use of ==, which can be technically
      confusing.

      ```javascript
      Ember.isNone();              // true
      Ember.isNone(null);          // true
      Ember.isNone(undefined);     // true
      Ember.isNone('');            // false
      Ember.isNone([]);            // false
      Ember.isNone(function() {});  // false
      ```

      @method isNone
      @for Ember
      @param {Object} obj Value to test
      @return {Boolean}
    */
    var isNone = function(obj) {
      return obj === null || obj === undefined;
    };
    var none = Ember.deprecateFunc("Ember.none is deprecated. Please use Ember.isNone instead.", isNone);

    __exports__["default"] = isNone;
    __exports__.isNone = isNone;
    __exports__.none = none;
  });
define("ember-metal/libraries",
  ["ember-metal/enumerable_utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    // Provides a way to register library versions with ember.
    var EnumerableUtils = __dependency1__["default"];

    var forEach = EnumerableUtils.forEach,
        indexOf = EnumerableUtils.indexOf;

    var libraries = function() {
      var _libraries   = [];
      var coreLibIndex = 0;

      var getLibrary = function(name) {
        for (var i = 0; i < _libraries.length; i++) {
          if (_libraries[i].name === name) {
            return _libraries[i];
          }
        }
      };

      _libraries.register = function(name, version) {
        if (!getLibrary(name)) {
          _libraries.push({name: name, version: version});
        }
      };

      _libraries.registerCoreLibrary = function(name, version) {
        if (!getLibrary(name)) {
          _libraries.splice(coreLibIndex++, 0, {name: name, version: version});
        }
      };

      _libraries.deRegister = function(name) {
        var lib = getLibrary(name);
        if (lib) _libraries.splice(indexOf(_libraries, lib), 1);
      };

      _libraries.each = function (callback) {
        forEach(_libraries, function(lib) {
          callback(lib.name, lib.version);
        });
      };

      return _libraries;
    }();

    __exports__["default"] = libraries;
  });
define("ember-metal/logger",
  ["ember-metal/core","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var EmberError = __dependency2__["default"];

    function consoleMethod(name) {
      var consoleObj, logToConsole;
      if (Ember.imports.console) {
        consoleObj = Ember.imports.console;
      } else if (typeof console !== 'undefined') {
        consoleObj = console;
      }

      var method = typeof consoleObj === 'object' ? consoleObj[name] : null;

      if (method) {
        // Older IE doesn't support apply, but Chrome needs it
        if (typeof method.apply === 'function') {
          logToConsole = function() {
            method.apply(consoleObj, arguments);
          };
          logToConsole.displayName = 'console.' + name;
          return logToConsole;
        } else {
          return function() {
            var message = Array.prototype.join.call(arguments, ', ');
            method(message);
          };
        }
      }
    }

    function assertPolyfill(test, message) {
      if (!test) {
        try {
          // attempt to preserve the stack
          throw new EmberError("assertion failed: " + message);
        } catch(error) {
          setTimeout(function() {
            throw error;
          }, 0);
        }
      }
    }

    /**
      Inside Ember-Metal, simply uses the methods from `imports.console`.
      Override this to provide more robust logging functionality.

      @class Logger
      @namespace Ember
    */
    var Logger = {
      /**
       Logs the arguments to the console.
       You can pass as many arguments as you want and they will be joined together with a space.

        ```javascript
        var foo = 1;
        Ember.Logger.log('log value of foo:', foo);
        // "log value of foo: 1" will be printed to the console
        ```

       @method log
       @for Ember.Logger
       @param {*} arguments
      */
      log:   consoleMethod('log')   || Ember.K,

      /**
       Prints the arguments to the console with a warning icon.
       You can pass as many arguments as you want and they will be joined together with a space.

        ```javascript
        Ember.Logger.warn('Something happened!');
        // "Something happened!" will be printed to the console with a warning icon.
        ```

       @method warn
       @for Ember.Logger
       @param {*} arguments
      */
      warn:  consoleMethod('warn')  || Ember.K,

      /**
       Prints the arguments to the console with an error icon, red text and a stack trace.
       You can pass as many arguments as you want and they will be joined together with a space.

        ```javascript
        Ember.Logger.error('Danger! Danger!');
        // "Danger! Danger!" will be printed to the console in red text.
        ```

       @method error
       @for Ember.Logger
       @param {*} arguments
      */
      error: consoleMethod('error') || Ember.K,

      /**
       Logs the arguments to the console.
       You can pass as many arguments as you want and they will be joined together with a space.

        ```javascript
        var foo = 1;
        Ember.Logger.info('log value of foo:', foo);
        // "log value of foo: 1" will be printed to the console
        ```

       @method info
       @for Ember.Logger
       @param {*} arguments
      */
      info:  consoleMethod('info')  || Ember.K,

      /**
       Logs the arguments to the console in blue text.
       You can pass as many arguments as you want and they will be joined together with a space.

        ```javascript
        var foo = 1;
        Ember.Logger.debug('log value of foo:', foo);
        // "log value of foo: 1" will be printed to the console
        ```

       @method debug
       @for Ember.Logger
       @param {*} arguments
      */
      debug: consoleMethod('debug') || consoleMethod('info') || Ember.K,

      /**
       If the value passed into `Ember.Logger.assert` is not truthy it will throw an error with a stack trace.

        ```javascript
        Ember.Logger.assert(true); // undefined
        Ember.Logger.assert(true === false); // Throws an Assertion failed error.
        ```

       @method assert
       @for Ember.Logger
       @param {Boolean} bool Value to test
      */
      assert: consoleMethod('assert') || assertPolyfill
    };

    __exports__["default"] = Logger;
  });
define("ember-metal",
  ["ember-metal/core","ember-metal/merge","ember-metal/instrumentation","ember-metal/utils","ember-metal/error","ember-metal/enumerable_utils","ember-metal/platform","ember-metal/array","ember-metal/logger","ember-metal/property_get","ember-metal/events","ember-metal/observer_set","ember-metal/property_events","ember-metal/properties","ember-metal/property_set","ember-metal/map","ember-metal/get_properties","ember-metal/set_properties","ember-metal/watch_key","ember-metal/chains","ember-metal/watch_path","ember-metal/watching","ember-metal/expand_properties","ember-metal/computed","ember-metal/observer","ember-metal/mixin","ember-metal/binding","ember-metal/run_loop","ember-metal/libraries","ember-metal/is_none","ember-metal/is_empty","ember-metal/is_blank","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __dependency26__, __dependency27__, __dependency28__, __dependency29__, __dependency30__, __dependency31__, __dependency32__, __exports__) {
    "use strict";
    /**
    Ember Metal

    @module ember
    @submodule ember-metal
    */

    // BEGIN IMPORTS
    var Ember = __dependency1__["default"];
    var merge = __dependency2__["default"];
    var instrument = __dependency3__.instrument;
    var subscribe = __dependency3__.subscribe;
    var unsubscribe = __dependency3__.unsubscribe;
    var reset = __dependency3__.reset;
    var generateGuid = __dependency4__.generateGuid;
    var GUID_KEY = __dependency4__.GUID_KEY;
    var GUID_PREFIX = __dependency4__.GUID_PREFIX;
    var guidFor = __dependency4__.guidFor;
    var META_DESC = __dependency4__.META_DESC;
    var EMPTY_META = __dependency4__.EMPTY_META;
    var meta = __dependency4__.meta;
    var getMeta = __dependency4__.getMeta;
    var setMeta = __dependency4__.setMeta;
    var metaPath = __dependency4__.metaPath;
    var inspect = __dependency4__.inspect;
    var typeOf = __dependency4__.typeOf;
    var tryCatchFinally = __dependency4__.tryCatchFinally;
    var isArray = __dependency4__.isArray;
    var makeArray = __dependency4__.makeArray;
    var canInvoke = __dependency4__.canInvoke;
    var tryInvoke = __dependency4__.tryInvoke;
    var tryFinally = __dependency4__.tryFinally;
    var wrap = __dependency4__.wrap;
    var apply = __dependency4__.apply;
    var applyStr = __dependency4__.applyStr;
    var EmberError = __dependency5__["default"];
    var EnumerableUtils = __dependency6__["default"];

    var create = __dependency7__.create;
    var platform = __dependency7__.platform;
    var map = __dependency8__.map;
    var forEach = __dependency8__.forEach;
    var filter = __dependency8__.filter;
    var indexOf = __dependency8__.indexOf;
    var Logger = __dependency9__["default"];

    var get = __dependency10__.get;
    var getWithDefault = __dependency10__.getWithDefault;
    var normalizeTuple = __dependency10__.normalizeTuple;
    var _getPath = __dependency10__._getPath;

    var on = __dependency11__.on;
    var addListener = __dependency11__.addListener;
    var removeListener = __dependency11__.removeListener;
    var suspendListener = __dependency11__.suspendListener;
    var suspendListeners = __dependency11__.suspendListeners;
    var sendEvent = __dependency11__.sendEvent;
    var hasListeners = __dependency11__.hasListeners;
    var watchedEvents = __dependency11__.watchedEvents;
    var listenersFor = __dependency11__.listenersFor;
    var listenersDiff = __dependency11__.listenersDiff;
    var listenersUnion = __dependency11__.listenersUnion;

    var ObserverSet = __dependency12__["default"];

    var propertyWillChange = __dependency13__.propertyWillChange;
    var propertyDidChange = __dependency13__.propertyDidChange;
    var overrideChains = __dependency13__.overrideChains;
    var beginPropertyChanges = __dependency13__.beginPropertyChanges;
    var endPropertyChanges = __dependency13__.endPropertyChanges;
    var changeProperties = __dependency13__.changeProperties;

    var Descriptor = __dependency14__.Descriptor;
    var defineProperty = __dependency14__.defineProperty;
    var set = __dependency15__.set;
    var trySet = __dependency15__.trySet;

    var OrderedSet = __dependency16__.OrderedSet;
    var Map = __dependency16__.Map;
    var MapWithDefault = __dependency16__.MapWithDefault;
    var getProperties = __dependency17__["default"];
    var setProperties = __dependency18__["default"];
    var watchKey = __dependency19__.watchKey;
    var unwatchKey = __dependency19__.unwatchKey;
    var flushPendingChains = __dependency20__.flushPendingChains;
    var removeChainWatcher = __dependency20__.removeChainWatcher;
    var ChainNode = __dependency20__.ChainNode;
    var finishChains = __dependency20__.finishChains;
    var watchPath = __dependency21__.watchPath;
    var unwatchPath = __dependency21__.unwatchPath;
    var watch = __dependency22__.watch;
    var isWatching = __dependency22__.isWatching;
    var unwatch = __dependency22__.unwatch;
    var rewatch = __dependency22__.rewatch;
    var destroy = __dependency22__.destroy;
    var expandProperties = __dependency23__["default"];
    var ComputedProperty = __dependency24__.ComputedProperty;
    var computed = __dependency24__.computed;
    var cacheFor = __dependency24__.cacheFor;

    var addObserver = __dependency25__.addObserver;
    var observersFor = __dependency25__.observersFor;
    var removeObserver = __dependency25__.removeObserver;
    var addBeforeObserver = __dependency25__.addBeforeObserver;
    var _suspendBeforeObserver = __dependency25__._suspendBeforeObserver;
    var _suspendObserver = __dependency25__._suspendObserver;
    var _suspendBeforeObservers = __dependency25__._suspendBeforeObservers;
    var _suspendObservers = __dependency25__._suspendObservers;
    var beforeObserversFor = __dependency25__.beforeObserversFor;
    var removeBeforeObserver = __dependency25__.removeBeforeObserver;
    var IS_BINDING = __dependency26__.IS_BINDING;
    var mixin = __dependency26__.mixin;
    var Mixin = __dependency26__.Mixin;
    var required = __dependency26__.required;
    var aliasMethod = __dependency26__.aliasMethod;
    var observer = __dependency26__.observer;
    var immediateObserver = __dependency26__.immediateObserver;
    var beforeObserver = __dependency26__.beforeObserver;
    var Binding = __dependency27__.Binding;
    var isGlobalPath = __dependency27__.isGlobalPath;
    var bind = __dependency27__.bind;
    var oneWay = __dependency27__.oneWay;
    var run = __dependency28__["default"];
    var libraries = __dependency29__["default"];
    var isNone = __dependency30__.isNone;
    var none = __dependency30__.none;
    var isEmpty = __dependency31__.isEmpty;
    var empty = __dependency31__.empty;
    var isBlank = __dependency32__["default"];
    // END IMPORTS

    // BEGIN EXPORTS
    var EmberInstrumentation = Ember.Instrumentation = {};
    EmberInstrumentation.instrument = instrument;
    EmberInstrumentation.subscribe = subscribe;
    EmberInstrumentation.unsubscribe = unsubscribe;
    EmberInstrumentation.reset  = reset;

    Ember.instrument = instrument;
    Ember.subscribe = subscribe;

    Ember.generateGuid    = generateGuid;
    Ember.GUID_KEY        = GUID_KEY;
    Ember.GUID_PREFIX     = GUID_PREFIX;
    Ember.create          = create;
    Ember.platform        = platform;

    var EmberArrayPolyfills = Ember.ArrayPolyfills = {};

    EmberArrayPolyfills.map = map;
    EmberArrayPolyfills.forEach = forEach;
    EmberArrayPolyfills.filter = filter;
    EmberArrayPolyfills.indexOf = indexOf;

    Ember.Error           = EmberError;
    Ember.guidFor         = guidFor;
    Ember.META_DESC       = META_DESC;
    Ember.EMPTY_META      = EMPTY_META;
    Ember.meta            = meta;
    Ember.getMeta         = getMeta;
    Ember.setMeta         = setMeta;
    Ember.metaPath        = metaPath;
    Ember.inspect         = inspect;
    Ember.typeOf          = typeOf;
    Ember.tryCatchFinally = tryCatchFinally;
    Ember.isArray         = isArray;
    Ember.makeArray       = makeArray;
    Ember.canInvoke       = canInvoke;
    Ember.tryInvoke       = tryInvoke;
    Ember.tryFinally      = tryFinally;
    Ember.wrap            = wrap;
    Ember.apply           = apply;
    Ember.applyStr        = applyStr;

    Ember.Logger = Logger;

    Ember.get            = get;
    Ember.getWithDefault = getWithDefault;
    Ember.normalizeTuple = normalizeTuple;
    Ember._getPath       = _getPath;

    Ember.EnumerableUtils = EnumerableUtils;

    Ember.on                = on;
    Ember.addListener       = addListener;
    Ember.removeListener    = removeListener;
    Ember._suspendListener  = suspendListener;
    Ember._suspendListeners = suspendListeners;
    Ember.sendEvent         = sendEvent;
    Ember.hasListeners      = hasListeners;
    Ember.watchedEvents     = watchedEvents;
    Ember.listenersFor      = listenersFor;
    Ember.listenersDiff     = listenersDiff;
    Ember.listenersUnion    = listenersUnion;

    Ember._ObserverSet = ObserverSet;

    Ember.propertyWillChange = propertyWillChange;
    Ember.propertyDidChange = propertyDidChange;
    Ember.overrideChains = overrideChains;
    Ember.beginPropertyChanges = beginPropertyChanges;
    Ember.endPropertyChanges = endPropertyChanges;
    Ember.changeProperties = changeProperties;

    Ember.Descriptor     = Descriptor;
    Ember.defineProperty = defineProperty;

    Ember.set    = set;
    Ember.trySet = trySet;

    Ember.OrderedSet = OrderedSet;
    Ember.Map = Map;
    Ember.MapWithDefault = MapWithDefault;

    Ember.getProperties = getProperties;
    Ember.setProperties = setProperties;

    Ember.watchKey   = watchKey;
    Ember.unwatchKey = unwatchKey;

    Ember.flushPendingChains = flushPendingChains;
    Ember.removeChainWatcher = removeChainWatcher;
    Ember._ChainNode = ChainNode;
    Ember.finishChains = finishChains;

    Ember.watchPath = watchPath;
    Ember.unwatchPath = unwatchPath;

    Ember.watch = watch;
    Ember.isWatching = isWatching;
    Ember.unwatch = unwatch;
    Ember.rewatch = rewatch;
    Ember.destroy = destroy;

    Ember.expandProperties = expandProperties;

    Ember.ComputedProperty = ComputedProperty;
    Ember.computed = computed;
    Ember.cacheFor = cacheFor;

    Ember.addObserver = addObserver;
    Ember.observersFor = observersFor;
    Ember.removeObserver = removeObserver;
    Ember.addBeforeObserver = addBeforeObserver;
    Ember._suspendBeforeObserver = _suspendBeforeObserver;
    Ember._suspendBeforeObservers = _suspendBeforeObservers;
    Ember._suspendObserver = _suspendObserver;
    Ember._suspendObservers = _suspendObservers;
    Ember.beforeObserversFor = beforeObserversFor;
    Ember.removeBeforeObserver = removeBeforeObserver;

    Ember.IS_BINDING = IS_BINDING;
    Ember.required = required;
    Ember.aliasMethod = aliasMethod;
    Ember.observer = observer;
    Ember.immediateObserver = immediateObserver;
    Ember.beforeObserver = beforeObserver;
    Ember.mixin = mixin;
    Ember.Mixin = Mixin;

    Ember.oneWay = oneWay;
    Ember.bind = bind;
    Ember.Binding = Binding;
    Ember.isGlobalPath = isGlobalPath;

    Ember.run = run;

    Ember.libraries = libraries;
    Ember.libraries.registerCoreLibrary('Ember', Ember.VERSION);

    Ember.isNone = isNone;
    Ember.none = none;

    Ember.isEmpty = isEmpty;
    Ember.empty = empty;

    Ember.isBlank = isBlank;

    Ember.merge = merge;

    /**
      A function may be assigned to `Ember.onerror` to be called when Ember
      internals encounter an error. This is useful for specialized error handling
      and reporting code.

      ```javascript
      Ember.onerror = function(error) {
        Em.$.ajax('/report-error', 'POST', {
          stack: error.stack,
          otherInformation: 'whatever app state you want to provide'
        });
      };
      ```

      Internally, `Ember.onerror` is used as Backburner's error handler.

      @event onerror
      @for Ember
      @param {Exception} error the error object
    */
    Ember.onerror = null;
    // END EXPORTS

    // do this for side-effects of updating Ember.assert, warn, etc when
    // ember-debug is present
    if (Ember.__loader.registry['ember-debug']) {
      requireModule('ember-debug');
    }

    __exports__["default"] = Ember;
  });
define("ember-metal/map",
  ["ember-metal/property_set","ember-metal/utils","ember-metal/array","ember-metal/platform","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    /**
    @module ember-metal
    */

    /*
      JavaScript (before ES6) does not have a Map implementation. Objects,
      which are often used as dictionaries, may only have Strings as keys.

      Because Ember has a way to get a unique identifier for every object
      via `Ember.guidFor`, we can implement a performant Map with arbitrary
      keys. Because it is commonly used in low-level bookkeeping, Map is
      implemented as a pure JavaScript object for performance.

      This implementation follows the current iteration of the ES6 proposal for
      maps (http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets),
      with two exceptions. First, because we need our implementation to be pleasant
      on older browsers, we do not use the `delete` name (using `remove` instead).
      Second, as we do not have the luxury of in-VM iteration, we implement a
      forEach method for iteration.

      Map is mocked out to look like an Ember object, so you can do
      `Ember.Map.create()` for symmetry with other Ember classes.
    */

    var set = __dependency1__.set;
    var guidFor = __dependency2__.guidFor;
    var indexOf = __dependency3__.indexOf;var create = __dependency4__.create;

    var copy = function(obj) {
      var output = {};

      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) { output[prop] = obj[prop]; }
      }

      return output;
    };

    var copyMap = function(original, newObject) {
      var keys = original.keys.copy(),
          values = copy(original.values);

      newObject.keys = keys;
      newObject.values = values;
      newObject.length = original.length;

      return newObject;
    };

    /**
      This class is used internally by Ember and Ember Data.
      Please do not use it at this time. We plan to clean it up
      and add many tests soon.

      @class OrderedSet
      @namespace Ember
      @constructor
      @private
    */
    function OrderedSet() {
      this.clear();
    };

    /**
      @method create
      @static
      @return {Ember.OrderedSet}
    */
    OrderedSet.create = function() {
      return new OrderedSet();
    };


    OrderedSet.prototype = {
      /**
        @method clear
      */
      clear: function() {
        this.presenceSet = {};
        this.list = [];
      },

      /**
        @method add
        @param obj
      */
      add: function(obj) {
        var guid = guidFor(obj),
            presenceSet = this.presenceSet,
            list = this.list;

        if (guid in presenceSet) { return; }

        presenceSet[guid] = true;
        list.push(obj);
      },

      /**
        @method remove
        @param obj
      */
      remove: function(obj) {
        var guid = guidFor(obj),
            presenceSet = this.presenceSet,
            list = this.list;

        delete presenceSet[guid];

        var index = indexOf.call(list, obj);
        if (index > -1) {
          list.splice(index, 1);
        }
      },

      /**
        @method isEmpty
        @return {Boolean}
      */
      isEmpty: function() {
        return this.list.length === 0;
      },

      /**
        @method has
        @param obj
        @return {Boolean}
      */
      has: function(obj) {
        var guid = guidFor(obj),
            presenceSet = this.presenceSet;

        return guid in presenceSet;
      },

      /**
        @method forEach
        @param {Function} fn
        @param self
      */
      forEach: function(fn, self) {
        // allow mutation during iteration
        var list = this.toArray();

        for (var i = 0, j = list.length; i < j; i++) {
          fn.call(self, list[i]);
        }
      },

      /**
        @method toArray
        @return {Array}
      */
      toArray: function() {
        return this.list.slice();
      },

      /**
        @method copy
        @return {Ember.OrderedSet}
      */
      copy: function() {
        var set = new OrderedSet();

        set.presenceSet = copy(this.presenceSet);
        set.list = this.toArray();

        return set;
      }
    };

    /**
      A Map stores values indexed by keys. Unlike JavaScript's
      default Objects, the keys of a Map can be any JavaScript
      object.

      Internally, a Map has two data structures:

      1. `keys`: an OrderedSet of all of the existing keys
      2. `values`: a JavaScript Object indexed by the `Ember.guidFor(key)`

      When a key/value pair is added for the first time, we
      add the key to the `keys` OrderedSet, and create or
      replace an entry in `values`. When an entry is deleted,
      we delete its entry in `keys` and `values`.

      @class Map
      @namespace Ember
      @private
      @constructor
    */
    var Map = Ember.Map = function() {
      this.keys = OrderedSet.create();
      this.values = {};
    };

    /**
      @method create
      @static
    */
    Map.create = function() {
      return new Map();
    };

    Map.prototype = {
      /**
        This property will change as the number of objects in the map changes.

        @property length
        @type number
        @default 0
      */
      length: 0,


      /**
        Retrieve the value associated with a given key.

        @method get
        @param {*} key
        @return {*} the value associated with the key, or `undefined`
      */
      get: function(key) {
        var values = this.values,
            guid = guidFor(key);

        return values[guid];
      },

      /**
        Adds a value to the map. If a value for the given key has already been
        provided, the new value will replace the old value.

        @method set
        @param {*} key
        @param {*} value
      */
      set: function(key, value) {
        var keys = this.keys,
            values = this.values,
            guid = guidFor(key);

        keys.add(key);
        values[guid] = value;
        set(this, 'length', keys.list.length);
      },

      /**
        Removes a value from the map for an associated key.

        @method remove
        @param {*} key
        @return {Boolean} true if an item was removed, false otherwise
      */
      remove: function(key) {
        // don't use ES6 "delete" because it will be annoying
        // to use in browsers that are not ES6 friendly;
        var keys = this.keys,
            values = this.values,
            guid = guidFor(key);

        if (values.hasOwnProperty(guid)) {
          keys.remove(key);
          delete values[guid];
          set(this, 'length', keys.list.length);
          return true;
        } else {
          return false;
        }
      },

      /**
        Check whether a key is present.

        @method has
        @param {*} key
        @return {Boolean} true if the item was present, false otherwise
      */
      has: function(key) {
        var values = this.values,
            guid = guidFor(key);

        return values.hasOwnProperty(guid);
      },

      /**
        Iterate over all the keys and values. Calls the function once
        for each key, passing in the key and value, in that order.

        The keys are guaranteed to be iterated over in insertion order.

        @method forEach
        @param {Function} callback
        @param {*} self if passed, the `this` value inside the
          callback. By default, `this` is the map.
      */
      forEach: function(callback, self) {
        var keys = this.keys,
            values = this.values;

        keys.forEach(function(key) {
          var guid = guidFor(key);
          callback.call(self, key, values[guid]);
        });
      },

      /**
        @method copy
        @return {Ember.Map}
      */
      copy: function() {
        return copyMap(this, new Map());
      }
    };

    /**
      @class MapWithDefault
      @namespace Ember
      @extends Ember.Map
      @private
      @constructor
      @param [options]
        @param {*} [options.defaultValue]
    */
    function MapWithDefault(options) {
      Map.call(this);
      this.defaultValue = options.defaultValue;
    };

    /**
      @method create
      @static
      @param [options]
        @param {*} [options.defaultValue]
      @return {Ember.MapWithDefault|Ember.Map} If options are passed, returns
        `Ember.MapWithDefault` otherwise returns `Ember.Map`
    */
    MapWithDefault.create = function(options) {
      if (options) {
        return new MapWithDefault(options);
      } else {
        return new Map();
      }
    };

    MapWithDefault.prototype = create(Map.prototype);

    /**
      Retrieve the value associated with a given key.

      @method get
      @param {*} key
      @return {*} the value associated with the key, or the default value
    */
    MapWithDefault.prototype.get = function(key) {
      var hasValue = this.has(key);

      if (hasValue) {
        return Map.prototype.get.call(this, key);
      } else {
        var defaultValue = this.defaultValue(key);
        this.set(key, defaultValue);
        return defaultValue;
      }
    };

    /**
      @method copy
      @return {Ember.MapWithDefault}
    */
    MapWithDefault.prototype.copy = function() {
      return copyMap(this, new MapWithDefault({
        defaultValue: this.defaultValue
      }));
    };

    __exports__.OrderedSet = OrderedSet;
    __exports__.Map = Map;
    __exports__.MapWithDefault = MapWithDefault;
  });
define("ember-metal/merge",
  ["exports"],
  function(__exports__) {
    "use strict";
    /**
      Merge the contents of two objects together into the first object.

      ```javascript
      Ember.merge({first: 'Tom'}, {last: 'Dale'}); // {first: 'Tom', last: 'Dale'}
      var a = {first: 'Yehuda'}, b = {last: 'Katz'};
      Ember.merge(a, b); // a == {first: 'Yehuda', last: 'Katz'}, b == {last: 'Katz'}
      ```

      @method merge
      @for Ember
      @param {Object} original The object to merge into
      @param {Object} updates The object to copy properties from
      @return {Object}
    */
    function merge(original, updates) {
      for (var prop in updates) {
        if (!updates.hasOwnProperty(prop)) { continue; }
        original[prop] = updates[prop];
      }
      return original;
    };

    __exports__["default"] = merge;
  });
define("ember-metal/mixin",
  ["ember-metal/core","ember-metal/merge","ember-metal/array","ember-metal/platform","ember-metal/utils","ember-metal/expand_properties","ember-metal/properties","ember-metal/computed","ember-metal/binding","ember-metal/observer","ember-metal/events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-metal
    */

    var Ember = __dependency1__["default"];
    // warn, assert, wrap, et;
    var merge = __dependency2__["default"];
    var map = __dependency3__.map;
    var indexOf = __dependency3__.indexOf;
    var forEach = __dependency3__.forEach;
    var create = __dependency4__.create;
    var guidFor = __dependency5__.guidFor;
    var meta = __dependency5__.meta;
    var META_KEY = __dependency5__.META_KEY;
    var wrap = __dependency5__.wrap;
    var makeArray = __dependency5__.makeArray;
    var apply = __dependency5__.apply;
    var expandProperties = __dependency6__["default"];
    var Descriptor = __dependency7__.Descriptor;
    var defineProperty = __dependency7__.defineProperty;
    var ComputedProperty = __dependency8__.ComputedProperty;
    var Binding = __dependency9__.Binding;
    var addObserver = __dependency10__.addObserver;
    var removeObserver = __dependency10__.removeObserver;
    var addBeforeObserver = __dependency10__.addBeforeObserver;
    var removeBeforeObserver = __dependency10__.removeBeforeObserver;
    var addListener = __dependency11__.addListener;
    var removeListener = __dependency11__.removeListener;

    var REQUIRED, Alias,
        a_map = map,
        a_indexOf = indexOf,
        a_forEach = forEach,
        a_slice = [].slice,
        o_create = create,
        defineProperty = defineProperty,
        metaFor = meta;

    function superFunction(){
      var ret, func = this.__nextSuper;
      if (func) {
        this.__nextSuper = null;
        ret = apply(this, func, arguments);
        this.__nextSuper = func;
      }
      return ret;
    }

    function mixinsMeta(obj) {
      var m = metaFor(obj, true), ret = m.mixins;
      if (!ret) {
        ret = m.mixins = {};
      } else if (!m.hasOwnProperty('mixins')) {
        ret = m.mixins = o_create(ret);
      }
      return ret;
    }

    function initMixin(mixin, args) {
      if (args && args.length > 0) {
        mixin.mixins = a_map.call(args, function(x) {
          if (x instanceof Mixin) { return x; }

          // Note: Manually setup a primitive mixin here. This is the only
          // way to actually get a primitive mixin. This way normal creation
          // of mixins will give you combined mixins...
          var mixin = new Mixin();
          mixin.properties = x;
          return mixin;
        });
      }
      return mixin;
    }

    function isMethod(obj) {
      return 'function' === typeof obj &&
             obj.isMethod !== false &&
             obj !== Boolean && obj !== Object && obj !== Number && obj !== Array && obj !== Date && obj !== String;
    }

    var CONTINUE = {};

    function mixinProperties(mixinsMeta, mixin) {
      var guid;

      if (mixin instanceof Mixin) {
        guid = guidFor(mixin);
        if (mixinsMeta[guid]) { return CONTINUE; }
        mixinsMeta[guid] = mixin;
        return mixin.properties;
      } else {
        return mixin; // apply anonymous mixin properties
      }
    }

    function concatenatedMixinProperties(concatProp, props, values, base) {
      var concats;

      // reset before adding each new mixin to pickup concats from previous
      concats = values[concatProp] || base[concatProp];
      if (props[concatProp]) {
        concats = concats ? concats.concat(props[concatProp]) : props[concatProp];
      }

      return concats;
    }

    function giveDescriptorSuper(meta, key, property, values, descs) {
      var superProperty;

      // Computed properties override methods, and do not call super to them
      if (values[key] === undefined) {
        // Find the original descriptor in a parent mixin
        superProperty = descs[key];
      }

      // If we didn't find the original descriptor in a parent mixin, find
      // it on the original object.
      superProperty = superProperty || meta.descs[key];

      if (!superProperty || !(superProperty instanceof ComputedProperty)) {
        return property;
      }

      // Since multiple mixins may inherit from the same parent, we need
      // to clone the computed property so that other mixins do not receive
      // the wrapped version.
      property = o_create(property);
      property.func = wrap(property.func, superProperty.func);

      return property;
    }

    function giveMethodSuper(obj, key, method, values, descs) {
      var superMethod;

      // Methods overwrite computed properties, and do not call super to them.
      if (descs[key] === undefined) {
        // Find the original method in a parent mixin
        superMethod = values[key];
      }

      // If we didn't find the original value in a parent mixin, find it in
      // the original object
      superMethod = superMethod || obj[key];

      // Only wrap the new method if the original method was a function
      if ('function' !== typeof superMethod) {
        return method;
      }

      return wrap(method, superMethod);
    }

    function applyConcatenatedProperties(obj, key, value, values) {
      var baseValue = values[key] || obj[key];

      if (baseValue) {
        if ('function' === typeof baseValue.concat) {
          return baseValue.concat(value);
        } else {
          return makeArray(baseValue).concat(value);
        }
      } else {
        return makeArray(value);
      }
    }

    function applyMergedProperties(obj, key, value, values) {
      var baseValue = values[key] || obj[key];

      if (!baseValue) { return value; }

      var newBase = merge({}, baseValue),
          hasFunction = false;

      for (var prop in value) {
        if (!value.hasOwnProperty(prop)) { continue; }

        var propValue = value[prop];
        if (isMethod(propValue)) {
          // TODO: support for Computed Properties, etc?
          hasFunction = true;
          newBase[prop] = giveMethodSuper(obj, prop, propValue, baseValue, {});
        } else {
          newBase[prop] = propValue;
        }
      }

      if (hasFunction) {
        newBase._super = superFunction;
      }

      return newBase;
    }

    function addNormalizedProperty(base, key, value, meta, descs, values, concats, mergings) {
      if (value instanceof Descriptor) {
        if (value === REQUIRED && descs[key]) { return CONTINUE; }

        // Wrap descriptor function to implement
        // __nextSuper() if needed
        if (value.func) {
          value = giveDescriptorSuper(meta, key, value, values, descs);
        }

        descs[key]  = value;
        values[key] = undefined;
      } else {
        if ((concats && a_indexOf.call(concats, key) >= 0) ||
                    key === 'concatenatedProperties' ||
                    key === 'mergedProperties') {
          value = applyConcatenatedProperties(base, key, value, values);
        } else if ((mergings && a_indexOf.call(mergings, key) >= 0)) {
          value = applyMergedProperties(base, key, value, values);
        } else if (isMethod(value)) {
          value = giveMethodSuper(base, key, value, values, descs);
        }

        descs[key] = undefined;
        values[key] = value;
      }
    }

    function mergeMixins(mixins, m, descs, values, base, keys) {
      var mixin, props, key, concats, mergings, meta;

      function removeKeys(keyName) {
        delete descs[keyName];
        delete values[keyName];
      }

      for(var i=0, l=mixins.length; i<l; i++) {
        mixin = mixins[i];
        Ember.assert('Expected hash or Mixin instance, got ' + Object.prototype.toString.call(mixin),
                     typeof mixin === 'object' && mixin !== null && Object.prototype.toString.call(mixin) !== '[object Array]');

        props = mixinProperties(m, mixin);
        if (props === CONTINUE) { continue; }

        if (props) {
          meta = metaFor(base);
          if (base.willMergeMixin) { base.willMergeMixin(props); }
          concats = concatenatedMixinProperties('concatenatedProperties', props, values, base);
          mergings = concatenatedMixinProperties('mergedProperties', props, values, base);

          for (key in props) {
            if (!props.hasOwnProperty(key)) { continue; }
            keys.push(key);
            addNormalizedProperty(base, key, props[key], meta, descs, values, concats, mergings);
          }

          // manually copy toString() because some JS engines do not enumerate it
          if (props.hasOwnProperty('toString')) { base.toString = props.toString; }
        } else if (mixin.mixins) {
          mergeMixins(mixin.mixins, m, descs, values, base, keys);
          if (mixin._without) { a_forEach.call(mixin._without, removeKeys); }
        }
      }
    }

    var IS_BINDING = /^.+Binding$/;

    function detectBinding(obj, key, value, m) {
      if (IS_BINDING.test(key)) {
        var bindings = m.bindings;
        if (!bindings) {
          bindings = m.bindings = {};
        } else if (!m.hasOwnProperty('bindings')) {
          bindings = m.bindings = o_create(m.bindings);
        }
        bindings[key] = value;
      }
    }

    function connectBindings(obj, m) {
      // TODO Mixin.apply(instance) should disconnect binding if exists
      var bindings = m.bindings, key, binding, to;
      if (bindings) {
        for (key in bindings) {
          binding = bindings[key];
          if (binding) {
            to = key.slice(0, -7); // strip Binding off end
            if (binding instanceof Binding) {
              binding = binding.copy(); // copy prototypes' instance
              binding.to(to);
            } else { // binding is string path
              binding = new Binding(to, binding);
            }
            binding.connect(obj);
            obj[key] = binding;
          }
        }
        // mark as applied
        m.bindings = {};
      }
    }

    function finishPartial(obj, m) {
      connectBindings(obj, m || metaFor(obj));
      return obj;
    }

    function followAlias(obj, desc, m, descs, values) {
      var altKey = desc.methodName, value;
      if (descs[altKey] || values[altKey]) {
        value = values[altKey];
        desc  = descs[altKey];
      } else if (m.descs[altKey]) {
        desc  = m.descs[altKey];
        value = undefined;
      } else {
        desc = undefined;
        value = obj[altKey];
      }

      return { desc: desc, value: value };
    }

    function updateObserversAndListeners(obj, key, observerOrListener, pathsKey, updateMethod) {
      var paths = observerOrListener[pathsKey];

      if (paths) {
        for (var i=0, l=paths.length; i<l; i++) {
          updateMethod(obj, paths[i], null, key);
        }
      }
    }

    function replaceObserversAndListeners(obj, key, observerOrListener) {
      var prev = obj[key];

      if ('function' === typeof prev) {
        updateObserversAndListeners(obj, key, prev, '__ember_observesBefore__', removeBeforeObserver);
        updateObserversAndListeners(obj, key, prev, '__ember_observes__', removeObserver);
        updateObserversAndListeners(obj, key, prev, '__ember_listens__', removeListener);
      }

      if ('function' === typeof observerOrListener) {
        updateObserversAndListeners(obj, key, observerOrListener, '__ember_observesBefore__', addBeforeObserver);
        updateObserversAndListeners(obj, key, observerOrListener, '__ember_observes__', addObserver);
        updateObserversAndListeners(obj, key, observerOrListener, '__ember_listens__', addListener);
      }
    }

    function applyMixin(obj, mixins, partial) {
      var descs = {}, values = {}, m = metaFor(obj),
          key, value, desc, keys = [];

      obj._super = superFunction;

      // Go through all mixins and hashes passed in, and:
      //
      // * Handle concatenated properties
      // * Handle merged properties
      // * Set up _super wrapping if necessary
      // * Set up computed property descriptors
      // * Copying `toString` in broken browsers
      mergeMixins(mixins, mixinsMeta(obj), descs, values, obj, keys);

      for(var i = 0, l = keys.length; i < l; i++) {
        key = keys[i];
        if (key === 'constructor' || !values.hasOwnProperty(key)) { continue; }

        desc = descs[key];
        value = values[key];

        if (desc === REQUIRED) { continue; }

        while (desc && desc instanceof Alias) {
          var followed = followAlias(obj, desc, m, descs, values);
          desc = followed.desc;
          value = followed.value;
        }

        if (desc === undefined && value === undefined) { continue; }

        replaceObserversAndListeners(obj, key, value);
        detectBinding(obj, key, value, m);
        defineProperty(obj, key, desc, value, m);
      }

      if (!partial) { // don't apply to prototype
        finishPartial(obj, m);
      }

      return obj;
    }

    /**
      @method mixin
      @for Ember
      @param obj
      @param mixins*
      @return obj
    */
    function mixin(obj) {
      var args = a_slice.call(arguments, 1);
      applyMixin(obj, args, false);
      return obj;
    };

    /**
      The `Ember.Mixin` class allows you to create mixins, whose properties can be
      added to other classes. For instance,

      ```javascript
      App.Editable = Ember.Mixin.create({
        edit: function() {
          console.log('starting to edit');
          this.set('isEditing', true);
        },
        isEditing: false
      });

      // Mix mixins into classes by passing them as the first arguments to
      // .extend.
      App.CommentView = Ember.View.extend(App.Editable, {
        template: Ember.Handlebars.compile('{{#if view.isEditing}}...{{else}}...{{/if}}')
      });

      commentView = App.CommentView.create();
      commentView.edit(); // outputs 'starting to edit'
      ```

      Note that Mixins are created with `Ember.Mixin.create`, not
      `Ember.Mixin.extend`.

      Note that mixins extend a constructor's prototype so arrays and object literals
      defined as properties will be shared amongst objects that implement the mixin.
      If you want to define a property in a mixin that is not shared, you can define
      it either as a computed property or have it be created on initialization of the object.

      ```javascript
      //filters array will be shared amongst any object implementing mixin
      App.Filterable = Ember.Mixin.create({
        filters: Ember.A()
      });

      //filters will be a separate  array for every object implementing the mixin
      App.Filterable = Ember.Mixin.create({
        filters: Ember.computed(function(){return Ember.A();})
      });

      //filters will be created as a separate array during the object's initialization
      App.Filterable = Ember.Mixin.create({
        init: function() {
          this._super();
          this.set("filters", Ember.A());
        }
      });
      ```

      @class Mixin
      @namespace Ember
    */
    function Mixin() { return initMixin(this, arguments); };

    Mixin.prototype = {
      properties: null,
      mixins: null,
      ownerConstructor: null
    };

    Mixin._apply = applyMixin;

    Mixin.applyPartial = function(obj) {
      var args = a_slice.call(arguments, 1);
      return applyMixin(obj, args, true);
    };

    Mixin.finishPartial = finishPartial;

    // ES6TODO: this relies on a global state?
    Ember.anyUnprocessedMixins = false;

    /**
      @method create
      @static
      @param arguments*
    */
    Mixin.create = function() {
      // ES6TODO: this relies on a global state?
      Ember.anyUnprocessedMixins = true;
      var M = this;
      return initMixin(new M(), arguments);
    };

    var MixinPrototype = Mixin.prototype;

    /**
      @method reopen
      @param arguments*
    */
    MixinPrototype.reopen = function() {
      var mixin, tmp;

      if (this.properties) {
        mixin = Mixin.create();
        mixin.properties = this.properties;
        delete this.properties;
        this.mixins = [mixin];
      } else if (!this.mixins) {
        this.mixins = [];
      }

      var len = arguments.length, mixins = this.mixins, idx;

      for(idx=0; idx < len; idx++) {
        mixin = arguments[idx];
        Ember.assert('Expected hash or Mixin instance, got ' + Object.prototype.toString.call(mixin),
                     typeof mixin === 'object' && mixin !== null && Object.prototype.toString.call(mixin) !== '[object Array]');

        if (mixin instanceof Mixin) {
          mixins.push(mixin);
        } else {
          tmp = Mixin.create();
          tmp.properties = mixin;
          mixins.push(tmp);
        }
      }

      return this;
    };

    /**
      @method apply
      @param obj
      @return applied object
    */
    MixinPrototype.apply = function(obj) {
      return applyMixin(obj, [this], false);
    };

    MixinPrototype.applyPartial = function(obj) {
      return applyMixin(obj, [this], true);
    };

    function _detect(curMixin, targetMixin, seen) {
      var guid = guidFor(curMixin);

      if (seen[guid]) { return false; }
      seen[guid] = true;

      if (curMixin === targetMixin) { return true; }
      var mixins = curMixin.mixins, loc = mixins ? mixins.length : 0;
      while (--loc >= 0) {
        if (_detect(mixins[loc], targetMixin, seen)) { return true; }
      }
      return false;
    }

    /**
      @method detect
      @param obj
      @return {Boolean}
    */
    MixinPrototype.detect = function(obj) {
      if (!obj) { return false; }
      if (obj instanceof Mixin) { return _detect(obj, this, {}); }
      var m = obj[META_KEY],
          mixins = m && m.mixins;
      if (mixins) {
        return !!mixins[guidFor(this)];
      }
      return false;
    };

    MixinPrototype.without = function() {
      var ret = new Mixin(this);
      ret._without = a_slice.call(arguments);
      return ret;
    };

    function _keys(ret, mixin, seen) {
      if (seen[guidFor(mixin)]) { return; }
      seen[guidFor(mixin)] = true;

      if (mixin.properties) {
        var props = mixin.properties;
        for (var key in props) {
          if (props.hasOwnProperty(key)) { ret[key] = true; }
        }
      } else if (mixin.mixins) {
        a_forEach.call(mixin.mixins, function(x) { _keys(ret, x, seen); });
      }
    }

    MixinPrototype.keys = function() {
      var keys = {}, seen = {}, ret = [];
      _keys(keys, this, seen);
      for(var key in keys) {
        if (keys.hasOwnProperty(key)) { ret.push(key); }
      }
      return ret;
    };

    // returns the mixins currently applied to the specified object
    // TODO: Make Ember.mixin
    Mixin.mixins = function(obj) {
      var m = obj[META_KEY],
          mixins = m && m.mixins, ret = [];

      if (!mixins) { return ret; }

      for (var key in mixins) {
        var mixin = mixins[key];

        // skip primitive mixins since these are always anonymous
        if (!mixin.properties) { ret.push(mixin); }
      }

      return ret;
    };

    REQUIRED = new Descriptor();
    REQUIRED.toString = function() { return '(Required Property)'; };

    /**
      Denotes a required property for a mixin

      @method required
      @for Ember
    */
    function required() {
      return REQUIRED;
    };

    Alias = function(methodName) {
      this.methodName = methodName;
    };
    Alias.prototype = new Descriptor();

    /**
      Makes a method available via an additional name.

      ```javascript
      App.Person = Ember.Object.extend({
        name: function() {
          return 'Tomhuda Katzdale';
        },
        moniker: Ember.aliasMethod('name')
      });

      var goodGuy = App.Person.create();
      
      goodGuy.name();    // 'Tomhuda Katzdale'
      goodGuy.moniker(); // 'Tomhuda Katzdale'
      ```

      @method aliasMethod
      @for Ember
      @param {String} methodName name of the method to alias
      @return {Ember.Descriptor}
    */
    function aliasMethod(methodName) {
      return new Alias(methodName);
    };

    // ..........................................................
    // OBSERVER HELPER
    //

    /**
      Specify a method that observes property changes.

      ```javascript
      Ember.Object.extend({
        valueObserver: Ember.observer('value', function() {
          // Executes whenever the "value" property changes
        })
      });
      ```

      In the future this method may become asynchronous. If you want to ensure
      synchronous behavior, use `immediateObserver`.

      Also available as `Function.prototype.observes` if prototype extensions are
      enabled.

      @method observer
      @for Ember
      @param {String} propertyNames*
      @param {Function} func
      @return func
    */
    function observer() {
      var func  = a_slice.call(arguments, -1)[0];
      var paths;

      var addWatchedProperty = function (path) { paths.push(path); };
      var _paths = a_slice.call(arguments, 0, -1);

      if (typeof func !== "function") {
        // revert to old, soft-deprecated argument ordering

        func  = arguments[0];
        _paths = a_slice.call(arguments, 1);
      }

      paths = [];

      for (var i=0; i<_paths.length; ++i) {
        expandProperties(_paths[i], addWatchedProperty);
      }

      if (typeof func !== "function") {
        throw new Ember.Error("Ember.observer called without a function");
      }

      func.__ember_observes__ = paths;
      return func;
    };

    /**
      Specify a method that observes property changes.

      ```javascript
      Ember.Object.extend({
        valueObserver: Ember.immediateObserver('value', function() {
          // Executes whenever the "value" property changes
        })
      });
      ```

      In the future, `Ember.observer` may become asynchronous. In this event,
      `Ember.immediateObserver` will maintain the synchronous behavior.

      Also available as `Function.prototype.observesImmediately` if prototype extensions are
      enabled.

      @method immediateObserver
      @for Ember
      @param {String} propertyNames*
      @param {Function} func
      @return func
    */
    function immediateObserver() {
      for (var i=0, l=arguments.length; i<l; i++) {
        var arg = arguments[i];
        Ember.assert("Immediate observers must observe internal properties only, not properties on other objects.", typeof arg !== "string" || arg.indexOf('.') === -1);
      }

      return observer.apply(this, arguments);
    };

    /**
      When observers fire, they are called with the arguments `obj`, `keyName`.

      Note, `@each.property` observer is called per each add or replace of an element
      and it's not called with a specific enumeration item.

      A `beforeObserver` fires before a property changes.

      A `beforeObserver` is an alternative form of `.observesBefore()`.

      ```javascript
      App.PersonView = Ember.View.extend({
        friends: [{ name: 'Tom' }, { name: 'Stefan' }, { name: 'Kris' }],

        valueWillChange: Ember.beforeObserver('content.value', function(obj, keyName) {
          this.changingFrom = obj.get(keyName);
        }),

        valueDidChange: Ember.observer('content.value', function(obj, keyName) {
            // only run if updating a value already in the DOM
            if (this.get('state') === 'inDOM') {
              var color = obj.get(keyName) > this.changingFrom ? 'green' : 'red';
              // logic
            }
        }),

        friendsDidChange: Ember.observer('friends.@each.name', function(obj, keyName) {
          // some logic
          // obj.get(keyName) returns friends array
        })
      });
      ```

      Also available as `Function.prototype.observesBefore` if prototype extensions are
      enabled.

      @method beforeObserver
      @for Ember
      @param {String} propertyNames*
      @param {Function} func
      @return func
    */
    function beforeObserver() {
      var func  = a_slice.call(arguments, -1)[0];
      var paths;

      var addWatchedProperty = function(path) { paths.push(path); };

      var _paths = a_slice.call(arguments, 0, -1);

      if (typeof func !== "function") {
        // revert to old, soft-deprecated argument ordering

        func  = arguments[0];
        _paths = a_slice.call(arguments, 1);
      }

      paths = [];

      for (var i=0; i<_paths.length; ++i) {
        expandProperties(_paths[i], addWatchedProperty);
      }

      if (typeof func !== "function") {
        throw new Ember.Error("Ember.beforeObserver called without a function");
      }

      func.__ember_observesBefore__ = paths;
      return func;
    };

    __exports__.IS_BINDING = IS_BINDING;
    __exports__.mixin = mixin;
    __exports__.Mixin = Mixin;
    __exports__.required = required;
    __exports__.aliasMethod = aliasMethod;
    __exports__.observer = observer;
    __exports__.immediateObserver = immediateObserver;
    __exports__.beforeObserver = beforeObserver;
  });
define("ember-metal/observer",
  ["ember-metal/watching","ember-metal/array","ember-metal/events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var watch = __dependency1__.watch;
    var unwatch = __dependency1__.unwatch;
    var map = __dependency2__.map;
    var listenersFor = __dependency3__.listenersFor;
    var addListener = __dependency3__.addListener;
    var removeListener = __dependency3__.removeListener;
    var suspendListeners = __dependency3__.suspendListeners;
    var suspendListener = __dependency3__.suspendListener;
    /**
    @module ember-metal
    */

    var AFTER_OBSERVERS = ':change',
        BEFORE_OBSERVERS = ':before';

    function changeEvent(keyName) {
      return keyName+AFTER_OBSERVERS;
    }

    function beforeEvent(keyName) {
      return keyName+BEFORE_OBSERVERS;
    }

    /**
      @method addObserver
      @for Ember
      @param obj
      @param {String} path
      @param {Object|Function} targetOrMethod
      @param {Function|String} [method]
    */
    function addObserver(obj, _path, target, method) {
      addListener(obj, changeEvent(_path), target, method);
      watch(obj, _path);

      return this;
    };

    function observersFor(obj, path) {
      return listenersFor(obj, changeEvent(path));
    };

    /**
      @method removeObserver
      @for Ember
      @param obj
      @param {String} path
      @param {Object|Function} targetOrMethod
      @param {Function|String} [method]
    */
    function removeObserver(obj, _path, target, method) {
      unwatch(obj, _path);
      removeListener(obj, changeEvent(_path), target, method);

      return this;
    };

    /**
      @method addBeforeObserver
      @for Ember
      @param obj
      @param {String} path
      @param {Object|Function} targetOrMethod
      @param {Function|String} [method]
    */
    function addBeforeObserver(obj, _path, target, method) {
      addListener(obj, beforeEvent(_path), target, method);
      watch(obj, _path);

      return this;
    };

    // Suspend observer during callback.
    //
    // This should only be used by the target of the observer
    // while it is setting the observed path.
    function _suspendBeforeObserver(obj, path, target, method, callback) {
      return suspendListener(obj, beforeEvent(path), target, method, callback);
    };

    function _suspendObserver(obj, path, target, method, callback) {
      return suspendListener(obj, changeEvent(path), target, method, callback);
    };

    function _suspendBeforeObservers(obj, paths, target, method, callback) {
      var events = map.call(paths, beforeEvent);
      return suspendListeners(obj, events, target, method, callback);
    };

    function _suspendObservers(obj, paths, target, method, callback) {
      var events = map.call(paths, changeEvent);
      return suspendListeners(obj, events, target, method, callback);
    };

    function beforeObserversFor(obj, path) {
      return listenersFor(obj, beforeEvent(path));
    };

    /**
      @method removeBeforeObserver
      @for Ember
      @param obj
      @param {String} path
      @param {Object|Function} targetOrMethod
      @param {Function|String} [method]
    */
    function removeBeforeObserver(obj, _path, target, method) {
      unwatch(obj, _path);
      removeListener(obj, beforeEvent(_path), target, method);

      return this;
    };

    __exports__.addObserver = addObserver;
    __exports__.observersFor = observersFor;
    __exports__.removeObserver = removeObserver;
    __exports__.addBeforeObserver = addBeforeObserver;
    __exports__._suspendBeforeObserver = _suspendBeforeObserver;
    __exports__._suspendObserver = _suspendObserver;
    __exports__._suspendBeforeObservers = _suspendBeforeObservers;
    __exports__._suspendObservers = _suspendObservers;
    __exports__.beforeObserversFor = beforeObserversFor;
    __exports__.removeBeforeObserver = removeBeforeObserver;
  });
define("ember-metal/observer_set",
  ["ember-metal/utils","ember-metal/events","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var guidFor = __dependency1__.guidFor;
    var sendEvent = __dependency2__.sendEvent;

    /*
      this.observerSet = {
        [senderGuid]: { // variable name: `keySet`
          [keyName]: listIndex
        }
      },
      this.observers = [
        {
          sender: obj,
          keyName: keyName,
          eventName: eventName,
          listeners: [
            [target, method, flags]
          ]
        },
        ...
      ]
    */
    function ObserverSet() {
      this.clear();
    };

    ObserverSet.prototype.add = function(sender, keyName, eventName) {
      var observerSet = this.observerSet,
          observers = this.observers,
          senderGuid = guidFor(sender),
          keySet = observerSet[senderGuid],
          index;

      if (!keySet) {
        observerSet[senderGuid] = keySet = {};
      }
      index = keySet[keyName];
      if (index === undefined) {
        index = observers.push({
          sender: sender,
          keyName: keyName,
          eventName: eventName,
          listeners: []
        }) - 1;
        keySet[keyName] = index;
      }
      return observers[index].listeners;
    };

    ObserverSet.prototype.flush = function() {
      var observers = this.observers, i, len, observer, sender;
      this.clear();
      for (i=0, len=observers.length; i < len; ++i) {
        observer = observers[i];
        sender = observer.sender;
        if (sender.isDestroying || sender.isDestroyed) { continue; }
        sendEvent(sender, observer.eventName, [sender, observer.keyName], observer.listeners);
      }
    };

    ObserverSet.prototype.clear = function() {
      this.observerSet = {};
      this.observers = [];
    };

    __exports__["default"] = ObserverSet;
  });
define("ember-metal/platform",
  ["ember-metal/core","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*globals Node */

    var Ember = __dependency1__["default"];

    /**
    @module ember-metal
    */

    /**
      Platform specific methods and feature detectors needed by the framework.

      @class platform
      @namespace Ember
      @static
    */
    // TODO remove this
    var platform = {};

    /**
      Identical to `Object.create()`. Implements if not available natively.

      @method create
      @for Ember
    */
    var create = Object.create;

    // IE8 has Object.create but it couldn't treat property descriptors.
    if (create) {
      if (create({a: 1}, {a: {value: 2}}).a !== 2) {
        create = null;
      }
    }

    // STUB_OBJECT_CREATE allows us to override other libraries that stub
    // Object.create different than we would prefer
    if (!create || Ember.ENV.STUB_OBJECT_CREATE) {
      var K = function() {};

      create = function(obj, props) {
        K.prototype = obj;
        obj = new K();
        if (props) {
          K.prototype = obj;
          for (var prop in props) {
            K.prototype[prop] = props[prop].value;
          }
          obj = new K();
        }
        K.prototype = null;

        return obj;
      };

      create.isSimulated = true;
    }

    var defineProperty = Object.defineProperty;
    var canRedefineProperties, canDefinePropertyOnDOM;

    // Catch IE8 where Object.defineProperty exists but only works on DOM elements
    if (defineProperty) {
      try {
        defineProperty({}, 'a',{get:function() {}});
      } catch (e) {
        defineProperty = null;
      }
    }

    if (defineProperty) {
      // Detects a bug in Android <3.2 where you cannot redefine a property using
      // Object.defineProperty once accessors have already been set.
      canRedefineProperties = (function() {
        var obj = {};

        defineProperty(obj, 'a', {
          configurable: true,
          enumerable: true,
          get: function() { },
          set: function() { }
        });

        defineProperty(obj, 'a', {
          configurable: true,
          enumerable: true,
          writable: true,
          value: true
        });

        return obj.a === true;
      })();

      // This is for Safari 5.0, which supports Object.defineProperty, but not
      // on DOM nodes.
      canDefinePropertyOnDOM = (function() {
        try {
          defineProperty(document.createElement('div'), 'definePropertyOnDOM', {});
          return true;
        } catch(e) { }

        return false;
      })();

      if (!canRedefineProperties) {
        defineProperty = null;
      } else if (!canDefinePropertyOnDOM) {
        defineProperty = function(obj, keyName, desc) {
          var isNode;

          if (typeof Node === "object") {
            isNode = obj instanceof Node;
          } else {
            isNode = typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName === "string";
          }

          if (isNode) {
            // TODO: Should we have a warning here?
            return (obj[keyName] = desc.value);
          } else {
            return Object.defineProperty(obj, keyName, desc);
          }
        };
      }
    }

    /**
    @class platform
    @namespace Ember
    */

    /**
      Identical to `Object.defineProperty()`. Implements as much functionality
      as possible if not available natively.

      @method defineProperty
      @param {Object} obj The object to modify
      @param {String} keyName property name to modify
      @param {Object} desc descriptor hash
      @return {void}
    */
    platform.defineProperty = defineProperty;

    /**
      Set to true if the platform supports native getters and setters.

      @property hasPropertyAccessors
      @final
    */
    platform.hasPropertyAccessors = true;

    if (!platform.defineProperty) {
      platform.hasPropertyAccessors = false;

      platform.defineProperty = function(obj, keyName, desc) {
        if (!desc.get) { obj[keyName] = desc.value; }
      };

      platform.defineProperty.isSimulated = true;
    }

    if (Ember.ENV.MANDATORY_SETTER && !platform.hasPropertyAccessors) {
      Ember.ENV.MANDATORY_SETTER = false;
    }

    __exports__.create = create;
    __exports__.platform = platform;
  });
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
define("ember-metal/property_events",
  ["ember-metal/utils","ember-metal/events","ember-metal/observer_set","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var META_KEY = __dependency1__.META_KEY;
    var guidFor = __dependency1__.guidFor;
    var tryFinally = __dependency1__.tryFinally;
    var sendEvent = __dependency2__.sendEvent;
    var listenersUnion = __dependency2__.listenersUnion;
    var listenersDiff = __dependency2__.listenersDiff;
    var ObserverSet = __dependency3__["default"];

    var beforeObserverSet = new ObserverSet(),
        observerSet = new ObserverSet(),
        deferred = 0;

    // ..........................................................
    // PROPERTY CHANGES
    //

    /**
      This function is called just before an object property is about to change.
      It will notify any before observers and prepare caches among other things.

      Normally you will not need to call this method directly but if for some
      reason you can't directly watch a property you can invoke this method
      manually along with `Ember.propertyDidChange()` which you should call just
      after the property value changes.

      @method propertyWillChange
      @for Ember
      @param {Object} obj The object with the property that will change
      @param {String} keyName The property key (or path) that will change.
      @return {void}
    */
    function propertyWillChange(obj, keyName) {
      var m = obj[META_KEY],
          watching = (m && m.watching[keyName] > 0) || keyName === 'length',
          proto = m && m.proto,
          desc = m && m.descs[keyName];

      if (!watching) { return; }
      if (proto === obj) { return; }
      if (desc && desc.willChange) { desc.willChange(obj, keyName); }
      dependentKeysWillChange(obj, keyName, m);
      chainsWillChange(obj, keyName, m);
      notifyBeforeObservers(obj, keyName);
    }

    /**
      This function is called just after an object property has changed.
      It will notify any observers and clear caches among other things.

      Normally you will not need to call this method directly but if for some
      reason you can't directly watch a property you can invoke this method
      manually along with `Ember.propertyWillChange()` which you should call just
      before the property value changes.

      @method propertyDidChange
      @for Ember
      @param {Object} obj The object with the property that will change
      @param {String} keyName The property key (or path) that will change.
      @return {void}
    */
    function propertyDidChange(obj, keyName) {
      var m = obj[META_KEY],
          watching = (m && m.watching[keyName] > 0) || keyName === 'length',
          proto = m && m.proto,
          desc = m && m.descs[keyName];

      if (proto === obj) { return; }

      // shouldn't this mean that we're watching this key?
      if (desc && desc.didChange) { desc.didChange(obj, keyName); }
      if (!watching && keyName !== 'length') { return; }

      dependentKeysDidChange(obj, keyName, m);
      chainsDidChange(obj, keyName, m, false);
      notifyObservers(obj, keyName);
    }

    var WILL_SEEN, DID_SEEN;

    // called whenever a property is about to change to clear the cache of any dependent keys (and notify those properties of changes, etc...)
    function dependentKeysWillChange(obj, depKey, meta) {
      if (obj.isDestroying) { return; }

      var seen = WILL_SEEN, top = !seen;
      if (top) { seen = WILL_SEEN = {}; }
      iterDeps(propertyWillChange, obj, depKey, seen, meta);
      if (top) { WILL_SEEN = null; }
    }

    // called whenever a property has just changed to update dependent keys
    function dependentKeysDidChange(obj, depKey, meta) {
      if (obj.isDestroying) { return; }

      var seen = DID_SEEN, top = !seen;
      if (top) { seen = DID_SEEN = {}; }
      iterDeps(propertyDidChange, obj, depKey, seen, meta);
      if (top) { DID_SEEN = null; }
    }

    function iterDeps(method, obj, depKey, seen, meta) {
      var guid = guidFor(obj);
      if (!seen[guid]) seen[guid] = {};
      if (seen[guid][depKey]) return;
      seen[guid][depKey] = true;

      var deps = meta.deps;
      deps = deps && deps[depKey];
      if (deps) {
        for(var key in deps) {
          var desc = meta.descs[key];
          if (desc && desc._suspended === obj) continue;
          method(obj, key);
        }
      }
    }

    function chainsWillChange(obj, keyName, m) {
      if (!(m.hasOwnProperty('chainWatchers') &&
            m.chainWatchers[keyName])) {
        return;
      }

      var nodes = m.chainWatchers[keyName],
          events = [],
          i, l;

      for(i = 0, l = nodes.length; i < l; i++) {
        nodes[i].willChange(events);
      }

      for (i = 0, l = events.length; i < l; i += 2) {
        propertyWillChange(events[i], events[i+1]);
      }
    }

    function chainsDidChange(obj, keyName, m, suppressEvents) {
      if (!(m && m.hasOwnProperty('chainWatchers') &&
            m.chainWatchers[keyName])) {
        return;
      }

      var nodes = m.chainWatchers[keyName],
          events = suppressEvents ? null : [],
          i, l;

      for(i = 0, l = nodes.length; i < l; i++) {
        nodes[i].didChange(events);
      }

      if (suppressEvents) {
        return;
      }

      for (i = 0, l = events.length; i < l; i += 2) {
        propertyDidChange(events[i], events[i+1]);
      }
    }

    function overrideChains(obj, keyName, m) {
      chainsDidChange(obj, keyName, m, true);
    };

    /**
      @method beginPropertyChanges
      @chainable
      @private
    */
    function beginPropertyChanges() {
      deferred++;
    }

    /**
      @method endPropertyChanges
      @private
    */
    function endPropertyChanges() {
      deferred--;
      if (deferred<=0) {
        beforeObserverSet.clear();
        observerSet.flush();
      }
    }

    /**
      Make a series of property changes together in an
      exception-safe way.

      ```javascript
      Ember.changeProperties(function() {
        obj1.set('foo', mayBlowUpWhenSet);
        obj2.set('bar', baz);
      });
      ```

      @method changeProperties
      @param {Function} callback
      @param [binding]
    */
    function changeProperties(cb, binding) {
      beginPropertyChanges();
      tryFinally(cb, endPropertyChanges, binding);
    };

    function notifyBeforeObservers(obj, keyName) {
      if (obj.isDestroying) { return; }

      var eventName = keyName + ':before', listeners, diff;
      if (deferred) {
        listeners = beforeObserverSet.add(obj, keyName, eventName);
        diff = listenersDiff(obj, eventName, listeners);
        sendEvent(obj, eventName, [obj, keyName], diff);
      } else {
        sendEvent(obj, eventName, [obj, keyName]);
      }
    }

    function notifyObservers(obj, keyName) {
      if (obj.isDestroying) { return; }

      var eventName = keyName + ':change', listeners;
      if (deferred) {
        listeners = observerSet.add(obj, keyName, eventName);
        listenersUnion(obj, eventName, listeners);
      } else {
        sendEvent(obj, eventName, [obj, keyName]);
      }
    }

    __exports__.propertyWillChange = propertyWillChange;
    __exports__.propertyDidChange = propertyDidChange;
    __exports__.overrideChains = overrideChains;
    __exports__.beginPropertyChanges = beginPropertyChanges;
    __exports__.endPropertyChanges = endPropertyChanges;
    __exports__.changeProperties = changeProperties;
  });
define("ember-metal/property_get",
  ["ember-metal/core","ember-metal/utils","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /**
    @module ember-metal
    */

    var Ember = __dependency1__["default"];
    var META_KEY = __dependency2__.META_KEY;
    var EmberError = __dependency3__["default"];

    var get;

    var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

    var IS_GLOBAL_PATH = /^([A-Z$]|([0-9][A-Z$])).*[\.]/;
    var HAS_THIS  = 'this.';
    var FIRST_KEY = /^([^\.]+)/;

    // ..........................................................
    // GET AND SET
    //
    // If we are on a platform that supports accessors we can use those.
    // Otherwise simulate accessors by looking up the property directly on the
    // object.

    /**
      Gets the value of a property on an object. If the property is computed,
      the function will be invoked. If the property is not defined but the
      object implements the `unknownProperty` method then that will be invoked.

      If you plan to run on IE8 and older browsers then you should use this
      method anytime you want to retrieve a property on an object that you don't
      know for sure is private. (Properties beginning with an underscore '_'
      are considered private.)

      On all newer browsers, you only need to use this method to retrieve
      properties if the property might not be defined on the object and you want
      to respect the `unknownProperty` handler. Otherwise you can ignore this
      method.

      Note that if the object itself is `undefined`, this method will throw
      an error.

      @method get
      @for Ember
      @param {Object} obj The object to retrieve from.
      @param {String} keyName The property key to retrieve
      @return {Object} the property value or `null`.
    */
    get = function get(obj, keyName) {
      // Helpers that operate with 'this' within an #each
      if (keyName === '') {
        return obj;
      }

      if (!keyName && 'string'===typeof obj) {
        keyName = obj;
        obj = null;
      }

      Ember.assert("Cannot call get with "+ keyName +" key.", !!keyName);
      Ember.assert("Cannot call get with '"+ keyName +"' on an undefined object.", obj !== undefined);

      if (obj === null) { return _getPath(obj, keyName);  }

      var meta = obj[META_KEY], desc = meta && meta.descs[keyName], ret;

      if (desc === undefined && keyName.indexOf('.') !== -1) {
        return _getPath(obj, keyName);
      }

      if (desc) {
        return desc.get(obj, keyName);
      } else {
        if (MANDATORY_SETTER && meta && meta.watching[keyName] > 0) {
          ret = meta.values[keyName];
        } else {
          ret = obj[keyName];
        }

        if (ret === undefined &&
            'object' === typeof obj && !(keyName in obj) && 'function' === typeof obj.unknownProperty) {
          return obj.unknownProperty(keyName);
        }

        return ret;
      }
    };

    // Currently used only by Ember Data tests
    if (Ember.config.overrideAccessors) {
      Ember.get = get;
      Ember.config.overrideAccessors();
      get = Ember.get;
    }

    /**
      Normalizes a target/path pair to reflect that actual target/path that should
      be observed, etc. This takes into account passing in global property
      paths (i.e. a path beginning with a captial letter not defined on the
      target).

      @private
      @method normalizeTuple
      @for Ember
      @param {Object} target The current target. May be `null`.
      @param {String} path A path on the target or a global property path.
      @return {Array} a temporary array with the normalized target/path pair.
    */
    function normalizeTuple(target, path) {
      var hasThis  = path.indexOf(HAS_THIS) === 0,
          isGlobal = !hasThis && IS_GLOBAL_PATH.test(path),
          key;

      if (!target || isGlobal) target = Ember.lookup;
      if (hasThis) path = path.slice(5);

      if (target === Ember.lookup) {
        key = path.match(FIRST_KEY)[0];
        target = get(target, key);
        path   = path.slice(key.length+1);
      }

      // must return some kind of path to be valid else other things will break.
      if (!path || path.length===0) throw new EmberError('Path cannot be empty');

      return [ target, path ];
    };

    function _getPath(root, path) {
      var hasThis, parts, tuple, idx, len;

      // If there is no root and path is a key name, return that
      // property from the global object.
      // E.g. get('Ember') -> Ember
      if (root === null && path.indexOf('.') === -1) { return get(Ember.lookup, path); }

      // detect complicated paths and normalize them
      hasThis = path.indexOf(HAS_THIS) === 0;

      if (!root || hasThis) {
        tuple = normalizeTuple(root, path);
        root = tuple[0];
        path = tuple[1];
        tuple.length = 0;
      }

      parts = path.split(".");
      len = parts.length;
      for (idx = 0; root != null && idx < len; idx++) {
        root = get(root, parts[idx], true);
        if (root && root.isDestroyed) { return undefined; }
      }
      return root;
    };

    function getWithDefault(root, key, defaultValue) {
      var value = get(root, key);

      if (value === undefined) { return defaultValue; }
      return value;
    };

    __exports__["default"] = get;
    __exports__.get = get;
    __exports__.getWithDefault = getWithDefault;
    __exports__.normalizeTuple = normalizeTuple;
    __exports__._getPath = _getPath;
  });
define("ember-metal/property_set",
  ["ember-metal/core","ember-metal/property_get","ember-metal/utils","ember-metal/property_events","ember-metal/properties","ember-metal/error","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var getPath = __dependency2__._getPath;
    var META_KEY = __dependency3__.META_KEY;
    var propertyWillChange = __dependency4__.propertyWillChange;
    var propertyDidChange = __dependency4__.propertyDidChange;
    var defineProperty = __dependency5__.defineProperty;
    var EmberError = __dependency6__["default"];

    var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER,
        IS_GLOBAL = /^([A-Z$]|([0-9][A-Z$]))/;

    /**
      Sets the value of a property on an object, respecting computed properties
      and notifying observers and other listeners of the change. If the
      property is not defined but the object implements the `setUnknownProperty`
      method then that will be invoked as well.

      @method set
      @for Ember
      @param {Object} obj The object to modify.
      @param {String} keyName The property key to set
      @param {Object} value The value to set
      @return {Object} the passed value.
    */
    var set = function set(obj, keyName, value, tolerant) {
      if (typeof obj === 'string') {
        Ember.assert("Path '" + obj + "' must be global if no obj is given.", IS_GLOBAL.test(obj));
        value = keyName;
        keyName = obj;
        obj = null;
      }

      Ember.assert("Cannot call set with "+ keyName +" key.", !!keyName);

      if (!obj) {
        return setPath(obj, keyName, value, tolerant);
      }

      var meta = obj[META_KEY], desc = meta && meta.descs[keyName],
          isUnknown, currentValue;

      if (desc === undefined && keyName.indexOf('.') !== -1) {
        return setPath(obj, keyName, value, tolerant);
      }

      Ember.assert("You need to provide an object and key to `set`.", !!obj && keyName !== undefined);
      Ember.assert('calling set on destroyed object', !obj.isDestroyed);

      if (desc !== undefined) {
        desc.set(obj, keyName, value);
      } else {

        if (typeof obj === 'object' && obj !== null && value !== undefined && obj[keyName] === value) {
          return value;
        }

        isUnknown = 'object' === typeof obj && !(keyName in obj);

        // setUnknownProperty is called if `obj` is an object,
        // the property does not already exist, and the
        // `setUnknownProperty` method exists on the object
        if (isUnknown && 'function' === typeof obj.setUnknownProperty) {
          obj.setUnknownProperty(keyName, value);
        } else if (meta && meta.watching[keyName] > 0) {
          if (MANDATORY_SETTER) {
            currentValue = meta.values[keyName];
          } else {
            currentValue = obj[keyName];
          }
          // only trigger a change if the value has changed
          if (value !== currentValue) {
            propertyWillChange(obj, keyName);
            if (MANDATORY_SETTER) {
              if ((currentValue === undefined && !(keyName in obj)) || !obj.propertyIsEnumerable(keyName)) {
                defineProperty(obj, keyName, null, value); // setup mandatory setter
              } else {
                meta.values[keyName] = value;
              }
            } else {
              obj[keyName] = value;
            }
            propertyDidChange(obj, keyName);
          }
        } else {
          obj[keyName] = value;
        }
      }
      return value;
    };

    // Currently used only by Ember Data tests
    // ES6TODO: Verify still true
    if (Ember.config.overrideAccessors) {
      Ember.set = set;
      Ember.config.overrideAccessors();
      set = Ember.set;
    }

    function setPath(root, path, value, tolerant) {
      var keyName;

      // get the last part of the path
      keyName = path.slice(path.lastIndexOf('.') + 1);

      // get the first part of the part
      path    = (path === keyName) ? keyName : path.slice(0, path.length-(keyName.length+1));

      // unless the path is this, look up the first part to
      // get the root
      if (path !== 'this') {
        root = getPath(root, path);
      }

      if (!keyName || keyName.length === 0) {
        throw new EmberError('Property set failed: You passed an empty path');
      }

      if (!root) {
        if (tolerant) { return; }
        else { throw new EmberError('Property set failed: object in path "'+path+'" could not be found or was destroyed.'); }
      }

      return set(root, keyName, value);
    }

    /**
      Error-tolerant form of `Ember.set`. Will not blow up if any part of the
      chain is `undefined`, `null`, or destroyed.

      This is primarily used when syncing bindings, which may try to update after
      an object has been destroyed.

      @method trySet
      @for Ember
      @param {Object} obj The object to modify.
      @param {String} path The property path to set
      @param {Object} value The value to set
    */
    function trySet(root, path, value) {
      return set(root, path, value, true);
    };

    __exports__.set = set;
    __exports__.trySet = trySet;
  });
define("ember-metal/run_loop",
  ["ember-metal/core","ember-metal/utils","ember-metal/array","ember-metal/property_events","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var apply = __dependency2__.apply;
    var indexOf = __dependency3__.indexOf;
    var beginPropertyChanges = __dependency4__.beginPropertyChanges;
    var endPropertyChanges = __dependency4__.endPropertyChanges;

    var onBegin = function(current) {
      run.currentRunLoop = current;
    };

    var onEnd = function(current, next) {
      run.currentRunLoop = next;
    };

    // ES6TODO: should Backburner become es6?
    var Backburner = requireModule('backburner').Backburner,
        backburner = new Backburner(['sync', 'actions', 'destroy'], {
          sync: {
            before: beginPropertyChanges,
            after: endPropertyChanges
          },
          defaultQueue: 'actions',
          onBegin: onBegin,
          onEnd: onEnd,
          onErrorTarget: Ember,
          onErrorMethod: 'onerror'
        }),
        slice = [].slice,
        concat = [].concat;

    // ..........................................................
    // run - this is ideally the only public API the dev sees
    //

    /**
      Runs the passed target and method inside of a RunLoop, ensuring any
      deferred actions including bindings and views updates are flushed at the
      end.

      Normally you should not need to invoke this method yourself. However if
      you are implementing raw event handlers when interfacing with other
      libraries or plugins, you should probably wrap all of your code inside this
      call.

      ```javascript
      run(function() {
        // code to be execute within a RunLoop
      });
      ```

      @class run
      @namespace Ember
      @static
      @constructor
      @param {Object} [target] target of method to call
      @param {Function|String} method Method to invoke.
        May be a function or a string. If you pass a string
        then it will be looked up on the passed target.
      @param {Object} [args*] Any additional arguments you wish to pass to the method.
      @return {Object} return value from invoking the passed function.
    */
    var run = function() {
      return apply(backburner, backburner.run, arguments);
    };

    /**
      If no run-loop is present, it creates a new one. If a run loop is
      present it will queue itself to run on the existing run-loops action
      queue.

      Please note: This is not for normal usage, and should be used sparingly.

      If invoked when not within a run loop:

      ```javascript
      run.join(function() {
        // creates a new run-loop
      });
      ```

      Alternatively, if called within an existing run loop:

      ```javascript
      run(function() {
        // creates a new run-loop
        run.join(function() {
          // joins with the existing run-loop, and queues for invocation on
          // the existing run-loops action queue.
        });
      });
      ```

      @method join
      @namespace Ember
      @param {Object} [target] target of method to call
      @param {Function|String} method Method to invoke.
        May be a function or a string. If you pass a string
        then it will be looked up on the passed target.
      @param {Object} [args*] Any additional arguments you wish to pass to the method.
      @return {Object} Return value from invoking the passed function. Please note,
      when called within an existing loop, no return value is possible.
    */
    run.join = function(target, method /* args */) {
      if (!run.currentRunLoop) {
        return apply(Ember, run, arguments);
      }

      var args = slice.call(arguments);
      args.unshift('actions');
      apply(run, run.schedule, args);
    };

    /**
      Provides a useful utility for when integrating with non-Ember libraries
      that provide asynchronous callbacks.

      Ember utilizes a run-loop to batch and coalesce changes. This works by
      marking the start and end of Ember-related Javascript execution.

      When using events such as a View's click handler, Ember wraps the event
      handler in a run-loop, but when integrating with non-Ember libraries this
      can be tedious.

      For example, the following is rather verbose but is the correct way to combine
      third-party events and Ember code.

      ```javascript
      var that = this;
      jQuery(window).on('resize', function(){
        run(function(){
          that.handleResize();
        });
      });
      ```

      To reduce the boilerplate, the following can be used to construct a
      run-loop-wrapped callback handler.

      ```javascript
      jQuery(window).on('resize', run.bind(this, this.handleResize));
      ```

      @method bind
      @namespace run
      @param {Object} [target] target of method to call
      @param {Function|String} method Method to invoke.
        May be a function or a string. If you pass a string
        then it will be looked up on the passed target.
      @param {Object} [args*] Any additional arguments you wish to pass to the method.
      @return {Object} return value from invoking the passed function. Please note,
      when called within an existing loop, no return value is possible.
      @since 1.4.0
    */
    run.bind = function(target, method /* args*/) {
      var args = slice.call(arguments);
      return function() {
        return apply(run, run.join, args.concat(slice.call(arguments)));
      };
    };

    run.backburner = backburner;
    run.currentRunLoop = null;
    run.queues = backburner.queueNames;

    /**
      Begins a new RunLoop. Any deferred actions invoked after the begin will
      be buffered until you invoke a matching call to `run.end()`. This is
      a lower-level way to use a RunLoop instead of using `run()`.

      ```javascript
      run.begin();
      // code to be execute within a RunLoop
      run.end();
      ```

      @method begin
      @return {void}
    */
    run.begin = function() {
      backburner.begin();
    };

    /**
      Ends a RunLoop. This must be called sometime after you call
      `run.begin()` to flush any deferred actions. This is a lower-level way
      to use a RunLoop instead of using `run()`.

      ```javascript
      run.begin();
      // code to be execute within a RunLoop
      run.end();
      ```

      @method end
      @return {void}
    */
    run.end = function() {
      backburner.end();
    };

    /**
      Array of named queues. This array determines the order in which queues
      are flushed at the end of the RunLoop. You can define your own queues by
      simply adding the queue name to this array. Normally you should not need
      to inspect or modify this property.

      @property queues
      @type Array
      @default ['sync', 'actions', 'destroy']
    */

    /**
      Adds the passed target/method and any optional arguments to the named
      queue to be executed at the end of the RunLoop. If you have not already
      started a RunLoop when calling this method one will be started for you
      automatically.

      At the end of a RunLoop, any methods scheduled in this way will be invoked.
      Methods will be invoked in an order matching the named queues defined in
      the `run.queues` property.

      ```javascript
      run.schedule('sync', this, function() {
        // this will be executed in the first RunLoop queue, when bindings are synced
        console.log("scheduled on sync queue");
      });

      run.schedule('actions', this, function() {
        // this will be executed in the 'actions' queue, after bindings have synced.
        console.log("scheduled on actions queue");
      });

      // Note the functions will be run in order based on the run queues order.
      // Output would be:
      //   scheduled on sync queue
      //   scheduled on actions queue
      ```

      @method schedule
      @param {String} queue The name of the queue to schedule against.
        Default queues are 'sync' and 'actions'
      @param {Object} [target] target object to use as the context when invoking a method.
      @param {String|Function} method The method to invoke. If you pass a string it
        will be resolved on the target object at the time the scheduled item is
        invoked allowing you to change the target function.
      @param {Object} [arguments*] Optional arguments to be passed to the queued method.
      @return {void}
    */
    run.schedule = function(queue, target, method) {
      checkAutoRun();
      apply(backburner, backburner.schedule, arguments);
    };

    // Used by global test teardown
    run.hasScheduledTimers = function() {
      return backburner.hasTimers();
    };

    // Used by global test teardown
    run.cancelTimers = function () {
      backburner.cancelTimers();
    };

    /**
      Immediately flushes any events scheduled in the 'sync' queue. Bindings
      use this queue so this method is a useful way to immediately force all
      bindings in the application to sync.

      You should call this method anytime you need any changed state to propagate
      throughout the app immediately without repainting the UI (which happens
      in the later 'render' queue added by the `ember-views` package).

      ```javascript
      run.sync();
      ```

      @method sync
      @return {void}
    */
    run.sync = function() {
      if (backburner.currentInstance) {
        backburner.currentInstance.queues.sync.flush();
      }
    };

    /**
      Invokes the passed target/method and optional arguments after a specified
      period if time. The last parameter of this method must always be a number
      of milliseconds.

      You should use this method whenever you need to run some action after a
      period of time instead of using `setTimeout()`. This method will ensure that
      items that expire during the same script execution cycle all execute
      together, which is often more efficient than using a real setTimeout.

      ```javascript
      run.later(myContext, function() {
        // code here will execute within a RunLoop in about 500ms with this == myContext
      }, 500);
      ```

      @method later
      @param {Object} [target] target of method to invoke
      @param {Function|String} method The method to invoke.
        If you pass a string it will be resolved on the
        target at the time the method is invoked.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @param {Number} wait Number of milliseconds to wait.
      @return {String} a string you can use to cancel the timer in
        `run.cancel` later.
    */
    run.later = function(target, method) {
      return apply(backburner, backburner.later, arguments);
    };

    /**
      Schedule a function to run one time during the current RunLoop. This is equivalent
      to calling `scheduleOnce` with the "actions" queue.

      @method once
      @param {Object} [target] The target of the method to invoke.
      @param {Function|String} method The method to invoke.
        If you pass a string it will be resolved on the
        target at the time the method is invoked.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @return {Object} Timer information for use in cancelling, see `run.cancel`.
    */
    run.once = function(target, method) {
      checkAutoRun();
      var args = slice.call(arguments);
      args.unshift('actions');
      return apply(backburner, backburner.scheduleOnce, args);
    };

    /**
      Schedules a function to run one time in a given queue of the current RunLoop.
      Calling this method with the same queue/target/method combination will have
      no effect (past the initial call).

      Note that although you can pass optional arguments these will not be
      considered when looking for duplicates. New arguments will replace previous
      calls.

      ```javascript
      run(function() {
        var sayHi = function() { console.log('hi'); }
        run.scheduleOnce('afterRender', myContext, sayHi);
        run.scheduleOnce('afterRender', myContext, sayHi);
        // sayHi will only be executed once, in the afterRender queue of the RunLoop
      });
      ```

      Also note that passing an anonymous function to `run.scheduleOnce` will
      not prevent additional calls with an identical anonymous function from
      scheduling the items multiple times, e.g.:

      ```javascript
      function scheduleIt() {
        run.scheduleOnce('actions', myContext, function() { console.log("Closure"); });
      }
      scheduleIt();
      scheduleIt();
      // "Closure" will print twice, even though we're using `run.scheduleOnce`,
      // because the function we pass to it is anonymous and won't match the
      // previously scheduled operation.
      ```

      Available queues, and their order, can be found at `run.queues`

      @method scheduleOnce
      @param {String} [queue] The name of the queue to schedule against. Default queues are 'sync' and 'actions'.
      @param {Object} [target] The target of the method to invoke.
      @param {Function|String} method The method to invoke.
        If you pass a string it will be resolved on the
        target at the time the method is invoked.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @return {Object} Timer information for use in cancelling, see `run.cancel`.
    */
    run.scheduleOnce = function(queue, target, method) {
      checkAutoRun();
      return apply(backburner, backburner.scheduleOnce, arguments);
    };

    /**
      Schedules an item to run from within a separate run loop, after
      control has been returned to the system. This is equivalent to calling
      `run.later` with a wait time of 1ms.

      ```javascript
      run.next(myContext, function() {
        // code to be executed in the next run loop,
        // which will be scheduled after the current one
      });
      ```

      Multiple operations scheduled with `run.next` will coalesce
      into the same later run loop, along with any other operations
      scheduled by `run.later` that expire right around the same
      time that `run.next` operations will fire.

      Note that there are often alternatives to using `run.next`.
      For instance, if you'd like to schedule an operation to happen
      after all DOM element operations have completed within the current
      run loop, you can make use of the `afterRender` run loop queue (added
      by the `ember-views` package, along with the preceding `render` queue
      where all the DOM element operations happen). Example:

      ```javascript
      App.MyCollectionView = Ember.CollectionView.extend({
        didInsertElement: function() {
          run.scheduleOnce('afterRender', this, 'processChildElements');
        },
        processChildElements: function() {
          // ... do something with collectionView's child view
          // elements after they've finished rendering, which
          // can't be done within the CollectionView's
          // `didInsertElement` hook because that gets run
          // before the child elements have been added to the DOM.
        }
      });
      ```

      One benefit of the above approach compared to using `run.next` is
      that you will be able to perform DOM/CSS operations before unprocessed
      elements are rendered to the screen, which may prevent flickering or
      other artifacts caused by delaying processing until after rendering.

      The other major benefit to the above approach is that `run.next`
      introduces an element of non-determinism, which can make things much
      harder to test, due to its reliance on `setTimeout`; it's much harder
      to guarantee the order of scheduled operations when they are scheduled
      outside of the current run loop, i.e. with `run.next`.

      @method next
      @param {Object} [target] target of method to invoke
      @param {Function|String} method The method to invoke.
        If you pass a string it will be resolved on the
        target at the time the method is invoked.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @return {Object} Timer information for use in cancelling, see `run.cancel`.
    */
    run.next = function() {
      var args = slice.call(arguments);
      args.push(1);
      return apply(backburner, backburner.later, args);
    };

    /**
      Cancels a scheduled item. Must be a value returned by `run.later()`,
      `run.once()`, `run.next()`, `run.debounce()`, or
      `run.throttle()`.

      ```javascript
      var runNext = run.next(myContext, function() {
        // will not be executed
      });
      run.cancel(runNext);

      var runLater = run.later(myContext, function() {
        // will not be executed
      }, 500);
      run.cancel(runLater);

      var runOnce = run.once(myContext, function() {
        // will not be executed
      });
      run.cancel(runOnce);

      var throttle = run.throttle(myContext, function() {
        // will not be executed
      }, 1, false);
      run.cancel(throttle);

      var debounce = run.debounce(myContext, function() {
        // will not be executed
      }, 1);
      run.cancel(debounce);

      var debounceImmediate = run.debounce(myContext, function() {
        // will be executed since we passed in true (immediate)
      }, 100, true);
      // the 100ms delay until this method can be called again will be cancelled
      run.cancel(debounceImmediate);
      ```

      @method cancel
      @param {Object} timer Timer object to cancel
      @return {Boolean} true if cancelled or false/undefined if it wasn't found
    */
    run.cancel = function(timer) {
      return backburner.cancel(timer);
    };

    /**
      Delay calling the target method until the debounce period has elapsed
      with no additional debounce calls. If `debounce` is called again before
      the specified time has elapsed, the timer is reset and the entire period
      must pass again before the target method is called.

      This method should be used when an event may be called multiple times
      but the action should only be called once when the event is done firing.
      A common example is for scroll events where you only want updates to
      happen once scrolling has ceased.

      ```javascript
        var myFunc = function() { console.log(this.name + ' ran.'); };
        var myContext = {name: 'debounce'};

        run.debounce(myContext, myFunc, 150);

        // less than 150ms passes

        run.debounce(myContext, myFunc, 150);

        // 150ms passes
        // myFunc is invoked with context myContext
        // console logs 'debounce ran.' one time.
      ```

      Immediate allows you to run the function immediately, but debounce
      other calls for this function until the wait time has elapsed. If
      `debounce` is called again before the specified time has elapsed,
      the timer is reset and the entire period must pass again before
      the method can be called again.

      ```javascript
        var myFunc = function() { console.log(this.name + ' ran.'); };
        var myContext = {name: 'debounce'};

        run.debounce(myContext, myFunc, 150, true);

        // console logs 'debounce ran.' one time immediately.
        // 100ms passes

        run.debounce(myContext, myFunc, 150, true);

        // 150ms passes and nothing else is logged to the console and
        // the debouncee is no longer being watched

        run.debounce(myContext, myFunc, 150, true);

        // console logs 'debounce ran.' one time immediately.
        // 150ms passes and nothing else is logged to the console and
        // the debouncee is no longer being watched

      ```

      @method debounce
      @param {Object} [target] target of method to invoke
      @param {Function|String} method The method to invoke.
        May be a function or a string. If you pass a string
        then it will be looked up on the passed target.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @param {Number} wait Number of milliseconds to wait.
      @param {Boolean} immediate Trigger the function on the leading instead
        of the trailing edge of the wait interval. Defaults to false.
      @return {Array} Timer information for use in cancelling, see `run.cancel`.
    */
    run.debounce = function() {
      return apply(backburner, backburner.debounce, arguments);
    };

    /**
      Ensure that the target method is never called more frequently than
      the specified spacing period. The target method is called immediately.

      ```javascript
        var myFunc = function() { console.log(this.name + ' ran.'); };
        var myContext = {name: 'throttle'};

        run.throttle(myContext, myFunc, 150);
        // myFunc is invoked with context myContext
        // console logs 'throttle ran.'

        // 50ms passes
        run.throttle(myContext, myFunc, 150);

        // 50ms passes
        run.throttle(myContext, myFunc, 150);

        // 150ms passes
        run.throttle(myContext, myFunc, 150);
        // myFunc is invoked with context myContext
        // console logs 'throttle ran.'
      ```

      @method throttle
      @param {Object} [target] target of method to invoke
      @param {Function|String} method The method to invoke.
        May be a function or a string. If you pass a string
        then it will be looked up on the passed target.
      @param {Object} [args*] Optional arguments to pass to the timeout.
      @param {Number} spacing Number of milliseconds to space out requests.
      @param {Boolean} immediate Trigger the function on the leading instead
        of the trailing edge of the wait interval. Defaults to true.
      @return {Array} Timer information for use in cancelling, see `run.cancel`.
    */
    run.throttle = function() {
      return apply(backburner, backburner.throttle, arguments);
    };

    // Make sure it's not an autorun during testing
    function checkAutoRun() {
      if (!run.currentRunLoop) {
        Ember.assert("You have turned on testing mode, which disabled the run-loop's autorun. You will need to wrap any code with asynchronous side-effects in an run", !Ember.testing);
      }
    }

    /**
      Add a new named queue after the specified queue.

      The queue to add will only be added once.

      @method _addQueue
      @param {String} name the name of the queue to add.
      @param {String} after the name of the queue to add after.
      @private
    */
    run._addQueue = function(name, after) {
      if (indexOf.call(run.queues, name) === -1) {
        run.queues.splice(indexOf.call(run.queues, after)+1, 0, name);
      }
    }

    __exports__["default"] = run
  });
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
define("ember-metal/utils",
  ["ember-metal/core","ember-metal/platform","ember-metal/array","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var platform = __dependency2__.platform;
    var create = __dependency2__.create;
    var forEach = __dependency3__.forEach;

    /**
    @module ember-metal
    */

    /**
      Prefix used for guids through out Ember.
      @private
      @property GUID_PREFIX
      @for Ember
      @type String
      @final
    */
    var GUID_PREFIX = 'ember';


    var o_defineProperty = platform.defineProperty,
        o_create = create,
        // Used for guid generation...
        numberCache  = [],
        stringCache  = {},
        uuid = 0;

    var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

    /**
      A unique key used to assign guids and other private metadata to objects.
      If you inspect an object in your browser debugger you will often see these.
      They can be safely ignored.

      On browsers that support it, these properties are added with enumeration
      disabled so they won't show up when you iterate over your properties.

      @private
      @property GUID_KEY
      @for Ember
      @type String
      @final
    */
    var GUID_KEY = '__ember' + (+ new Date());

    var GUID_DESC = {
      writable:    false,
      configurable: false,
      enumerable:  false,
      value: null
    };

    /**
      Generates a new guid, optionally saving the guid to the object that you
      pass in. You will rarely need to use this method. Instead you should
      call `Ember.guidFor(obj)`, which return an existing guid if available.

      @private
      @method generateGuid
      @for Ember
      @param {Object} [obj] Object the guid will be used for. If passed in, the guid will
        be saved on the object and reused whenever you pass the same object
        again.

        If no object is passed, just generate a new guid.
      @param {String} [prefix] Prefix to place in front of the guid. Useful when you want to
        separate the guid into separate namespaces.
      @return {String} the guid
    */
    function generateGuid(obj, prefix) {
      if (!prefix) prefix = GUID_PREFIX;
      var ret = (prefix + (uuid++));
      if (obj) {
        if (obj[GUID_KEY] === null) {
          obj[GUID_KEY] = ret;
        } else {
          GUID_DESC.value = ret;
          o_defineProperty(obj, GUID_KEY, GUID_DESC);
        }
      }
      return ret;
    }

    /**
      Returns a unique id for the object. If the object does not yet have a guid,
      one will be assigned to it. You can call this on any object,
      `Ember.Object`-based or not, but be aware that it will add a `_guid`
      property.

      You can also use this method on DOM Element objects.

      @private
      @method guidFor
      @for Ember
      @param {Object} obj any object, string, number, Element, or primitive
      @return {String} the unique guid for this instance.
    */
    function guidFor(obj) {

      // special cases where we don't want to add a key to object
      if (obj === undefined) return "(undefined)";
      if (obj === null) return "(null)";

      var ret;
      var type = typeof obj;

      // Don't allow prototype changes to String etc. to change the guidFor
      switch(type) {
        case 'number':
          ret = numberCache[obj];
          if (!ret) ret = numberCache[obj] = 'nu'+obj;
          return ret;

        case 'string':
          ret = stringCache[obj];
          if (!ret) ret = stringCache[obj] = 'st'+(uuid++);
          return ret;

        case 'boolean':
          return obj ? '(true)' : '(false)';

        default:
          if (obj[GUID_KEY]) return obj[GUID_KEY];
          if (obj === Object) return '(Object)';
          if (obj === Array)  return '(Array)';
          ret = 'ember' + (uuid++);

          if (obj[GUID_KEY] === null) {
            obj[GUID_KEY] = ret;
          } else {
            GUID_DESC.value = ret;
            o_defineProperty(obj, GUID_KEY, GUID_DESC);
          }
          return ret;
      }
    };

    // ..........................................................
    // META
    //

    var META_DESC = {
      writable:    true,
      configurable: false,
      enumerable:  false,
      value: null
    };


    /**
      The key used to store meta information on object for property observing.

      @property META_KEY
      @for Ember
      @private
      @final
      @type String
    */
    var META_KEY = '__ember_meta__';

    var isDefinePropertySimulated = platform.defineProperty.isSimulated;

    function Meta(obj) {
      this.descs = {};
      this.watching = {};
      this.cache = {};
      this.cacheMeta = {};
      this.source = obj;
    }

    Meta.prototype = {
      descs: null,
      deps: null,
      watching: null,
      listeners: null,
      cache: null,
      cacheMeta: null,
      source: null,
      mixins: null,
      bindings: null,
      chains: null,
      chainWatchers: null,
      values: null,
      proto: null
    };

    if (isDefinePropertySimulated) {
      // on platforms that don't support enumerable false
      // make meta fail jQuery.isPlainObject() to hide from
      // jQuery.extend() by having a property that fails
      // hasOwnProperty check.
      Meta.prototype.__preventPlainObject__ = true;

      // Without non-enumerable properties, meta objects will be output in JSON
      // unless explicitly suppressed
      Meta.prototype.toJSON = function () { };
    }

    // Placeholder for non-writable metas.
    var EMPTY_META = new Meta(null);

    if (MANDATORY_SETTER) { EMPTY_META.values = {}; }

    /**
      Retrieves the meta hash for an object. If `writable` is true ensures the
      hash is writable for this object as well.

      The meta object contains information about computed property descriptors as
      well as any watched properties and other information. You generally will
      not access this information directly but instead work with higher level
      methods that manipulate this hash indirectly.

      @method meta
      @for Ember
      @private

      @param {Object} obj The object to retrieve meta for
      @param {Boolean} [writable=true] Pass `false` if you do not intend to modify
        the meta hash, allowing the method to avoid making an unnecessary copy.
      @return {Object} the meta hash for an object
    */
    var agent = window.navigator.userAgent;
    var mayNeedFix = agent.indexOf('iPhone') > -1 && agent.indexOf('Version/8.0 Mobile');

    function meta(obj, writable) {

      var ret = obj[META_KEY];
      if (writable===false) return ret || EMPTY_META;

      if (!ret) {
        if (!isDefinePropertySimulated) o_defineProperty(obj, META_KEY, META_DESC);

        ret = new Meta(obj);

        if (MANDATORY_SETTER) { ret.values = {}; }

        obj[META_KEY] = ret;

        // make sure we don't accidentally try to create constructor like desc
        ret.descs.constructor = null;

      } else if (ret.source !== obj) {
        if (!isDefinePropertySimulated) o_defineProperty(obj, META_KEY, META_DESC);

        var newRet;
        if (mayNeedFix) {
          newRet = { };
        } else {
          newRet = o_create(ret);
        }

        newRet.descs     = o_create(ret.descs);
        newRet.watching  = o_create(ret.watching);
        newRet.cache     = {};
        newRet.cacheMeta = {};
        newRet.source    = obj;

        if (MANDATORY_SETTER) { ret.values = o_create(ret.values); }

        if(mayNeedFix) {
          newRet.__proto__ = ret;
        }
        ret           = newRet;
        obj[META_KEY] = ret;
      }
      return ret;
    };

    function getMeta(obj, property) {
      var _meta = meta(obj, false);
      return _meta[property];
    };

    function setMeta(obj, property, value) {
      var _meta = meta(obj, true);
      _meta[property] = value;
      return value;
    };

    /**
      @deprecated
      @private

      In order to store defaults for a class, a prototype may need to create
      a default meta object, which will be inherited by any objects instantiated
      from the class's constructor.

      However, the properties of that meta object are only shallow-cloned,
      so if a property is a hash (like the event system's `listeners` hash),
      it will by default be shared across all instances of that class.

      This method allows extensions to deeply clone a series of nested hashes or
      other complex objects. For instance, the event system might pass
      `['listeners', 'foo:change', 'ember157']` to `prepareMetaPath`, which will
      walk down the keys provided.

      For each key, if the key does not exist, it is created. If it already
      exists and it was inherited from its constructor, the constructor's
      key is cloned.

      You can also pass false for `writable`, which will simply return
      undefined if `prepareMetaPath` discovers any part of the path that
      shared or undefined.

      @method metaPath
      @for Ember
      @param {Object} obj The object whose meta we are examining
      @param {Array} path An array of keys to walk down
      @param {Boolean} writable whether or not to create a new meta
        (or meta property) if one does not already exist or if it's
        shared with its constructor
    */
    function metaPath(obj, path, writable) {
      Ember.deprecate("Ember.metaPath is deprecated and will be removed from future releases.");
      var _meta = meta(obj, writable), keyName, value;

      for (var i=0, l=path.length; i<l; i++) {
        keyName = path[i];
        value = _meta[keyName];

        if (!value) {
          if (!writable) { return undefined; }
          value = _meta[keyName] = { __ember_source__: obj };
        } else if (value.__ember_source__ !== obj) {
          if (!writable) { return undefined; }
          value = _meta[keyName] = o_create(value);
          value.__ember_source__ = obj;
        }

        _meta = value;
      }

      return value;
    };

    /**
      Wraps the passed function so that `this._super` will point to the superFunc
      when the function is invoked. This is the primitive we use to implement
      calls to super.

      @private
      @method wrap
      @for Ember
      @param {Function} func The function to call
      @param {Function} superFunc The super function.
      @return {Function} wrapped function.
    */
    function wrap(func, superFunc) {
      function superWrapper() {
        var ret, sup = this.__nextSuper;
        this.__nextSuper = superFunc;
        ret = apply(this, func, arguments);
        this.__nextSuper = sup;
        return ret;
      }

      superWrapper.wrappedFunction = func;
      superWrapper.wrappedFunction.__ember_arity__ = func.length;
      superWrapper.__ember_observes__ = func.__ember_observes__;
      superWrapper.__ember_observesBefore__ = func.__ember_observesBefore__;
      superWrapper.__ember_listens__ = func.__ember_listens__;

      return superWrapper;
    };

    var EmberArray;

    /**
      Returns true if the passed object is an array or Array-like.

      Ember Array Protocol:

        - the object has an objectAt property
        - the object is a native Array
        - the object is an Object, and has a length property

      Unlike `Ember.typeOf` this method returns true even if the passed object is
      not formally array but appears to be array-like (i.e. implements `Ember.Array`)

      ```javascript
      Ember.isArray();                                          // false
      Ember.isArray([]);                                        // true
      Ember.isArray(Ember.ArrayProxy.create({ content: [] }));  // true
      ```

      @method isArray
      @for Ember
      @param {Object} obj The object to test
      @return {Boolean} true if the passed object is an array or Array-like
    */
    // ES6TODO: Move up to runtime? This is only use in ember-metal by concatenatedProperties
    function isArray(obj) {
      var modulePath, type;

      if (typeof EmberArray === "undefined") {
        modulePath = 'ember-runtime/mixins/array';
        if (requirejs._eak_seen[modulePath]) {
          EmberArray = requireModule(modulePath)['default'];
        }
      }

      if (!obj || obj.setInterval) { return false; }
      if (Array.isArray && Array.isArray(obj)) { return true; }
      if (EmberArray && EmberArray.detect(obj)) { return true; }

      type = typeOf(obj);
      if ('array' === type) { return true; }
      if ((obj.length !== undefined) && 'object' === type) { return true; }
      return false;
    };

    /**
      Forces the passed object to be part of an array. If the object is already
      an array or array-like, returns the object. Otherwise adds the object to
      an array. If obj is `null` or `undefined`, returns an empty array.

      ```javascript
      Ember.makeArray();            // []
      Ember.makeArray(null);        // []
      Ember.makeArray(undefined);   // []
      Ember.makeArray('lindsay');   // ['lindsay']
      Ember.makeArray([1, 2, 42]);  // [1, 2, 42]

      var controller = Ember.ArrayProxy.create({ content: [] });

      Ember.makeArray(controller) === controller;  // true
      ```

      @method makeArray
      @for Ember
      @param {Object} obj the object
      @return {Array}
    */
    function makeArray(obj) {
      if (obj === null || obj === undefined) { return []; }
      return isArray(obj) ? obj : [obj];
    };

    /**
      Checks to see if the `methodName` exists on the `obj`.

      ```javascript
      var foo = { bar: Ember.K, baz: null };

      Ember.canInvoke(foo, 'bar'); // true
      Ember.canInvoke(foo, 'baz'); // false
      Ember.canInvoke(foo, 'bat'); // false
      ```

      @method canInvoke
      @for Ember
      @param {Object} obj The object to check for the method
      @param {String} methodName The method name to check for
      @return {Boolean}
    */
    function canInvoke(obj, methodName) {
      return !!(obj && typeof obj[methodName] === 'function');
    }

    /**
      Checks to see if the `methodName` exists on the `obj`,
      and if it does, invokes it with the arguments passed.

      ```javascript
      var d = new Date('03/15/2013');

      Ember.tryInvoke(d, 'getTime');              // 1363320000000
      Ember.tryInvoke(d, 'setFullYear', [2014]);  // 1394856000000
      Ember.tryInvoke(d, 'noSuchMethod', [2014]); // undefined
      ```

      @method tryInvoke
      @for Ember
      @param {Object} obj The object to check for the method
      @param {String} methodName The method name to check for
      @param {Array} [args] The arguments to pass to the method
      @return {*} the return value of the invoked method or undefined if it cannot be invoked
    */
    function tryInvoke(obj, methodName, args) {
      if (canInvoke(obj, methodName)) {
        return args ? applyStr(obj, methodName, args) : applyStr(obj, methodName);
      }
    };

    // https://github.com/emberjs/ember.js/pull/1617
    var needsFinallyFix = (function() {
      var count = 0;
      try{
        try { }
        finally {
          count++;
          throw new Error('needsFinallyFixTest');
        }
      } catch (e) {}

      return count !== 1;
    })();

    /**
      Provides try/finally functionality, while working
      around Safari's double finally bug.

      ```javascript
      var tryable = function() {
        someResource.lock();
        runCallback(); // May throw error.
      };

      var finalizer = function() {
        someResource.unlock();
      };

      Ember.tryFinally(tryable, finalizer);
      ```

      @method tryFinally
      @for Ember
      @param {Function} tryable The function to run the try callback
      @param {Function} finalizer The function to run the finally callback
      @param {Object} [binding] The optional calling object. Defaults to 'this'
      @return {*} The return value is the that of the finalizer,
      unless that value is undefined, in which case it is the return value
      of the tryable
    */

    var tryFinally;
    if (needsFinallyFix) {
      tryFinally = function(tryable, finalizer, binding) {
        var result, finalResult, finalError;

        binding = binding || this;

        try {
          result = tryable.call(binding);
        } finally {
          try {
            finalResult = finalizer.call(binding);
          } catch (e) {
            finalError = e;
          }
        }

        if (finalError) { throw finalError; }

        return (finalResult === undefined) ? result : finalResult;
      };
    } else {
      tryFinally = function(tryable, finalizer, binding) {
        var result, finalResult;

        binding = binding || this;

        try {
          result = tryable.call(binding);
        } finally {
          finalResult = finalizer.call(binding);
        }

        return (finalResult === undefined) ? result : finalResult;
      };
    }

    /**
      Provides try/catch/finally functionality, while working
      around Safari's double finally bug.

      ```javascript
      var tryable = function() {
        for (i = 0, l = listeners.length; i < l; i++) {
          listener = listeners[i];
          beforeValues[i] = listener.before(name, time(), payload);
        }

        return callback.call(binding);
      };

      var catchable = function(e) {
        payload = payload || {};
        payload.exception = e;
      };

      var finalizer = function() {
        for (i = 0, l = listeners.length; i < l; i++) {
          listener = listeners[i];
          listener.after(name, time(), payload, beforeValues[i]);
        }
      };

      Ember.tryCatchFinally(tryable, catchable, finalizer);
      ```

      @method tryCatchFinally
      @for Ember
      @param {Function} tryable The function to run the try callback
      @param {Function} catchable The function to run the catchable callback
      @param {Function} finalizer The function to run the finally callback
      @param {Object} [binding] The optional calling object. Defaults to 'this'
      @return {*} The return value is the that of the finalizer,
      unless that value is undefined, in which case it is the return value
      of the tryable.
    */
    var tryCatchFinally;
    if (needsFinallyFix) {
      tryCatchFinally = function(tryable, catchable, finalizer, binding) {
        var result, finalResult, finalError;

        binding = binding || this;

        try {
          result = tryable.call(binding);
        } catch(error) {
          result = catchable.call(binding, error);
        } finally {
          try {
            finalResult = finalizer.call(binding);
          } catch (e) {
            finalError = e;
          }
        }

        if (finalError) { throw finalError; }

        return (finalResult === undefined) ? result : finalResult;
      };
    } else {
      tryCatchFinally = function(tryable, catchable, finalizer, binding) {
        var result, finalResult;

        binding = binding || this;

        try {
          result = tryable.call(binding);
        } catch(error) {
          result = catchable.call(binding, error);
        } finally {
          finalResult = finalizer.call(binding);
        }

        return (finalResult === undefined) ? result : finalResult;
      };
    }

    // ........................................
    // TYPING & ARRAY MESSAGING
    //

    var TYPE_MAP = {};
    var t = "Boolean Number String Function Array Date RegExp Object".split(" ");
    forEach.call(t, function(name) {
      TYPE_MAP[ "[object " + name + "]" ] = name.toLowerCase();
    });

    var toString = Object.prototype.toString;

    var EmberObject;

    /**
      Returns a consistent type for the passed item.

      Use this instead of the built-in `typeof` to get the type of an item.
      It will return the same result across all browsers and includes a bit
      more detail. Here is what will be returned:

          | Return Value  | Meaning                                              |
          |---------------|------------------------------------------------------|
          | 'string'      | String primitive or String object.                   |
          | 'number'      | Number primitive or Number object.                   |
          | 'boolean'     | Boolean primitive or Boolean object.                 |
          | 'null'        | Null value                                           |
          | 'undefined'   | Undefined value                                      |
          | 'function'    | A function                                           |
          | 'array'       | An instance of Array                                 |
          | 'regexp'      | An instance of RegExp                                |
          | 'date'        | An instance of Date                                  |
          | 'class'       | An Ember class (created using Ember.Object.extend()) |
          | 'instance'    | An Ember object instance                             |
          | 'error'       | An instance of the Error object                      |
          | 'object'      | A JavaScript object not inheriting from Ember.Object |

      Examples:

      ```javascript
      Ember.typeOf();                       // 'undefined'
      Ember.typeOf(null);                   // 'null'
      Ember.typeOf(undefined);              // 'undefined'
      Ember.typeOf('michael');              // 'string'
      Ember.typeOf(new String('michael'));  // 'string'
      Ember.typeOf(101);                    // 'number'
      Ember.typeOf(new Number(101));        // 'number'
      Ember.typeOf(true);                   // 'boolean'
      Ember.typeOf(new Boolean(true));      // 'boolean'
      Ember.typeOf(Ember.makeArray);        // 'function'
      Ember.typeOf([1, 2, 90]);             // 'array'
      Ember.typeOf(/abc/);                  // 'regexp'
      Ember.typeOf(new Date());             // 'date'
      Ember.typeOf(Ember.Object.extend());  // 'class'
      Ember.typeOf(Ember.Object.create());  // 'instance'
      Ember.typeOf(new Error('teamocil'));  // 'error'

      // 'normal' JavaScript object
      Ember.typeOf({ a: 'b' });             // 'object'
      ```

      @method typeOf
      @for Ember
      @param {Object} item the item to check
      @return {String} the type
    */
    function typeOf(item) {
      var ret, modulePath;

      // ES6TODO: Depends on Ember.Object which is defined in runtime.
      if (typeof EmberObject === "undefined") {
        modulePath = 'ember-runtime/system/object';
        if (requirejs._eak_seen[modulePath]) {
          EmberObject = requireModule(modulePath)['default'];
        }
      }

      ret = (item === null || item === undefined) ? String(item) : TYPE_MAP[toString.call(item)] || 'object';

      if (ret === 'function') {
        if (EmberObject && EmberObject.detect(item)) ret = 'class';
      } else if (ret === 'object') {
        if (item instanceof Error) ret = 'error';
        else if (EmberObject && item instanceof EmberObject) ret = 'instance';
        else if (item instanceof Date) ret = 'date';
      }

      return ret;
    };

    /**
      Convenience method to inspect an object. This method will attempt to
      convert the object into a useful string description.

      It is a pretty simple implementation. If you want something more robust,
      use something like JSDump: https://github.com/NV/jsDump

      @method inspect
      @for Ember
      @param {Object} obj The object you want to inspect.
      @return {String} A description of the object
      @since 1.4.0
    */
    function inspect(obj) {
      var type = typeOf(obj);
      if (type === 'array') {
        return '[' + obj + ']';
      }
      if (type !== 'object') {
        return obj + '';
      }

      var v, ret = [];
      for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
          v = obj[key];
          if (v === 'toString') { continue; } // ignore useless items
          if (typeOf(v) === 'function') { v = "function() { ... }"; }
          ret.push(key + ": " + v);
        }
      }
      return "{" + ret.join(", ") + "}";
    };

    // The following functions are intentionally minified to keep the functions
    // below Chrome's function body size inlining limit of 600 chars.

    function apply(t /* target */, m /* method */, a /* args */) {
      var l = a && a.length;
      if (!a || !l) { return m.call(t); }
      switch (l) {
        case 1:  return m.call(t, a[0]);
        case 2:  return m.call(t, a[0], a[1]);
        case 3:  return m.call(t, a[0], a[1], a[2]);
        case 4:  return m.call(t, a[0], a[1], a[2], a[3]);
        case 5:  return m.call(t, a[0], a[1], a[2], a[3], a[4]);
        default: return m.apply(t, a);
      }
    };

    function applyStr(t /* target */, m /* method */, a /* args */) {
      var l = a && a.length;
      if (!a || !l) { return t[m](); }
      switch (l) {
        case 1:  return t[m](a[0]);
        case 2:  return t[m](a[0], a[1]);
        case 3:  return t[m](a[0], a[1], a[2]);
        case 4:  return t[m](a[0], a[1], a[2], a[3]);
        case 5:  return t[m](a[0], a[1], a[2], a[3], a[4]);
        default: return t[m].apply(t, a);
      }
    };

    __exports__.generateGuid = generateGuid;
    __exports__.GUID_KEY = GUID_KEY;
    __exports__.GUID_PREFIX = GUID_PREFIX;
    __exports__.guidFor = guidFor;
    __exports__.META_DESC = META_DESC;
    __exports__.EMPTY_META = EMPTY_META;
    __exports__.META_KEY = META_KEY;
    __exports__.meta = meta;
    __exports__.getMeta = getMeta;
    __exports__.setMeta = setMeta;
    __exports__.metaPath = metaPath;
    __exports__.inspect = inspect;
    __exports__.typeOf = typeOf;
    __exports__.tryCatchFinally = tryCatchFinally;
    __exports__.isArray = isArray;
    __exports__.makeArray = makeArray;
    __exports__.canInvoke = canInvoke;
    __exports__.tryInvoke = tryInvoke;
    __exports__.tryFinally = tryFinally;
    __exports__.wrap = wrap;
    __exports__.applyStr = applyStr;
    __exports__.apply = apply;
  });
define("backburner",
  ["backburner/utils","backburner/deferred_action_queues","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Utils = __dependency1__["default"];
    var DeferredActionQueues = __dependency2__.DeferredActionQueues;

    var slice = [].slice,
        pop = [].pop,
        each = Utils.each,
        isString = Utils.isString,
        isFunction = Utils.isFunction,
        isNumber = Utils.isNumber,
        timers = [],
        global = this,
        NUMBER = /\d+/;

    // In IE 6-8, try/finally doesn't work without a catch.
    // Unfortunately, this is impossible to test for since wrapping it in a parent try/catch doesn't trigger the bug.
    // This tests for another broken try/catch behavior that only exhibits in the same versions of IE.
    var needsIETryCatchFix = (function(e,x){
      try{ x(); }
      catch(e) { } // jshint ignore:line
      return !!e;
    })();

    function isCoercableNumber(number) {
      return isNumber(number) || NUMBER.test(number);
    }

    function Backburner(queueNames, options) {
      this.queueNames = queueNames;
      this.options = options || {};
      if (!this.options.defaultQueue) {
        this.options.defaultQueue = queueNames[0];
      }
      this.instanceStack = [];
      this._debouncees = [];
      this._throttlers = [];
    }

    Backburner.prototype = {
      queueNames: null,
      options: null,
      currentInstance: null,
      instanceStack: null,

      begin: function() {
        var options = this.options,
            onBegin = options && options.onBegin,
            previousInstance = this.currentInstance;

        if (previousInstance) {
          this.instanceStack.push(previousInstance);
        }

        this.currentInstance = new DeferredActionQueues(this.queueNames, options);
        if (onBegin) {
          onBegin(this.currentInstance, previousInstance);
        }
      },

      end: function() {
        var options = this.options,
            onEnd = options && options.onEnd,
            currentInstance = this.currentInstance,
            nextInstance = null;

        // Prevent double-finally bug in Safari 6.0.2 and iOS 6
        // This bug appears to be resolved in Safari 6.0.5 and iOS 7
        var finallyAlreadyCalled = false;
        try {
          currentInstance.flush();
        } finally {
          if (!finallyAlreadyCalled) {
            finallyAlreadyCalled = true;

            this.currentInstance = null;

            if (this.instanceStack.length) {
              nextInstance = this.instanceStack.pop();
              this.currentInstance = nextInstance;
            }

            if (onEnd) {
              onEnd(currentInstance, nextInstance);
            }
          }
        }
      },

      run: function(target, method /*, args */) {
        var onError = getOnError(this.options);

        this.begin();

        if (!method) {
          method = target;
          target = null;
        }

        if (isString(method)) {
          method = target[method];
        }

        var args = slice.call(arguments, 2);

        // guard against Safari 6's double-finally bug
        var didFinally = false;

        if (onError) {
          try {
            return method.apply(target, args);
          } catch(error) {
            onError(error);
          } finally {
            if (!didFinally) {
              didFinally = true;
              this.end();
            }
          }
        } else {
          try {
            return method.apply(target, args);
          } finally {
            if (!didFinally) {
              didFinally = true;
              this.end();
            }
          }
        }
      },

      defer: function(queueName, target, method /* , args */) {
        if (!method) {
          method = target;
          target = null;
        }

        if (isString(method)) {
          method = target[method];
        }

        var stack = this.DEBUG ? new Error() : undefined,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, false, stack);
      },

      deferOnce: function(queueName, target, method /* , args */) {
        if (!method) {
          method = target;
          target = null;
        }

        if (isString(method)) {
          method = target[method];
        }

        var stack = this.DEBUG ? new Error() : undefined,
            args = arguments.length > 3 ? slice.call(arguments, 3) : undefined;
        if (!this.currentInstance) { createAutorun(this); }
        return this.currentInstance.schedule(queueName, target, method, args, true, stack);
      },

      setTimeout: function() {
        var args = slice.call(arguments),
            length = args.length,
            method, wait, target,
            methodOrTarget, methodOrWait, methodOrArgs;

        if (length === 0) {
          return;
        } else if (length === 1) {
          method = args.shift();
          wait = 0;
        } else if (length === 2) {
          methodOrTarget = args[0];
          methodOrWait = args[1];

          if (isFunction(methodOrWait) || isFunction(methodOrTarget[methodOrWait])) {
            target = args.shift();
            method = args.shift();
            wait = 0;
          } else if (isCoercableNumber(methodOrWait)) {
            method = args.shift();
            wait = args.shift();
          } else {
            method = args.shift();
            wait =  0;
          }
        } else {
          var last = args[args.length - 1];

          if (isCoercableNumber(last)) {
            wait = args.pop();
          } else {
            wait = 0;
          }

          methodOrTarget = args[0];
          methodOrArgs = args[1];

          if (isFunction(methodOrArgs) || (isString(methodOrArgs) &&
                                          methodOrTarget !== null &&
                                          methodOrArgs in methodOrTarget)) {
            target = args.shift();
            method = args.shift();
          } else {
            method = args.shift();
          }
        }

        var executeAt = (+new Date()) + parseInt(wait, 10);

        if (isString(method)) {
          method = target[method];
        }

        var onError = getOnError(this.options);

        function fn() {
          if (onError) {
            try {
              method.apply(target, args);
            } catch (e) {
              onError(e);
            }
          } else {
            method.apply(target, args);
          }
        }

        // find position to insert
        var i = searchTimer(executeAt, timers);

        timers.splice(i, 0, executeAt, fn);

        updateLaterTimer(this, executeAt, wait);

        return fn;
      },

      throttle: function(target, method /* , args, wait, [immediate] */) {
        var self = this,
            args = arguments,
            immediate = pop.call(args),
            wait,
            throttler,
            index,
            timer;

        if (isNumber(immediate) || isString(immediate)) {
          wait = immediate;
          immediate = true;
        } else {
          wait = pop.call(args);
        }

        wait = parseInt(wait, 10);

        index = findThrottler(target, method, this._throttlers);
        if (index > -1) { return this._throttlers[index]; } // throttled

        timer = global.setTimeout(function() {
          if (!immediate) {
            self.run.apply(self, args);
          }
          var index = findThrottler(target, method, self._throttlers);
          if (index > -1) {
            self._throttlers.splice(index, 1);
          }
        }, wait);

        if (immediate) {
          self.run.apply(self, args);
        }

        throttler = [target, method, timer];

        this._throttlers.push(throttler);

        return throttler;
      },

      debounce: function(target, method /* , args, wait, [immediate] */) {
        var self = this,
            args = arguments,
            immediate = pop.call(args),
            wait,
            index,
            debouncee,
            timer;

        if (isNumber(immediate) || isString(immediate)) {
          wait = immediate;
          immediate = false;
        } else {
          wait = pop.call(args);
        }

        wait = parseInt(wait, 10);
        // Remove debouncee
        index = findDebouncee(target, method, this._debouncees);

        if (index > -1) {
          debouncee = this._debouncees[index];
          this._debouncees.splice(index, 1);
          clearTimeout(debouncee[2]);
        }

        timer = global.setTimeout(function() {
          if (!immediate) {
            self.run.apply(self, args);
          }
          var index = findDebouncee(target, method, self._debouncees);
          if (index > -1) {
            self._debouncees.splice(index, 1);
          }
        }, wait);

        if (immediate && index === -1) {
          self.run.apply(self, args);
        }

        debouncee = [target, method, timer];

        self._debouncees.push(debouncee);

        return debouncee;
      },

      cancelTimers: function() {
        var clearItems = function(item) {
          clearTimeout(item[2]);
        };

        each(this._throttlers, clearItems);
        this._throttlers = [];

        each(this._debouncees, clearItems);
        this._debouncees = [];

        if (this._laterTimer) {
          clearTimeout(this._laterTimer);
          this._laterTimer = null;
        }
        timers = [];

        if (this._autorun) {
          clearTimeout(this._autorun);
          this._autorun = null;
        }
      },

      hasTimers: function() {
        return !!timers.length || !!this._debouncees.length || !!this._throttlers.length || this._autorun;
      },

      cancel: function(timer) {
        var timerType = typeof timer;

        if (timer && timerType === 'object' && timer.queue && timer.method) { // we're cancelling a deferOnce
          return timer.queue.cancel(timer);
        } else if (timerType === 'function') { // we're cancelling a setTimeout
          for (var i = 0, l = timers.length; i < l; i += 2) {
            if (timers[i + 1] === timer) {
              timers.splice(i, 2); // remove the two elements
              return true;
            }
          }
        } else if (Object.prototype.toString.call(timer) === "[object Array]"){ // we're cancelling a throttle or debounce
          return this._cancelItem(findThrottler, this._throttlers, timer) ||
                   this._cancelItem(findDebouncee, this._debouncees, timer);
        } else {
          return; // timer was null or not a timer
        }
      },

      _cancelItem: function(findMethod, array, timer){
        var item,
            index;

        if (timer.length < 3) { return false; }

        index = findMethod(timer[0], timer[1], array);

        if(index > -1) {

          item = array[index];

          if(item[2] === timer[2]){
            array.splice(index, 1);
            clearTimeout(timer[2]);
            return true;
          }
        }

        return false;
      }
    };

    Backburner.prototype.schedule = Backburner.prototype.defer;
    Backburner.prototype.scheduleOnce = Backburner.prototype.deferOnce;
    Backburner.prototype.later = Backburner.prototype.setTimeout;

    if (needsIETryCatchFix) {
      var originalRun = Backburner.prototype.run;
      Backburner.prototype.run = wrapInTryCatch(originalRun);

      var originalEnd = Backburner.prototype.end;
      Backburner.prototype.end = wrapInTryCatch(originalEnd);
    }

    function wrapInTryCatch(func) {
      return function () {
        try {
          return func.apply(this, arguments);
        } catch (e) {
          throw e;
        }
      };
    }

    function getOnError(options) {
      return options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]);
    }


    function createAutorun(backburner) {
      backburner.begin();
      backburner._autorun = global.setTimeout(function() {
        backburner._autorun = null;
        backburner.end();
      });
    }

    function updateLaterTimer(self, executeAt, wait) {
      if (!self._laterTimer || executeAt < self._laterTimerExpiresAt) {
        self._laterTimer = global.setTimeout(function() {
          self._laterTimer = null;
          self._laterTimerExpiresAt = null;
          executeTimers(self);
        }, wait);
        self._laterTimerExpiresAt = executeAt;
      }
    }

    function executeTimers(self) {
      var now = +new Date(),
          time, fns, i, l;

      self.run(function() {
        i = searchTimer(now, timers);

        fns = timers.splice(0, i);

        for (i = 1, l = fns.length; i < l; i += 2) {
          self.schedule(self.options.defaultQueue, null, fns[i]);
        }
      });

      if (timers.length) {
        updateLaterTimer(self, timers[0], timers[0] - now);
      }
    }

    function findDebouncee(target, method, debouncees) {
      return findItem(target, method, debouncees);
    }

    function findThrottler(target, method, throttlers) {
      return findItem(target, method, throttlers);
    }

    function findItem(target, method, collection) {
      var item,
          index = -1;

      for (var i = 0, l = collection.length; i < l; i++) {
        item = collection[i];
        if (item[0] === target && item[1] === method) {
          index = i;
          break;
        }
      }

      return index;
    }

    function searchTimer(time, timers) {
      var start = 0,
          end = timers.length - 2,
          middle, l;

      while (start < end) {
        // since timers is an array of pairs 'l' will always
        // be an integer
        l = (end - start) / 2;

        // compensate for the index in case even number
        // of pairs inside timers
        middle = start + l - (l % 2);

        if (time >= timers[middle]) {
          start = middle + 2;
        } else {
          end = middle;
        }
      }

      return (time >= timers[start]) ? start + 2 : start;
    }

    __exports__.Backburner = Backburner;
  });
define("backburner/deferred_action_queues",
  ["backburner/utils","backburner/queue","exports"],
  function(__dependency1__, __dependency2__, __exports__) {
    "use strict";
    var Utils = __dependency1__["default"];
    var Queue = __dependency2__.Queue;

    var each = Utils.each,
        isString = Utils.isString;

    function DeferredActionQueues(queueNames, options) {
      var queues = this.queues = {};
      this.queueNames = queueNames = queueNames || [];

      this.options = options;

      each(queueNames, function(queueName) {
        queues[queueName] = new Queue(this, queueName, options);
      });
    }

    DeferredActionQueues.prototype = {
      queueNames: null,
      queues: null,
      options: null,

      schedule: function(queueName, target, method, args, onceFlag, stack) {
        var queues = this.queues,
            queue = queues[queueName];

        if (!queue) { throw new Error("You attempted to schedule an action in a queue (" + queueName + ") that doesn't exist"); }

        if (onceFlag) {
          return queue.pushUnique(target, method, args, stack);
        } else {
          return queue.push(target, method, args, stack);
        }
      },

      invoke: function(target, method, args, _) {
        if (args && args.length > 0) {
          method.apply(target, args);
        } else {
          method.call(target);
        }
      },

      invokeWithOnError: function(target, method, args, onError) {
        try {
          if (args && args.length > 0) {
            method.apply(target, args);
          } else {
            method.call(target);
          }
        } catch(error) {
          onError(error);
        }
      },

      flush: function() {
        var queues = this.queues,
            queueNames = this.queueNames,
            queueName, queue, queueItems, priorQueueNameIndex,
            queueNameIndex = 0, numberOfQueues = queueNames.length,
            options = this.options,
            onError = options.onError || (options.onErrorTarget && options.onErrorTarget[options.onErrorMethod]),
            invoke = onError ? this.invokeWithOnError : this.invoke;

        outerloop:
        while (queueNameIndex < numberOfQueues) {
          queueName = queueNames[queueNameIndex];
          queue = queues[queueName];
          queueItems = queue._queueBeingFlushed = queue._queue.slice();
          queue._queue = [];

          var queueOptions = queue.options, // TODO: write a test for this
              before = queueOptions && queueOptions.before,
              after = queueOptions && queueOptions.after,
              target, method, args, stack,
              queueIndex = 0, numberOfQueueItems = queueItems.length;

          if (numberOfQueueItems && before) { before(); }

          while (queueIndex < numberOfQueueItems) {
            target = queueItems[queueIndex];
            method = queueItems[queueIndex+1];
            args   = queueItems[queueIndex+2];
            stack  = queueItems[queueIndex+3]; // Debugging assistance

            if (isString(method)) { method = target[method]; }

            // method could have been nullified / canceled during flush
            if (method) {
              invoke(target, method, args, onError);
            }

            queueIndex += 4;
          }

          queue._queueBeingFlushed = null;
          if (numberOfQueueItems && after) { after(); }

          if ((priorQueueNameIndex = indexOfPriorQueueWithActions(this, queueNameIndex)) !== -1) {
            queueNameIndex = priorQueueNameIndex;
            continue outerloop;
          }

          queueNameIndex++;
        }
      }
    };

    function indexOfPriorQueueWithActions(daq, currentQueueIndex) {
      var queueName, queue;

      for (var i = 0, l = currentQueueIndex; i <= l; i++) {
        queueName = daq.queueNames[i];
        queue = daq.queues[queueName];
        if (queue._queue.length) { return i; }
      }

      return -1;
    }

    __exports__.DeferredActionQueues = DeferredActionQueues;
  });
define("backburner/queue",
  ["exports"],
  function(__exports__) {
    "use strict";
    function Queue(daq, name, options) {
      this.daq = daq;
      this.name = name;
      this.globalOptions = options;
      this.options = options[name];
      this._queue = [];
    }

    Queue.prototype = {
      daq: null,
      name: null,
      options: null,
      onError: null,
      _queue: null,

      push: function(target, method, args, stack) {
        var queue = this._queue;
        queue.push(target, method, args, stack);
        return {queue: this, target: target, method: method};
      },

      pushUnique: function(target, method, args, stack) {
        var queue = this._queue, currentTarget, currentMethod, i, l;

        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === target && currentMethod === method) {
            queue[i+2] = args; // replace args
            queue[i+3] = stack; // replace stack
            return {queue: this, target: target, method: method};
          }
        }

        queue.push(target, method, args, stack);
        return {queue: this, target: target, method: method};
      },

      // TODO: remove me, only being used for Ember.run.sync
      flush: function() {
        var queue = this._queue,
            globalOptions = this.globalOptions,
            options = this.options,
            before = options && options.before,
            after = options && options.after,
            onError = globalOptions.onError || (globalOptions.onErrorTarget && globalOptions.onErrorTarget[globalOptions.onErrorMethod]),
            target, method, args, stack, i, l = queue.length;

        if (l && before) { before(); }
        for (i = 0; i < l; i += 4) {
          target = queue[i];
          method = queue[i+1];
          args   = queue[i+2];
          stack  = queue[i+3]; // Debugging assistance

          // TODO: error handling
          if (args && args.length > 0) {
            if (onError) {
              try {
                method.apply(target, args);
              } catch (e) {
                onError(e);
              }
            } else {
              method.apply(target, args);
            }
          } else {
            if (onError) {
              try {
                method.call(target);
              } catch(e) {
                onError(e);
              }
            } else {
              method.call(target);
            }
          }
        }
        if (l && after) { after(); }

        // check if new items have been added
        if (queue.length > l) {
          this._queue = queue.slice(l);
          this.flush();
        } else {
          this._queue.length = 0;
        }
      },

      cancel: function(actionToCancel) {
        var queue = this._queue, currentTarget, currentMethod, i, l;

        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
            queue.splice(i, 4);
            return true;
          }
        }

        // if not found in current queue
        // could be in the queue that is being flushed
        queue = this._queueBeingFlushed;
        if (!queue) {
          return;
        }
        for (i = 0, l = queue.length; i < l; i += 4) {
          currentTarget = queue[i];
          currentMethod = queue[i+1];

          if (currentTarget === actionToCancel.target && currentMethod === actionToCancel.method) {
            // don't mess with array during flush
            // just nullify the method
            queue[i+1] = null;
            return true;
          }
        }
      }
    };

    __exports__.Queue = Queue;
  });
define("backburner/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    __exports__["default"] = {
      each: function(collection, callback) {
        for (var i = 0; i < collection.length; i++) {
          callback(collection[i]);
        }
      },

      isString: function(suspect) {
        return typeof suspect === 'string';
      },

      isFunction: function(suspect) {
        return typeof suspect === 'function';
      },

      isNumber: function(suspect) {
        return typeof suspect === 'number';
      }
    };
  });

define("ember-metal/watch_key",
  ["ember-metal/core","ember-metal/utils","ember-metal/platform","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var meta = __dependency2__.meta;
    var typeOf = __dependency2__.typeOf;
    var platform = __dependency3__.platform;

    var metaFor = meta, // utils.js
        MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER,
        o_defineProperty = platform.defineProperty;

    function watchKey(obj, keyName, meta) {
      // can't watch length on Array - it is special...
      if (keyName === 'length' && typeOf(obj) === 'array') { return; }

      var m = meta || metaFor(obj), watching = m.watching;

      // activate watching first time
      if (!watching[keyName]) {
        watching[keyName] = 1;

        if ('function' === typeof obj.willWatchProperty) {
          obj.willWatchProperty(keyName);
        }

        if (MANDATORY_SETTER && keyName in obj) {
          m.values[keyName] = obj[keyName];
          o_defineProperty(obj, keyName, {
            configurable: true,
            enumerable: obj.propertyIsEnumerable(keyName),
            set: Ember.MANDATORY_SETTER_FUNCTION,
            get: Ember.DEFAULT_GETTER_FUNCTION(keyName)
          });
        }
      } else {
        watching[keyName] = (watching[keyName] || 0) + 1;
      }
    };

    function unwatchKey(obj, keyName, meta) {
      var m = meta || metaFor(obj), watching = m.watching;

      if (watching[keyName] === 1) {
        watching[keyName] = 0;

        if ('function' === typeof obj.didUnwatchProperty) {
          obj.didUnwatchProperty(keyName);
        }

        if (MANDATORY_SETTER && keyName in obj) {
          o_defineProperty(obj, keyName, {
            configurable: true,
            enumerable: obj.propertyIsEnumerable(keyName),
            set: function(val) {
              // redefine to set as enumerable
              o_defineProperty(obj, keyName, {
                configurable: true,
                writable: true,
                enumerable: true,
                value: val
              });
              delete m.values[keyName];
            },
            get: Ember.DEFAULT_GETTER_FUNCTION(keyName)
          });
        }
      } else if (watching[keyName] > 1) {
        watching[keyName]--;
      }
    };

    __exports__.watchKey = watchKey;
    __exports__.unwatchKey = unwatchKey;
  });
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
})();

