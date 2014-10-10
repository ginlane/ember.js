define("ember-handlebars/helpers/debug",
  ["ember-metal/core","ember-metal/utils","ember-metal/logger","ember-metal/property_get","ember-handlebars/ext","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    /*jshint debug:true*/

    /**
    @module ember
    @submodule ember-handlebars
    */
    var Ember = __dependency1__["default"];
    // Ember.FEATURES,
    var inspect = __dependency2__.inspect;
    var Logger = __dependency3__["default"];

    var get = __dependency4__.get;
    var normalizePath = __dependency5__.normalizePath;
    var handlebarsGet = __dependency5__.handlebarsGet;

    var a_slice = [].slice;

    /**
      `log` allows you to output the value of variables in the current rendering
      context. `log` also accepts primitive types such as strings or numbers.

      ```handlebars
      {{log "myVariable:" myVariable }}
      ```

      @method log
      @for Ember.Handlebars.helpers
      @param {String} property
    */
    function logHelper() {
      var params = a_slice.call(arguments, 0, -1),
          options = arguments[arguments.length - 1],
          logger = Logger.log,
          values = [],
          allowPrimitives = true;

      for (var i = 0; i < params.length; i++) {
        var type = options.types[i];

        if (type === 'ID' || !allowPrimitives) {
          var context = (options.contexts && options.contexts[i]) || this,
              normalized = normalizePath(context, params[i], options.data);

          if (normalized.path === 'this') {
            values.push(normalized.root);
          } else {
            values.push(handlebarsGet(normalized.root, normalized.path, options));
          }
        } else {
          values.push(params[i]);
        }
      }

      logger.apply(logger, values);
    };

    /**
      Execute the `debugger` statement in the current context.

      ```handlebars
      {{debugger}}
      ```

      Before invoking the `debugger` statement, there
      are a few helpful variables defined in the
      body of this helper that you can inspect while
      debugging that describe how and where this
      helper was invoked:

      - templateContext: this is most likely a controller
        from which this template looks up / displays properties
      - typeOfTemplateContext: a string description of
        what the templateContext is

      For example, if you're wondering why a value `{{foo}}`
      isn't rendering as expected within a template, you
      could place a `{{debugger}}` statement, and when
      the `debugger;` breakpoint is hit, you can inspect
      `templateContext`, determine if it's the object you
      expect, and/or evaluate expressions in the console
      to perform property lookups on the `templateContext`:

      ```
        > templateContext.get('foo') // -> "<value of {{foo}}>"
      ```

      @method debugger
      @for Ember.Handlebars.helpers
      @param {String} property
    */
    function debuggerHelper(options) {

      // These are helpful values you can inspect while debugging.
      var templateContext = this;
      var typeOfTemplateContext = inspect(templateContext);

      debugger;
    }

    __exports__.logHelper = logHelper;
    __exports__.debuggerHelper = debuggerHelper;
  });