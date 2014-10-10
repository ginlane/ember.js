define("ember-runtime/mixins/deferred",
  ["ember-metal/core","ember-metal/property_get","ember-metal/mixin","ember-metal/computed","ember-metal/run_loop","ember-runtime/ext/rsvp","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.FEATURES, Ember.Test
    var get = __dependency2__.get;
    var Mixin = __dependency3__.Mixin;
    var computed = __dependency4__.computed;
    var run = __dependency5__["default"];
    var RSVP = __dependency6__["default"];

    var asyncStart = function() {
      if (Ember.Test && Ember.Test.adapter) {
        Ember.Test.adapter.asyncStart();
      }
    };

    var asyncEnd = function() {
      if (Ember.Test && Ember.Test.adapter) {
        Ember.Test.adapter.asyncEnd();
      }
    };

    RSVP.configure('async', function(callback, promise) {
      var async = !run.currentRunLoop;

      if (Ember.testing && async) { asyncStart(); }

      run.backburner.schedule('actions', function(){
        if (Ember.testing && async) { asyncEnd(); }
        callback(promise);
      });
    });

    RSVP.Promise.prototype.fail = function(callback, label){
      Ember.deprecate('RSVP.Promise.fail has been renamed as RSVP.Promise.catch');
      return this['catch'](callback, label);
    };

    /**
    @module ember
    @submodule ember-runtime
    */


    /**
      @class Deferred
      @namespace Ember
     */
    var DeferredMixin = Mixin.create({
      /**
        Add handlers to be called when the Deferred object is resolved or rejected.

        @method then
        @param {Function} resolve a callback function to be called when done
        @param {Function} reject  a callback function to be called when failed
      */
      then: function(resolve, reject, label) {
        var deferred, promise, entity;

        entity = this;
        deferred = get(this, '_deferred');
        promise = deferred.promise;

        function fulfillmentHandler(fulfillment) {
          if (fulfillment === promise) {
            return resolve(entity);
          } else {
            return resolve(fulfillment);
          }
        }

        return promise.then(resolve && fulfillmentHandler, reject, label);
      },

      /**
        Resolve a Deferred object and call any `doneCallbacks` with the given args.

        @method resolve
      */
      resolve: function(value) {
        var deferred, promise;

        deferred = get(this, '_deferred');
        promise = deferred.promise;

        if (value === this) {
          deferred.resolve(promise);
        } else {
          deferred.resolve(value);
        }
      },

      /**
        Reject a Deferred object and call any `failCallbacks` with the given args.

        @method reject
      */
      reject: function(value) {
        get(this, '_deferred').reject(value);
      },

      _deferred: computed(function() {
        return RSVP.defer('Ember: DeferredMixin - ' + this);
      })
    });

    __exports__["default"] = DeferredMixin;
  });