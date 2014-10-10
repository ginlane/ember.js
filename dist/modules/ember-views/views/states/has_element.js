define("ember-views/views/states/has_element",
  ["ember-views/views/states/default","ember-metal/run_loop","ember-metal/merge","ember-metal/platform","ember-views/system/jquery","ember-metal/error","ember-metal/property_get","ember-metal/property_set","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var _default = __dependency1__["default"];
    var run = __dependency2__["default"];
    var merge = __dependency3__["default"];
    var create = __dependency4__.create;
    var jQuery = __dependency5__["default"];
    var EmberError = __dependency6__["default"];

    /**
    @module ember
    @submodule ember-views
    */

    var get = __dependency7__.get;
    var set = __dependency8__.set;

    var hasElement = create(_default);

    merge(hasElement, {
      $: function(view, sel) {
        var elem = get(view, 'element');
        return sel ? jQuery(sel, elem) : jQuery(elem);
      },

      getElement: function(view) {
        var parent = get(view, 'parentView');
        if (parent) { parent = get(parent, 'element'); }
        if (parent) { return view.findElementInParentElement(parent); }
        return jQuery("#" + get(view, 'elementId'))[0];
      },

      setElement: function(view, value) {
        if (value === null) {
          view.transitionTo('preRender');
        } else {
          throw new EmberError("You cannot set an element to a non-null value when the element is already in the DOM.");
        }

        return value;
      },

      // once the view has been inserted into the DOM, rerendering is
      // deferred to allow bindings to synchronize.
      rerender: function(view) {
        view.triggerRecursively('willClearRender');

        view.clearRenderedChildren();

        view.domManager.replace(view);
        return view;
      },

      // once the view is already in the DOM, destroying it removes it
      // from the DOM, nukes its element, and puts it back into the
      // preRender state if inDOM.

      destroyElement: function(view) {
        view._notifyWillDestroyElement();
        view.domManager.remove(view);
        set(view, 'element', null);
        if (view._scheduledInsert) {
          run.cancel(view._scheduledInsert);
          view._scheduledInsert = null;
        }
        return view;
      },

      empty: function(view) {
        var _childViews = view._childViews, len, idx;
        if (_childViews) {
          len = _childViews.length;
          for (idx = 0; idx < len; idx++) {
            _childViews[idx]._notifyWillDestroyElement();
          }
        }
        view.domManager.empty(view);
      },

      // Handle events from `Ember.EventDispatcher`
      handleEvent: function(view, eventName, evt) {
        if (view.has(eventName)) {
          // Handler should be able to re-dispatch events, so we don't
          // preventDefault or stopPropagation.
          return view.trigger(eventName, evt);
        } else {
          return true; // continue event propagation
        }
      },

      invokeObserver: function(target, observer) {
        observer.call(target);
      }
    });

    __exports__["default"] = hasElement;
  });