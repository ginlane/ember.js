define("ember-runtime",
  ["ember-metal","ember-runtime/core","ember-runtime/keys","ember-runtime/compare","ember-runtime/copy","ember-runtime/system/namespace","ember-runtime/system/object","ember-runtime/system/tracked_array","ember-runtime/system/subarray","ember-runtime/system/container","ember-runtime/system/application","ember-runtime/system/array_proxy","ember-runtime/system/object_proxy","ember-runtime/system/core_object","ember-runtime/system/each_proxy","ember-runtime/system/native_array","ember-runtime/system/set","ember-runtime/system/string","ember-runtime/system/deferred","ember-runtime/system/lazy_load","ember-runtime/mixins/array","ember-runtime/mixins/comparable","ember-runtime/mixins/copyable","ember-runtime/mixins/enumerable","ember-runtime/mixins/freezable","ember-runtime/mixins/observable","ember-runtime/mixins/action_handler","ember-runtime/mixins/deferred","ember-runtime/mixins/mutable_enumerable","ember-runtime/mixins/mutable_array","ember-runtime/mixins/target_action_support","ember-runtime/mixins/evented","ember-runtime/mixins/promise_proxy","ember-runtime/mixins/sortable","ember-runtime/computed/array_computed","ember-runtime/computed/reduce_computed","ember-runtime/computed/reduce_computed_macros","ember-runtime/controllers/array_controller","ember-runtime/controllers/object_controller","ember-runtime/controllers/controller","ember-runtime/ext/rsvp","ember-runtime/ext/string","ember-runtime/ext/function","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __dependency26__, __dependency27__, __dependency28__, __dependency29__, __dependency30__, __dependency31__, __dependency32__, __dependency33__, __dependency34__, __dependency35__, __dependency36__, __dependency37__, __dependency38__, __dependency39__, __dependency40__, __dependency41__, __dependency42__, __dependency43__, __exports__) {
    "use strict";
    /**
    Ember Runtime

    @module ember
    @submodule ember-runtime
    @requires ember-metal
    */

    // BEGIN IMPORTS
    var Ember = __dependency1__["default"];
    var isEqual = __dependency2__.isEqual;
    var keys = __dependency3__["default"];
    var compare = __dependency4__["default"];
    var copy = __dependency5__["default"];

    var Namespace = __dependency6__["default"];
    var EmberObject = __dependency7__["default"];
    var TrackedArray = __dependency8__["default"];
    var SubArray = __dependency9__["default"];
    var Container = __dependency10__["default"];
    var Application = __dependency11__["default"];
    var ArrayProxy = __dependency12__["default"];
    var ObjectProxy = __dependency13__["default"];
    var CoreObject = __dependency14__["default"];
    var EachArray = __dependency15__.EachArray;
    var EachProxy = __dependency15__.EachProxy;
    var NativeArray = __dependency16__["default"];
    var Set = __dependency17__["default"];
    var EmberStringUtils = __dependency18__["default"];
    var Deferred = __dependency19__["default"];
    var onLoad = __dependency20__.onLoad;
    var runLoadHooks = __dependency20__.runLoadHooks;

    var EmberArray = __dependency21__["default"];
    var Comparable = __dependency22__["default"];
    var Copyable = __dependency23__["default"];
    var Enumerable = __dependency24__["default"];
    var Freezable = __dependency25__.Freezable;
    var FROZEN_ERROR = __dependency25__.FROZEN_ERROR;
    var Observable = __dependency26__["default"];
    var ActionHandler = __dependency27__["default"];
    var DeferredMixin = __dependency28__["default"];
    var MutableEnumerable = __dependency29__["default"];
    var MutableArray = __dependency30__["default"];
    var TargetActionSupport = __dependency31__["default"];
    var Evented = __dependency32__["default"];
    var PromiseProxyMixin = __dependency33__["default"];
    var SortableMixin = __dependency34__["default"];

    var arrayComputed = __dependency35__.arrayComputed;
    var ArrayComputedProperty = __dependency35__.ArrayComputedProperty;
    var reduceComputed = __dependency36__.reduceComputed;
    var ReduceComputedProperty = __dependency36__.ReduceComputedProperty;
    var sum = __dependency37__.sum;
    var min = __dependency37__.min;
    var max = __dependency37__.max;
    var map = __dependency37__.map;
    var sort = __dependency37__.sort;
    var setDiff = __dependency37__.setDiff;
    var mapBy = __dependency37__.mapBy;
    var mapProperty = __dependency37__.mapProperty;
    var filter = __dependency37__.filter;
    var filterBy = __dependency37__.filterBy;
    var filterProperty = __dependency37__.filterProperty;
    var uniq = __dependency37__.uniq;
    var union = __dependency37__.union;
    var intersect = __dependency37__.intersect;

    var ArrayController = __dependency38__["default"];
    var ObjectController = __dependency39__["default"];
    var Controller = __dependency40__.Controller;
    var ControllerMixin = __dependency40__.ControllerMixin;

    var RSVP = __dependency41__["default"];
        // just for side effect of extending Ember.RSVP
      // just for side effect of extending String.prototype
    // just for side effect of extending Function.prototype
    // END IMPORTS


    // BEGIN EXPORTS
    Ember.compare = compare;
    Ember.copy = copy;
    Ember.isEqual = isEqual;
    Ember.keys = keys;

    Ember.Array = EmberArray;

    Ember.Comparable = Comparable;
    Ember.Copyable = Copyable;

    Ember.SortableMixin = SortableMixin;

    Ember.Freezable = Freezable;
    Ember.FROZEN_ERROR = FROZEN_ERROR;

    Ember.DeferredMixin = DeferredMixin;

    Ember.MutableEnumerable = MutableEnumerable;
    Ember.MutableArray = MutableArray;

    Ember.TargetActionSupport = TargetActionSupport;
    Ember.Evented = Evented;

    Ember.PromiseProxyMixin = PromiseProxyMixin;

    Ember.Observable = Observable;

    Ember.arrayComputed = arrayComputed;
    Ember.ArrayComputedProperty = ArrayComputedProperty;
    Ember.reduceComputed = reduceComputed;
    Ember.ReduceComputedProperty = ReduceComputedProperty;

    // ES6TODO: this seems a less than ideal way/place to add properties to Ember.computed
    var EmComputed = Ember.computed;

    EmComputed.sum = sum;
    EmComputed.min = min;
    EmComputed.max = max;
    EmComputed.map = map;
    EmComputed.sort = sort;
    EmComputed.setDiff = setDiff;
    EmComputed.mapBy = mapBy;
    EmComputed.mapProperty = mapProperty;
    EmComputed.filter = filter;
    EmComputed.filterBy = filterBy;
    EmComputed.filterProperty = filterProperty;
    EmComputed.uniq = uniq;
    EmComputed.union = union;
    EmComputed.intersect = intersect;

    Ember.String = EmberStringUtils;
    Ember.Object = EmberObject;
    Ember.TrackedArray = TrackedArray;
    Ember.SubArray = SubArray;
    Ember.Container = Container;
    Ember.Namespace = Namespace;
    Ember.Application = Application;
    Ember.Enumerable = Enumerable;
    Ember.ArrayProxy = ArrayProxy;
    Ember.ObjectProxy = ObjectProxy;
    Ember.ActionHandler = ActionHandler;
    Ember.CoreObject = CoreObject;
    Ember.EachArray = EachArray;
    Ember.EachProxy = EachProxy;
    Ember.NativeArray = NativeArray;
    // ES6TODO: Currently we must rely on the global from ember-metal/core to avoid circular deps
    // Ember.A = A;
    Ember.Set = Set;
    Ember.Deferred = Deferred;
    Ember.onLoad = onLoad;
    Ember.runLoadHooks = runLoadHooks;

    Ember.ArrayController = ArrayController;
    Ember.ObjectController = ObjectController;
    Ember.Controller = Controller;
    Ember.ControllerMixin = ControllerMixin;

    Ember.RSVP = RSVP;
    // END EXPORTS

    __exports__["default"] = Ember;
  });