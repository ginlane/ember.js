define("ember-routing/system/controller_for",
  ["ember-metal/core","ember-metal/property_get","ember-metal/utils","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Logger
    var get = __dependency2__.get;
    var isArray = __dependency3__.isArray;

    /**
    @module ember
    @submodule ember-routing
    */

    /**

      Finds a controller instance.

      @for Ember
      @method controllerFor
      @private
    */
    var controllerFor = function(container, controllerName, lookupOptions) {
      return container.lookup('controller:' + controllerName, lookupOptions);
    };

    /**
      Generates a controller factory

      The type of the generated controller factory is derived
      from the context. If the context is an array an array controller
      is generated, if an object, an object controller otherwise, a basic
      controller is generated.

      You can customize your generated controllers by defining
      `App.ObjectController` or `App.ArrayController`.

      @for Ember
      @method generateControllerFactory
      @private
    */
    var generateControllerFactory = function(container, controllerName, context) {
      var Factory, fullName, instance, name, factoryName, controllerType;

      if (context && isArray(context)) {
        controllerType = 'array';
      } else if (context) {
        controllerType = 'object';
      } else {
        controllerType = 'basic';
      }

      factoryName = 'controller:' + controllerType;

      Factory = container.lookupFactory(factoryName).extend({
        isGenerated: true,
        toString: function() {
          return "(generated " + controllerName + " controller)";
        }
      });

      fullName = 'controller:' + controllerName;

      container.register(fullName,  Factory);

      return Factory;
    };

    /**
      Generates and instantiates a controller.

      The type of the generated controller factory is derived
      from the context. If the context is an array an array controller
      is generated, if an object, an object controller otherwise, a basic
      controller is generated.

      @for Ember
      @method generateController
      @private
      @since 1.3.0
    */
    var generateController = function(container, controllerName, context) {
      generateControllerFactory(container, controllerName, context);
      var fullName = 'controller:' + controllerName;
      var instance = container.lookup(fullName);

      if (get(instance, 'namespace.LOG_ACTIVE_GENERATION')) {
        Ember.Logger.info("generated -> " + fullName, { fullName: fullName });
      }

      return instance;
    };

    __exports__.controllerFor = controllerFor;
    __exports__.generateControllerFactory = generateControllerFactory;
    __exports__.generateController = generateController;
  });