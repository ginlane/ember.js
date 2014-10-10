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