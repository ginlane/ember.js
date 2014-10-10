define("ember-handlebars/tests/helpers/custom_view_helper_test",
  ["ember-views/views/view","ember-metal/run_loop","ember-runtime/system/object","ember-runtime/system/namespace","ember-handlebars-compiler","ember-metal/property_get","ember-metal/property_set"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__) {
    "use strict";
    /*globals TemplateTests*/
    var EmberView = __dependency1__.View;
    var run = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var Namespace = __dependency4__["default"];
    var EmberHandlebars = __dependency5__["default"];

    var get = __dependency6__.get;
    var set = __dependency7__.set;

    var appendView = function() {
      run(function() { view.appendTo('#qunit-fixture'); });
    };

    var view;


    module("Handlebars custom view helpers", {
      setup: function() {
        window.TemplateTests = Namespace.create();
      },
      teardown: function() {
        run(function() {
          if (view) {
            view.destroy();
          }
        });
        window.TemplateTests = undefined;
      }
    });

    test("should render an instance of the specified view", function() {
      TemplateTests.OceanView = EmberView.extend({
        template: EmberHandlebars.compile('zomg, nice view')
      });

      EmberHandlebars.helper('oceanView', TemplateTests.OceanView);

      view = EmberView.create({
        controller: EmberObject.create(),
        template: EmberHandlebars.compile('{{oceanView tagName="strong"}}')
      });

      appendView();

      var oceanViews = view.$().find("strong:contains('zomg, nice view')");

      equal(oceanViews.length, 1, "helper rendered an instance of the view");
    });

    test("Should bind to this keyword", function() {
      TemplateTests.OceanView = EmberView.extend({
        model: null,
        template: EmberHandlebars.compile('{{view.model}}')
      });

      EmberHandlebars.helper('oceanView', TemplateTests.OceanView);

      view = EmberView.create({
        context: 'foo',
        controller: EmberObject.create(),
        template: EmberHandlebars.compile('{{oceanView tagName="strong" viewName="ocean" model=this}}')
      });

      appendView();

      var oceanViews = view.$().find("strong:contains('foo')");

      equal(oceanViews.length, 1, "helper rendered an instance of the view");

      run(function() {
        set(view, 'ocean.model', 'bar');
      });

      oceanViews = view.$().find("strong:contains('bar')");

      equal(oceanViews.length, 1, "helper rendered an instance of the view");
    });
  });