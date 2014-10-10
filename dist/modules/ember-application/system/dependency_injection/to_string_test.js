define("ember-application/tests/system/dependency_injection/to_string_test",
  ["ember-metal/core","ember-metal/run_loop","ember-application/system/application","ember-runtime/system/object","ember-application/system/resolver","ember-metal/utils"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // lookup, etc
    var run = __dependency2__["default"];
    var Application = __dependency3__["default"];
    var EmberObject = __dependency4__["default"];
    var DefaultResolver = __dependency5__.DefaultResolver;
    var guidFor = __dependency6__.guidFor;

    var originalLookup, App, originalModelInjections;

    module("Ember.Application Dependency Injection – toString",{
      setup: function() {
        originalModelInjections = Ember.MODEL_FACTORY_INJECTIONS;
        Ember.MODEL_FACTORY_INJECTIONS = true;

        originalLookup = Ember.lookup;

        run(function(){
          App = Application.create();
          Ember.lookup = {
            App: App
          };
        });

        App.Post = EmberObject.extend();

      },

      teardown: function() {
        Ember.lookup = originalLookup;
        run(App, 'destroy');
        Ember.MODEL_FACTORY_INJECTIONS = originalModelInjections;
      }
    });

    test("factories", function() {
      var PostFactory = App.__container__.lookupFactory('model:post');
      equal(PostFactory.toString(), 'App.Post', 'expecting the model to be post');
    });

    test("instances", function() {
      var post = App.__container__.lookup('model:post');
      var guid = guidFor(post);

      equal(post.toString(), '<App.Post:' + guid + '>', 'expecting the model to be post');
    });

    test("with a custom resolver", function() {
      run(App,'destroy');

      run(function(){
        App = Application.create({
          Resolver: DefaultResolver.extend({
            makeToString: function(factory, fullName) {
              return fullName;
            }
          })
        });
      });

      App.__container__.register('model:peter', EmberObject.extend());

      var peter = App.__container__.lookup('model:peter');
      var guid = guidFor(peter);

      equal(peter.toString(), '<model:peter:' + guid + '>', 'expecting the supermodel to be peter');
    });
  });