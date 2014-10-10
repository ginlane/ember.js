define("ember-application/tests/system/reset_test",
  ["ember-metal/run_loop","ember-metal/property_get","ember-metal/property_set","ember-application/system/application","ember-runtime/system/object","ember-routing/system/router","ember-views/views/view","ember-runtime/controllers/controller","ember-views/system/event_dispatcher","ember-views/system/jquery","container/container"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__) {
    "use strict";
    var run = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var Application = __dependency4__["default"];
    var EmberObject = __dependency5__["default"];
    var Router = __dependency6__["default"];
    var View = __dependency7__.View;
    var Controller = __dependency8__.Controller;
    var EventDispatcher = __dependency9__["default"];
    var jQuery = __dependency10__["default"];
    var Container = __dependency11__["default"];

    var application, EmberApplication = Application;

    module("Ember.Application - resetting", {
      setup: function() {
        Application = EmberApplication.extend({
          name: "App",
          rootElement: "#qunit-fixture"
        });
      },
      teardown: function() {
        Application = null;
        if (application) {
          run(application, 'destroy');
        }
      }
    });

    test("Brings it's own run-loop if not provided", function() {
      application = run(Application, 'create');

      application.reset();

      run(application,'then', function() {
        ok(true, 'app booted');
      });
    });

    test("does not bring it's own run loop if one is already provided", function() {
      expect(3);

      var didBecomeReady = false;

      application = run(Application, 'create');

      run(function() {

        application.ready = function() {
          didBecomeReady = true;
        };

        application.reset();

        application.deferReadiness();
        ok(!didBecomeReady, 'app is not ready');
      });

      ok(!didBecomeReady, 'app is not ready');
      run(application, 'advanceReadiness');
      ok(didBecomeReady, 'app is ready');
    });

    test("When an application is reset, new instances of controllers are generated", function() {
      run(function() {
        application = Application.create();
        application.AcademicController = Controller.extend();
      });

      var firstController = application.__container__.lookup('controller:academic');
      var secondController = application.__container__.lookup('controller:academic');

      application.reset();

      var thirdController = application.__container__.lookup('controller:academic');

      strictEqual(firstController, secondController, "controllers looked up in succession should be the same instance");

      ok(firstController.isDestroying, 'controllers are destroyed when their application is reset');

      notStrictEqual(firstController, thirdController, "controllers looked up after the application is reset should not be the same instance");
    });

    test("When an application is reset, the eventDispatcher is destroyed and recreated", function() {
      var eventDispatcherWasSetup, eventDispatcherWasDestroyed;

      eventDispatcherWasSetup = 0;
      eventDispatcherWasDestroyed = 0;

      var mock_event_dispatcher = {
        create: function() {
          return {
            setup: function() {
              eventDispatcherWasSetup++;
            },
            destroy: function() {
              eventDispatcherWasDestroyed++;
            }
          };
        }
      };

      // this is pretty awful. We should make this less Global-ly.
      var originalRegister = Container.prototype.register;
      Container.prototype.register = function(name, type, options){
        if (name === "event_dispatcher:main") {
          return mock_event_dispatcher;
        } else {
          return originalRegister.call(this, name, type, options);
        }
      };

      try {
        run(function() {
          application = Application.create();

          equal(eventDispatcherWasSetup, 0);
          equal(eventDispatcherWasDestroyed, 0);
        });

        equal(eventDispatcherWasSetup, 1);
        equal(eventDispatcherWasDestroyed, 0);

        application.reset();

        equal(eventDispatcherWasDestroyed, 1);
        equal(eventDispatcherWasSetup, 2, "setup called after reset");
      } catch (error) { Container.prototype.register = originalRegister; }

      Container.prototype.register = originalRegister;
    });

    test("When an application is reset, the ApplicationView is torn down", function() {
      run(function() {
        application = Application.create();
        application.ApplicationView = View.extend({
          elementId: "application-view"
        });
      });

      equal(jQuery('#qunit-fixture #application-view').length, 1, "precond - the application view is rendered");

      var originalView = View.views['application-view'];

      application.reset();

      var resettedView = View.views['application-view'];

      equal(jQuery('#qunit-fixture #application-view').length, 1, "the application view is rendered");

      notStrictEqual(originalView, resettedView, "The view object has changed");
    });

    test("When an application is reset, the router URL is reset to `/`", function() {
      var location, router;

      run(function() {
        application = Application.create();
        application.Router = Router.extend({
          location: 'none'
        });

        application.Router.map(function() {
          this.route('one');
          this.route('two');
        });
      });

      router = application.__container__.lookup('router:main');

      location = router.get('location');

      run(function() {
        location.handleURL('/one');
      });

      application.reset();

      var applicationController = application.__container__.lookup('controller:application');
      router = application.__container__.lookup('router:main');
      location = router.get('location');

      equal(location.getURL(), '');

      equal(get(applicationController, 'currentPath'), "index");

      location = application.__container__.lookup('router:main').get('location');
      run(function() {
        location.handleURL('/one');
      });

      equal(get(applicationController, 'currentPath'), "one");
    });

    test("When an application with advance/deferReadiness is reset, the app does correctly become ready after reset", function() {
      var location, router, readyCallCount;

      readyCallCount = 0;

      run(function() {
        application = Application.create({
          ready: function() {
            readyCallCount++;
          }
        });

        application.deferReadiness();
        equal(readyCallCount, 0, 'ready has not yet been called');
      });

      run(function() {
        application.advanceReadiness();
      });

      equal(readyCallCount, 1, 'ready was called once');

      application.reset();

      equal(readyCallCount, 2, 'ready was called twice');
    });

    test("With ember-data like initializer and constant", function() {
      var location, router, readyCallCount;

      readyCallCount = 0;

      var DS = {
        Store: EmberObject.extend({
          init: function() {
             if (!get(DS, 'defaultStore')) {
              set(DS, 'defaultStore', this);
             }

             this._super();
          },
          willDestroy: function() {
            if (get(DS, 'defaultStore') === this) {
              set(DS, 'defaultStore', null);
            }
          }
        })
      };

      Application.initializer({
        name: "store",
        initialize: function(container, application) {
          application.register('store:main', application.Store);

          container.lookup('store:main');
        }
      });

      run(function() {
        application = Application.create();
        application.Store = DS.Store;
      });

      ok(DS.defaultStore, 'has defaultStore');

      application.reset();

      ok(DS.defaultStore, 'still has defaultStore');
      ok(application.__container__.lookup("store:main"), 'store is still present');
    });

    test("Ensure that the hashchange event listener is removed", function(){
      var listeners;

      jQuery(window).off('hashchange'); // ensure that any previous listeners are cleared

      run(function() {
        application = Application.create();
      });

      listeners = jQuery._data(jQuery(window)[0], 'events');
      equal(listeners['hashchange'].length, 1, 'hashchange event listener was setup');

      application.reset();

      listeners = jQuery._data(jQuery(window)[0], 'events');
      equal(listeners['hashchange'].length, 1, 'hashchange event only exists once');
    });
  });