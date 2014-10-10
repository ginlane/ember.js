define("ember-testing/tests/integration_test",
  ["ember-metal/core","ember-metal/run_loop","ember-runtime/system/object","ember-runtime/controllers/array_controller","ember-views/system/jquery","ember-views/views/view","ember-testing/test","ember-routing/system/route","ember-application/system/application","ember-handlebars","ember-application"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var ArrayController = __dependency4__["default"];
    var jQuery = __dependency5__["default"];
    var EmberView = __dependency6__.View;
    var Test = __dependency7__["default"];
    var EmberRoute = __dependency8__["default"];
    var EmberApplication = __dependency9__["default"];
    var EmberHandlebars = __dependency10__["default"];


    var App, find, visit, originalAdapter = Test.adapter;

    module("ember-testing Integration", {
      setup: function() {
        jQuery('<div id="ember-testing-container"><div id="ember-testing"></div></div>').appendTo('body');
        run(function() {
          App = EmberApplication.create({
            rootElement: '#ember-testing'
          });

          App.Router.map(function() {
            this.resource("people", { path: "/" });
          });

          App.PeopleRoute = EmberRoute.extend({
            model: function() {
              return App.Person.find();
            }
          });

          App.PeopleView = EmberView.extend({
            defaultTemplate: EmberHandlebars.compile("{{#each person in controller}}<div class=\"name\">{{person.firstName}}</div>{{/each}}")
          });

          App.PeopleController = ArrayController.extend({});

          App.Person = EmberObject.extend({
            firstName: ''
          });

          App.Person.reopenClass({
            find: function() {
              return Ember.A();
            }
          });

          App.ApplicationView = EmberView.extend({
            defaultTemplate: EmberHandlebars.compile("{{outlet}}")
          });

          App.setupForTesting();
        });

        run(function() {
          App.reset();
        });

        App.injectTestHelpers();

        find = window.find;
        visit = window.visit;
      },

      teardown: function() {
        App.removeTestHelpers();
        jQuery('#ember-testing-container, #ember-testing').remove();
        run(App, App.destroy);
        App = null;
        Test.adapter = originalAdapter;
      }
    });

    test("template is bound to empty array of people", function() {
      App.Person.find = function() {
        return Ember.A();
      };
      run(App, 'advanceReadiness');
      visit("/").then(function() {
        var rows = find(".name").length;
        equal(rows, 0, "successfully stubbed an empty array of people");
      });
    });

    test("template is bound to array of 2 people", function() {
      App.Person.find = function() {
        var people = Ember.A();
        var first = App.Person.create({firstName: "x"});
        var last = App.Person.create({firstName: "y"});
        run(people, people.pushObject, first);
        run(people, people.pushObject, last);
        return people;
      };
      run(App, 'advanceReadiness');
      visit("/").then(function() {
        var rows = find(".name").length;
        equal(rows, 2, "successfully stubbed a non empty array of people");
      });
    });

    test("template is again bound to empty array of people", function() {
      App.Person.find = function() {
        return Ember.A();
      };
      run(App, 'advanceReadiness');
      visit("/").then(function() {
        var rows = find(".name").length;
        equal(rows, 0, "successfully stubbed another empty array of people");
      });
    });

    test("`visit` can be called without advancedReadiness.", function(){
      App.Person.find = function() {
        return Ember.A();
      };

      visit("/").then(function() {
        var rows = find(".name").length;
        equal(rows, 0, "stubbed an empty array of people without calling advancedReadiness.");
      });
    });
  });