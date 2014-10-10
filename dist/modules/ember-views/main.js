define("ember-views",
  ["ember-runtime","ember-views/system/jquery","ember-views/system/utils","ember-views/system/render_buffer","ember-views/system/ext","ember-views/views/states","ember-views/views/view","ember-views/views/container_view","ember-views/views/collection_view","ember-views/views/component","ember-views/system/event_dispatcher","ember-views/mixins/view_target_action_support","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __exports__) {
    "use strict";
    /**
    Ember Views

    @module ember
    @submodule ember-views
    @requires ember-runtime
    @main ember-views
    */

    // BEGIN IMPORTS
    var Ember = __dependency1__["default"];
    var jQuery = __dependency2__["default"];
    var setInnerHTML = __dependency3__.setInnerHTML;
    var isSimpleClick = __dependency3__.isSimpleClick;
    var RenderBuffer = __dependency4__["default"];
     // for the side effect of extending Ember.run.queues
    var cloneStates = __dependency6__.cloneStates;
    var states = __dependency6__.states;

    var CoreView = __dependency7__.CoreView;
    var View = __dependency7__.View;
    var ViewCollection = __dependency7__.ViewCollection;
    var ContainerView = __dependency8__["default"];
    var CollectionView = __dependency9__["default"];
    var Component = __dependency10__["default"];

    var EventDispatcher = __dependency11__["default"];
    var ViewTargetActionSupport = __dependency12__["default"];
    // END IMPORTS

    /**
      Alias for jQuery

      @method $
      @for Ember
    */

    // BEGIN EXPORTS
    Ember.$ = jQuery;

    Ember.ViewTargetActionSupport = ViewTargetActionSupport;
    Ember.RenderBuffer = RenderBuffer;

    var ViewUtils = Ember.ViewUtils = {};
    ViewUtils.setInnerHTML = setInnerHTML;
    ViewUtils.isSimpleClick = isSimpleClick;

    Ember.CoreView = CoreView;
    Ember.View = View;
    Ember.View.states = states;
    Ember.View.cloneStates = cloneStates;

    Ember._ViewCollection = ViewCollection;
    Ember.ContainerView = ContainerView;
    Ember.CollectionView = CollectionView;
    Ember.Component = Component;
    Ember.EventDispatcher = EventDispatcher;
    // END EXPORTS

    __exports__["default"] = Ember;
  });