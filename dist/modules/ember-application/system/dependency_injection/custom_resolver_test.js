define("ember-application/tests/system/dependency_injection/custom_resolver_test",
  ["ember-views/system/jquery","ember-metal/run_loop","ember-application/system/application","ember-application/system/resolver"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var jQuery = __dependency1__["default"];
    var run = __dependency2__["default"];
    var Application = __dependency3__["default"];
    var DefaultResolver = __dependency4__.DefaultResolver;

    var application;

    module("Ember.Application Depedency Injection – customResolver",{
      setup: function() {
        function fallbackTemplate() { return "<h1>Fallback</h1>"; }

        var Resolver = DefaultResolver.extend({
          resolveTemplate: function(resolvable) {
            var resolvedTemplate = this._super(resolvable);
            if (resolvedTemplate) { return resolvedTemplate; }
            return fallbackTemplate;
          }
        });

        application = run(function() {
          return Application.create({
            Resolver: Resolver,
            rootElement: '#qunit-fixture'

          });
        });
      },
      teardown: function() {
        run(application, 'destroy');
      }
    });

    test("a resolver can be supplied to application", function() {
      equal(jQuery("h1", application.rootElement).text(), "Fallback");
    });
  });