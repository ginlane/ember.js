define("ember-routing/tests/system/controller_for_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","container/container","ember-runtime/system/namespace","ember-runtime/system/string","ember-runtime/controllers/controller","ember-runtime/controllers/object_controller","ember-runtime/controllers/array_controller","ember-routing/system/controller_for"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // A
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];

    var Container = __dependency5__["default"];
    var Namespace = __dependency6__["default"];
    var classify = __dependency7__.classify;
    var Controller = __dependency8__.Controller;
    var ObjectController = __dependency9__["default"];
    var ArrayController = __dependency10__["default"];
    var controllerFor = __dependency11__.controllerFor;
    var generateController = __dependency11__.generateController;

    var buildContainer = function(namespace) {
      var container = new Container();

      container.set = set;
      container.resolver = resolverFor(namespace);
      container.optionsForType('view', { singleton: false });

      container.register('application:main', namespace, { instantiate: false });

      container.register('controller:basic', Controller, { instantiate: false });
      container.register('controller:object', ObjectController, { instantiate: false });
      container.register('controller:array', ArrayController, { instantiate: false });

      return container;
    };

    function resolverFor(namespace) {
      return function(fullName) {
        var nameParts = fullName.split(":"),
            type = nameParts[0], name = nameParts[1];

        if (name === 'basic') {
          name = '';
        }
        var className = classify(name) + classify(type);
        var factory = get(namespace, className);



        if (factory) { return factory; }
      };
    }

    var container, appController, namespace;

    module("Ember.controllerFor", {
      setup: function() {
        namespace = Namespace.create();
        container = buildContainer(namespace);
        container.register('controller:app', Controller.extend());
        appController = container.lookup('controller:app');
      },
      teardown: function() {
        run(function () {
          container.destroy();
          namespace.destroy();
        });
      }
    });

    test("controllerFor should lookup for registered controllers", function() {
      var controller = controllerFor(container, 'app');

      equal(appController, controller, 'should find app controller');
    });

    module("Ember.generateController", {
      setup: function() {
        namespace = Namespace.create();
        container = buildContainer(namespace);
      },
      teardown: function() {
        run(function () {
          container.destroy();
          namespace.destroy();
        });
      }
    });

    test("generateController should create Ember.Controller", function() {
      var controller = generateController(container, 'home');

      ok(controller instanceof Controller, 'should create controller');
    });

    test("generateController should create Ember.ObjectController", function() {
      var context = {};
      var controller = generateController(container, 'home', context);

      ok(controller instanceof ObjectController, 'should create controller');
    });

    test("generateController should create Ember.ArrayController", function() {
      var context = Ember.A();
      var controller = generateController(container, 'home', context);

      ok(controller instanceof ArrayController, 'should create controller');
    });

    test("generateController should create App.Controller if provided", function() {
      var controller;
      namespace.Controller = Controller.extend();

      controller = generateController(container, 'home');

      ok(controller instanceof namespace.Controller, 'should create controller');
    });

    test("generateController should create App.ObjectController if provided", function() {
      var context = {}, controller;
      namespace.ObjectController = ObjectController.extend();

      controller = generateController(container, 'home', context);

      ok(controller instanceof namespace.ObjectController, 'should create controller');

    });

    test("generateController should create App.ArrayController if provided", function() {
      var context = Ember.A(), controller;
      namespace.ArrayController = ArrayController.extend();

      controller = generateController(container, 'home', context);

      ok(controller instanceof namespace.ArrayController, 'should create controller');

    });
  });