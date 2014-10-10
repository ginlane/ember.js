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