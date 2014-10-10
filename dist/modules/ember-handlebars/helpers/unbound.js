define("ember-handlebars/helpers/unbound",
  ["ember-handlebars-compiler","ember-handlebars/helpers/binding","ember-handlebars/ext","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    /*globals Handlebars */

    /**
    @module ember
    @submodule ember-handlebars
    */

    var EmberHandlebars = __dependency1__["default"];
    var helpers = EmberHandlebars.helpers;

    var resolveHelper = __dependency2__.resolveHelper;
    var handlebarsGet = __dependency3__.handlebarsGet;

    var slice = [].slice;

    /**
      `unbound` allows you to output a property without binding. *Important:* The
      output will not be updated if the property changes. Use with caution.

      ```handlebars
      <div>{{unbound somePropertyThatDoesntChange}}</div>
      ```

      `unbound` can also be used in conjunction with a bound helper to
      render it in its unbound form:

      ```handlebars
      <div>{{unbound helperName somePropertyThatDoesntChange}}</div>
      ```

      @method unbound
      @for Ember.Handlebars.helpers
      @param {String} property
      @return {String} HTML string
    */
    function unboundHelper(property, fn) {
      var options = arguments[arguments.length - 1],
          container = options.data.view.container,
          helper, context, out, ctx;

      ctx = this;
      if (arguments.length > 2) {
        // Unbound helper call.
        options.data.isUnbound = true;
        helper = resolveHelper(container, property) || helpers.helperMissing;
        out = helper.apply(ctx, slice.call(arguments, 1));
        delete options.data.isUnbound;
        return out;
      }

      context = (fn.contexts && fn.contexts.length) ? fn.contexts[0] : ctx;
      return handlebarsGet(context, property, fn);
    }

    __exports__["default"] = unboundHelper;
  });