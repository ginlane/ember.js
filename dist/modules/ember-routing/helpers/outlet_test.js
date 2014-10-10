define("ember-routing/tests/helpers/outlet_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","container/container","ember-runtime/system/namespace","ember-runtime/system/string","ember-runtime/controllers/controller","ember-runtime/controllers/object_controller","ember-runtime/controllers/array_controller","ember-routing/system/router","ember-routing/location/hash_location","ember-handlebars","ember-handlebars/views/metamorph_view","ember-routing/ext/view","ember-views/views/container_view","ember-views/system/jquery","ember-routing/helpers/outlet"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // TEMPLATES
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];

    var Container = __dependency5__["default"];
    var Namespace = __dependency6__["default"];
    var decamelize = __dependency7__.decamelize;
    var classify = __dependency7__.classify;
    var Controller = __dependency8__.Controller;
    var ObjectController = __dependency9__["default"];
    var ArrayController = __dependency10__["default"];

    var EmberRouter = __dependency11__["default"];
    var HashLocation = __dependency12__["default"];

    var EmberHandlebars = __dependency13__["default"];
    var _MetamorphView = __dependency14__._MetamorphView;
    var EmberView = __dependency15__["default"];
    var EmberContainerView = __dependency16__["default"];
    var jQuery = __dependency17__["default"];

    var outletHelper = __dependency18__.outletHelper;

    var buildContainer = function(namespace) {
      var container = new Container();

      container.set = set;
      container.resolver = resolverFor(namespace);
      container.optionsForType('view', { singleton: false });
      container.optionsForType('template', { instantiate: false });
      container.register('application:main', namespace, { instantiate: false });
      container.injection('router:main', 'namespace', 'application:main');

      container.register('location:hash', HashLocation);

      container.register('controller:basic', Controller, { instantiate: false });
      container.register('controller:object', ObjectController, { instantiate: false });
      container.register('controller:array', ArrayController, { instantiate: false });

      container.typeInjection('route', 'router', 'router:main');

      return container;
    };

    function resolverFor(namespace) {
      return function(fullName) {
        var nameParts = fullName.split(":"),
            type = nameParts[0], name = nameParts[1];

        if (type === 'template') {
          var templateName = decamelize(name);
          if (Ember.TEMPLATES[templateName]) {
            return Ember.TEMPLATES[templateName];
          }
        }

        var className = classify(name) + classify(type);
        var factory = get(namespace, className);

        if (factory) { return factory; }
      };
    }

    var appendView = function(view) {
      run(function() { view.appendTo('#qunit-fixture'); });
    };

    var compile = EmberHandlebars.compile;
    var trim = jQuery.trim;

    var view, container, originalOutletHelper;

    module("Handlebars {{outlet}} helpers", {

      setup: function() {
        originalOutletHelper = EmberHandlebars.helpers['outlet'];
        EmberHandlebars.registerHelper('outlet', outletHelper);

        var namespace = Namespace.create();
        container = buildContainer(namespace);
        container.register('view:default', EmberView.extend());
        container.register('router:main', EmberRouter.extend());
      },
      teardown: function() {
        delete EmberHandlebars.helpers['outlet'];
        EmberHandlebars.helpers['outlet'] = originalOutletHelper;

        run(function () {
          if (container) {
            container.destroy();
          }
          if (view) {
            view.destroy();
          }
        });
      }
    });

    test("view should support connectOutlet for the main outlet", function() {
      var template = "<h1>HI</h1>{{outlet}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template)
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      run(function() {
        view.connectOutlet('main', EmberView.create({
          template: compile("<p>BYE</p>")
        }));
      });

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');
    });

    test("outlet should support connectOutlet in slots in prerender state", function() {
      var template = "<h1>HI</h1>{{outlet}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template)
      });

      view.connectOutlet('main', EmberView.create({
        template: compile("<p>BYE</p>")
      }));

      appendView(view);

      equal(view.$().text(), 'HIBYE');
    });

    test("outlet should support an optional name", function() {
      var template = "<h1>HI</h1>{{outlet mainView}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template)
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      run(function() {
        view.connectOutlet('mainView', EmberView.create({
          template: compile("<p>BYE</p>")
        }));
      });

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');
    });


    test("outlet should correctly lookup a view", function() {

      var template,
          ContainerView,
          childView;

      ContainerView = EmberContainerView.extend();

      container.register("view:containerView", ContainerView);

      template = "<h1>HI</h1>{{outlet view='containerView'}}";

      view = EmberView.create({
        template: EmberHandlebars.compile(template),
        container : container
      });

      childView = EmberView.create({
        template: compile("<p>BYE</p>")
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      run(function() {
        view.connectOutlet('main', childView);
      });

      ok(ContainerView.detectInstance(childView.get('_parentView')), "The custom view class should be used for the outlet");

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');

    });

    test("outlet should assert view is specified as a string", function() {

      var template = "<h1>HI</h1>{{outlet view=containerView}}";

      expectAssertion(function () {

        view = EmberView.create({
          template: EmberHandlebars.compile(template),
          container : container
        });

        appendView(view);

      });

    });

    test("outlet should assert view path is successfully resolved", function() {

      var template = "<h1>HI</h1>{{outlet view='someViewNameHere'}}";

      expectAssertion(function () {

        view = EmberView.create({
          template: EmberHandlebars.compile(template),
          container : container
        });

        appendView(view);

      });

    });

    test("outlet should support an optional view class", function() {
      var template = "<h1>HI</h1>{{outlet viewClass=view.outletView}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template),
        outletView: EmberContainerView.extend()
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      var childView = EmberView.create({
        template: compile("<p>BYE</p>")
      });

      run(function() {
        view.connectOutlet('main', childView);
      });

      ok(view.outletView.detectInstance(childView.get('_parentView')), "The custom view class should be used for the outlet");

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');
    });


    test("Outlets bind to the current view, not the current concrete view", function() {
      var parentTemplate = "<h1>HI</h1>{{outlet}}";
      var middleTemplate = "<h2>MIDDLE</h2>{{outlet}}";
      var bottomTemplate = "<h3>BOTTOM</h3>";

      view = EmberView.create({
        template: compile(parentTemplate)
      });

      var middleView = _MetamorphView.create({
        template: compile(middleTemplate)
      });

      var bottomView = _MetamorphView.create({
        template: compile(bottomTemplate)
      });

      appendView(view);

      run(function() {
        view.connectOutlet('main', middleView);
      });

      run(function() {
        middleView.connectOutlet('main', bottomView);
      });

      var output = jQuery('#qunit-fixture h1 ~ h2 ~ h3').text();
      equal(output, "BOTTOM", "all templates were rendered");
    });

    test("view should support disconnectOutlet for the main outlet", function() {
      var template = "<h1>HI</h1>{{outlet}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template)
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      run(function() {
        view.connectOutlet('main', EmberView.create({
          template: compile("<p>BYE</p>")
        }));
      });

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');

      run(function() {
        view.disconnectOutlet('main');
      });

      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HI');
    });

    test("Outlets bind to the current template's view, not inner contexts", function() {
      var parentTemplate = "<h1>HI</h1>{{#if view.alwaysTrue}}{{#with this}}{{outlet}}{{/with}}{{/if}}";
      var bottomTemplate = "<h3>BOTTOM</h3>";

      view = EmberView.create({
        alwaysTrue: true,
        template: compile(parentTemplate)
      });

      var bottomView = _MetamorphView.create({
        template: compile(bottomTemplate)
      });

      appendView(view);

      run(function() {
        view.connectOutlet('main', bottomView);
      });

      var output = jQuery('#qunit-fixture h1 ~ h3').text();
      equal(output, "BOTTOM", "all templates were rendered");
    });

    test("should support layouts", function() {
      var template = "{{outlet}}",
          layout = "<h1>HI</h1>{{yield}}";
      view = EmberView.create({
        template: EmberHandlebars.compile(template),
        layout: EmberHandlebars.compile(layout)
      });

      appendView(view);

      equal(view.$().text(), 'HI');

      run(function() {
        view.connectOutlet('main', EmberView.create({
          template: compile("<p>BYE</p>")
        }));
      });
      // Replace whitespace for older IE
      equal(trim(view.$().text()), 'HIBYE');
    });
  });