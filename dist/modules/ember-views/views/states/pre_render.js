define("ember-views/views/states/pre_render",
  ["ember-views/views/states/default","ember-metal/platform","ember-metal/merge","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var _default = __dependency1__["default"];
    var create = __dependency2__.create;
    var merge = __dependency3__["default"];

    /**
    @module ember
    @submodule ember-views
    */
    var preRender = create(_default);

    merge(preRender, {
      // a view leaves the preRender state once its element has been
      // created (createElement).
      insertElement: function(view, fn) {
        view.createElement();
        var viewCollection = view.viewHierarchyCollection();

        viewCollection.trigger('willInsertElement');

        fn.call(view);

        // We transition to `inDOM` if the element exists in the DOM
        var element = view.get('element');
        if (document.body.contains(element)) {
          viewCollection.transitionTo('inDOM', false);
          viewCollection.trigger('didInsertElement');
        }
      },

      renderToBufferIfNeeded: function(view, buffer) {
        view.renderToBuffer(buffer);
        return true;
      },

      empty: Ember.K,

      setElement: function(view, value) {
        if (value !== null) {
          view.transitionTo('hasElement');
        }
        return value;
      }
    });

    __exports__["default"] = preRender;
  });