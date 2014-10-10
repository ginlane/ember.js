define("ember-views/views/states/in_dom",
  ["ember-metal/core","ember-metal/platform","ember-metal/merge","ember-metal/error","ember-views/views/states/has_element","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.assert
    var create = __dependency2__.create;
    var merge = __dependency3__["default"];
    var EmberError = __dependency4__["default"];

    var hasElement = __dependency5__["default"];
    /**
    @module ember
    @submodule ember-views
    */

    var inDOM = create(hasElement);

    var View;

    merge(inDOM, {
      enter: function(view) {
        if (!View) { View = requireModule('ember-views/views/view')["View"]; } // ES6TODO: this sucks. Have to avoid cycles...

        // Register the view for event handling. This hash is used by
        // Ember.EventDispatcher to dispatch incoming events.
        if (!view.isVirtual) {
          Ember.assert("Attempted to register a view with an id already in use: "+view.elementId, !View.views[view.elementId]);
          View.views[view.elementId] = view;
        }

        view.addBeforeObserver('elementId', function() {
          throw new EmberError("Changing a view's elementId after creation is not allowed");
        });
      },

      exit: function(view) {
        if (!View) { View = requireModule('ember-views/views/view')["View"]; } // ES6TODO: this sucks. Have to avoid cycles...

        if (!this.isVirtual) delete View.views[view.elementId];
      },

      insertElement: function(view, fn) {
        throw new EmberError("You can't insert an element into the DOM that has already been inserted");
      }
    });

    __exports__["default"] = inDOM;
  });