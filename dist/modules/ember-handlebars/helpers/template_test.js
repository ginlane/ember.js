define("ember-handlebars/tests/helpers/template_test",
  ["ember-metal/run_loop","ember-views/views/view","ember-runtime/system/object","ember-views/system/jquery","ember-runtime/system/container","ember-handlebars-compiler"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var run = __dependency1__["default"];
    var EmberView = __dependency2__.View;
    var EmberObject = __dependency3__["default"];
    var jQuery = __dependency4__["default"];
    var trim = jQuery.trim;

    var Container = __dependency5__["default"];
    var EmberHandlebars = __dependency6__["default"];

    var MyApp;
    var originalLookup = Ember.lookup, lookup, TemplateTests, view, container;

    module("Support for {{template}} helper", {
      setup: function() {
        Ember.lookup = lookup = { Ember: Ember };
        MyApp = lookup.MyApp = EmberObject.create({});
        container = new Container();
        container.optionsForType('template', { instantiate: false });
      },
      teardown: function() {
        run(function() {
          if (view) {
            view.destroy();
          }
        });
        Ember.lookup = originalLookup;
      }
    });

    test("should render other templates via the container (DEPRECATED)", function() {
      container.register('template:sub_template_from_container', EmberHandlebars.compile('sub-template'));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('This {{template "sub_template_from_container"}} is pretty great.')
      });

      expectDeprecation(/The `template` helper has been deprecated in favor of the `partial` helper./);

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "This sub-template is pretty great.");
    });

    test("should use the current view's context (DEPRECATED)", function() {
      container.register('template:person_name', EmberHandlebars.compile("{{firstName}} {{lastName}}"));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('Who is {{template "person_name"}}?')
      });
      view.set('controller', EmberObject.create({
        firstName: 'Kris',
        lastName: 'Selden'
      }));

      expectDeprecation(/The `template` helper has been deprecated in favor of the `partial` helper./);

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "Who is Kris Selden?");
    });
  });