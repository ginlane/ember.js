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