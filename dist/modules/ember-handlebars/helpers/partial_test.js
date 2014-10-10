define("ember-handlebars/tests/helpers/partial_test",
  ["ember-runtime/system/object","ember-metal/run_loop","ember-views/views/view","ember-views/system/jquery","ember-runtime/system/container","ember-handlebars-compiler"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var EmberObject = __dependency1__["default"];
    var run = __dependency2__["default"];
    var EmberView = __dependency3__.View;
    var jQuery = __dependency4__["default"];
    var trim = jQuery.trim;
    var Container = __dependency5__["default"];
    var EmberHandlebars = __dependency6__["default"];
    var compile = EmberHandlebars.compile;

    var MyApp;
    var originalLookup = Ember.lookup, lookup, TemplateTests, view, container;

    module("Support for {{partial}} helper", {
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

    test("should render other templates registered with the container", function() {
      container.register('template:_subTemplateFromContainer', EmberHandlebars.compile('sub-template'));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('This {{partial "subTemplateFromContainer"}} is pretty great.')
      });

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "This sub-template is pretty great.");
    });

    test("should render other slash-separated templates registered with the container", function() {
      container.register('template:child/_subTemplateFromContainer', EmberHandlebars.compile("sub-template"));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('This {{partial "child/subTemplateFromContainer"}} is pretty great.')
      });

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "This sub-template is pretty great.");
    });

    test("should use the current view's context", function() {
      container.register('template:_person_name', EmberHandlebars.compile("{{firstName}} {{lastName}}"));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('Who is {{partial "person_name"}}?')
      });
      view.set('controller', EmberObject.create({
        firstName: 'Kris',
        lastName: 'Selden'
      }));

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "Who is Kris Selden?");
    });

    test("Quoteless parameters passed to {{template}} perform a bound property lookup of the partial name", function() {
      container.register('template:_subTemplate', EmberHandlebars.compile("sub-template"));
      container.register('template:_otherTemplate', EmberHandlebars.compile("other-template"));

      view = EmberView.create({
        container: container,
        template: EmberHandlebars.compile('This {{partial view.partialName}} is pretty {{partial nonexistent}}great.'),
        partialName: 'subTemplate'
      });

      run(function() {
        view.appendTo('#qunit-fixture');
      });

      equal(trim(view.$().text()), "This sub-template is pretty great.");

      run(function() {
        view.set('partialName', 'otherTemplate');
      });

      equal(trim(view.$().text()), "This other-template is pretty great.");

      run(function() {
        view.set('partialName', null);
      });

      equal(trim(view.$().text()), "This  is pretty great.");
    });
  });