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