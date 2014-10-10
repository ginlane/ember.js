(function() {
define("ember-application/ext/controller",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/error","ember-metal/utils","ember-metal/computed","ember-runtime/controllers/controller","ember-routing/system/controller_for","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-application
    */

    var Ember = __dependency1__["default"];
    // Ember.assert
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var EmberError = __dependency4__["default"];
    var inspect = __dependency5__.inspect;
    var computed = __dependency6__.computed;
    var ControllerMixin = __dependency7__.ControllerMixin;
    var meta = __dependency5__.meta;
    var controllerFor = __dependency8__.controllerFor;
    var meta = __dependency5__.meta;

    function verifyNeedsDependencies(controller, container, needs) {
      var dependency, i, l, missing = [];

      for (i=0, l=needs.length; i<l; i++) {
        dependency = needs[i];

        Ember.assert(inspect(controller) + "#needs must not specify dependencies with periods in their names (" + dependency + ")", dependency.indexOf('.') === -1);

        if (dependency.indexOf(':') === -1) {
          dependency = "controller:" + dependency;
        }

        // Structure assert to still do verification but not string concat in production
        if (!container.has(dependency)) {
          missing.push(dependency);
        }
      }
      if (missing.length) {
        throw new EmberError(inspect(controller) + " needs [ " + missing.join(', ') + " ] but " + (missing.length > 1 ? 'they' : 'it') + " could not be found");
      }
    }

    var defaultControllersComputedProperty = computed(function() {
      var controller = this;

      return {
        needs: get(controller, 'needs'),
        container: get(controller, 'container'),
        unknownProperty: function(controllerName) {
          var needs = this.needs,
            dependency, i, l;
          for (i=0, l=needs.length; i<l; i++) {
            dependency = needs[i];
            if (dependency === controllerName) {
              return this.container.lookup('controller:' + controllerName);
            }
          }

          var errorMessage = inspect(controller) + '#needs does not include `' + controllerName + '`. To access the ' + controllerName + ' controller from ' + inspect(controller) + ', ' + inspect(controller) + ' should have a `needs` property that is an array of the controllers it has access to.';
          throw new ReferenceError(errorMessage);
        },
        setUnknownProperty: function (key, value) {
          throw new Error("You cannot overwrite the value of `controllers." + key + "` of " + inspect(controller));
        }
      };
    });

    /**
      @class ControllerMixin
      @namespace Ember
    */
    ControllerMixin.reopen({
      concatenatedProperties: ['needs'],

      /**
        An array of other controller objects available inside
        instances of this controller via the `controllers`
        property:

        For example, when you define a controller:

        ```javascript
        App.CommentsController = Ember.ArrayController.extend({
          needs: ['post']
        });
        ```

        The application's single instance of these other
        controllers are accessible by name through the
        `controllers` property:

        ```javascript
        this.get('controllers.post'); // instance of App.PostController
        ```

        Given that you have a nested controller (nested resource):

        ```javascript
        App.CommentsNewController = Ember.ObjectController.extend({
        });
        ```

        When you define a controller that requires access to a nested one:

        ```javascript
        App.IndexController = Ember.ObjectController.extend({
          needs: ['commentsNew']
        });
        ```

        You will be able to get access to it:

        ```javascript
        this.get('controllers.commentsNew'); // instance of App.CommentsNewController
        ```

        This is only available for singleton controllers.

        @property {Array} needs
        @default []
      */
      needs: [],

      init: function() {
        var needs = get(this, 'needs'),
        length = get(needs, 'length');

        if (length > 0) {
          Ember.assert(' `' + inspect(this) + ' specifies `needs`, but does ' +
                       "not have a container. Please ensure this controller was " +
                       "instantiated with a container.",
                       this.container || meta(this, false).descs.controllers !== defaultControllersComputedProperty);

          if (this.container) {
            verifyNeedsDependencies(this, this.container, needs);
          }

          // if needs then initialize controllers proxy
          get(this, 'controllers');
        }

        this._super.apply(this, arguments);
      },

      /**
        @method controllerFor
        @see {Ember.Route#controllerFor}
        @deprecated Use `needs` instead
      */
      controllerFor: function(controllerName) {
        Ember.deprecate("Controller#controllerFor is deprecated, please use Controller#needs instead");
        return controllerFor(get(this, 'container'), controllerName);
      },

      /**
        Stores the instances of other controllers available from within
        this controller. Any controller listed by name in the `needs`
        property will be accessible by name through this property.

        ```javascript
        App.CommentsController = Ember.ArrayController.extend({
          needs: ['post'],
          postTitle: function(){
            var currentPost = this.get('controllers.post'); // instance of App.PostController
            return currentPost.get('title');
          }.property('controllers.post.title')
        });
        ```

        @see {Ember.ControllerMixin#needs}
        @property {Object} controllers
        @default null
      */
      controllers: defaultControllersComputedProperty
    });

    __exports__["default"] = ControllerMixin;
  });
define("ember-application",
  ["ember-metal/core","ember-runtime/system/lazy_load","ember-application/system/dag","ember-application/system/resolver","ember-application/system/application","ember-application/ext/controller"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var runLoadHooks = __dependency2__.runLoadHooks;

    /**
    Ember Application

    @module ember
    @submodule ember-application
    @requires ember-views, ember-routing
    */

    var DAG = __dependency3__["default"];var Resolver = __dependency4__.Resolver;
    var DefaultResolver = __dependency4__.DefaultResolver;
    var Application = __dependency5__["default"];
    // side effect of extending ControllerMixin

    Ember.Application = Application;
    Ember.DAG = DAG;
    Ember.Resolver = Resolver;
    Ember.DefaultResolver = DefaultResolver;

    runLoadHooks('Ember.Application', Application);
  });
define("ember-application/system/application",
  ["ember-metal","ember-metal/property_get","ember-metal/property_set","ember-runtime/system/lazy_load","ember-application/system/dag","ember-runtime/system/namespace","ember-runtime/mixins/deferred","ember-application/system/resolver","ember-metal/platform","ember-metal/run_loop","ember-metal/utils","container/container","ember-runtime/controllers/controller","ember-metal/enumerable_utils","ember-runtime/controllers/object_controller","ember-runtime/controllers/array_controller","ember-views/system/event_dispatcher","ember-extension-support/container_debug_adapter","ember-views/system/jquery","ember-routing/system/route","ember-routing/system/router","ember-routing/location/hash_location","ember-routing/location/history_location","ember-routing/location/auto_location","ember-routing/location/none_location","ember-handlebars-compiler","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __dependency26__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-application
    */

    var Ember = __dependency1__["default"];
    // Ember.FEATURES, Ember.deprecate, Ember.assert, Ember.libraries, LOG_VERSION, Namespace, BOOTED
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var runLoadHooks = __dependency4__.runLoadHooks;
    var DAG = __dependency5__["default"];var Namespace = __dependency6__["default"];
    var DeferredMixin = __dependency7__["default"];
    var DefaultResolver = __dependency8__.DefaultResolver;
    var create = __dependency9__.create;
    var run = __dependency10__["default"];
    var canInvoke = __dependency11__.canInvoke;
    var Container = __dependency12__["default"];
    var Controller = __dependency13__.Controller;
    var EnumerableUtils = __dependency14__["default"];
    var ObjectController = __dependency15__["default"];
    var ArrayController = __dependency16__["default"];
    var EventDispatcher = __dependency17__["default"];
    var ContainerDebugAdapter = __dependency18__["default"];
    var jQuery = __dependency19__["default"];
    var Route = __dependency20__["default"];
    var Router = __dependency21__["default"];
    var HashLocation = __dependency22__["default"];
    var HistoryLocation = __dependency23__["default"];
    var AutoLocation = __dependency24__["default"];
    var NoneLocation = __dependency25__["default"];

    var EmberHandlebars = __dependency26__["default"];

    var K = Ember.K;

    function DeprecatedContainer(container) {
      this._container = container;
    }

    DeprecatedContainer.deprecate = function(method) {
      return function() {
        var container = this._container;

        Ember.deprecate('Using the defaultContainer is no longer supported. [defaultContainer#' + method + '] see: http://git.io/EKPpnA', false);
        return container[method].apply(container, arguments);
      };
    };

    DeprecatedContainer.prototype = {
      _container: null,
      lookup: DeprecatedContainer.deprecate('lookup'),
      resolve: DeprecatedContainer.deprecate('resolve'),
      register: DeprecatedContainer.deprecate('register')
    };

    /**
      An instance of `Ember.Application` is the starting point for every Ember
      application. It helps to instantiate, initialize and coordinate the many
      objects that make up your app.

      Each Ember app has one and only one `Ember.Application` object. In fact, the
      very first thing you should do in your application is create the instance:

      ```javascript
      window.App = Ember.Application.create();
      ```

      Typically, the application object is the only global variable. All other
      classes in your app should be properties on the `Ember.Application` instance,
      which highlights its first role: a global namespace.

      For example, if you define a view class, it might look like this:

      ```javascript
      App.MyView = Ember.View.extend();
      ```

      By default, calling `Ember.Application.create()` will automatically initialize
      your application by calling the `Ember.Application.initialize()` method. If
      you need to delay initialization, you can call your app's `deferReadiness()`
      method. When you are ready for your app to be initialized, call its
      `advanceReadiness()` method.

      You can define a `ready` method on the `Ember.Application` instance, which
      will be run by Ember when the application is initialized.

      Because `Ember.Application` inherits from `Ember.Namespace`, any classes
      you create will have useful string representations when calling `toString()`.
      See the `Ember.Namespace` documentation for more information.

      While you can think of your `Ember.Application` as a container that holds the
      other classes in your application, there are several other responsibilities
      going on under-the-hood that you may want to understand.

      ### Event Delegation

      Ember uses a technique called _event delegation_. This allows the framework
      to set up a global, shared event listener instead of requiring each view to
      do it manually. For example, instead of each view registering its own
      `mousedown` listener on its associated element, Ember sets up a `mousedown`
      listener on the `body`.

      If a `mousedown` event occurs, Ember will look at the target of the event and
      start walking up the DOM node tree, finding corresponding views and invoking
      their `mouseDown` method as it goes.

      `Ember.Application` has a number of default events that it listens for, as
      well as a mapping from lowercase events to camel-cased view method names. For
      example, the `keypress` event causes the `keyPress` method on the view to be
      called, the `dblclick` event causes `doubleClick` to be called, and so on.

      If there is a bubbling browser event that Ember does not listen for by
      default, you can specify custom events and their corresponding view method
      names by setting the application's `customEvents` property:

      ```javascript
      App = Ember.Application.create({
        customEvents: {
          // add support for the paste event
          paste: "paste"
        }
      });
      ```

      By default, the application sets up these event listeners on the document
      body. However, in cases where you are embedding an Ember application inside
      an existing page, you may want it to set up the listeners on an element
      inside the body.

      For example, if only events inside a DOM element with the ID of `ember-app`
      should be delegated, set your application's `rootElement` property:

      ```javascript
      window.App = Ember.Application.create({
        rootElement: '#ember-app'
      });
      ```

      The `rootElement` can be either a DOM element or a jQuery-compatible selector
      string. Note that *views appended to the DOM outside the root element will
      not receive events.* If you specify a custom root element, make sure you only
      append views inside it!

      To learn more about the advantages of event delegation and the Ember view
      layer, and a list of the event listeners that are setup by default, visit the
      [Ember View Layer guide](http://emberjs.com/guides/understanding-ember/the-view-layer/#toc_event-delegation).

      ### Initializers

      Libraries on top of Ember can add initializers, like so:

      ```javascript
      Ember.Application.initializer({
        name: 'api-adapter',

        initialize: function(container, application) {
          application.register('api-adapter:main', ApiAdapter);
        }
      });
      ```

      Initializers provide an opportunity to access the container, which
      organizes the different components of an Ember application. Additionally
      they provide a chance to access the instantiated application. Beyond
      being used for libraries, initializers are also a great way to organize
      dependency injection or setup in your own application.

      ### Routing

      In addition to creating your application's router, `Ember.Application` is
      also responsible for telling the router when to start routing. Transitions
      between routes can be logged with the `LOG_TRANSITIONS` flag, and more
      detailed intra-transition logging can be logged with
      the `LOG_TRANSITIONS_INTERNAL` flag:

      ```javascript
      window.App = Ember.Application.create({
        LOG_TRANSITIONS: true, // basic logging of successful transitions
        LOG_TRANSITIONS_INTERNAL: true // detailed logging of all routing steps
      });
      ```

      By default, the router will begin trying to translate the current URL into
      application state once the browser emits the `DOMContentReady` event. If you
      need to defer routing, you can call the application's `deferReadiness()`
      method. Once routing can begin, call the `advanceReadiness()` method.

      If there is any setup required before routing begins, you can implement a
      `ready()` method on your app that will be invoked immediately before routing
      begins.
      ```

      @class Application
      @namespace Ember
      @extends Ember.Namespace
    */

    var Application = Namespace.extend(DeferredMixin, {

      /**
        The root DOM element of the Application. This can be specified as an
        element or a
        [jQuery-compatible selector string](http://api.jquery.com/category/selectors/).

        This is the element that will be passed to the Application's,
        `eventDispatcher`, which sets up the listeners for event delegation. Every
        view in your application should be a child of the element you specify here.

        @property rootElement
        @type DOMElement
        @default 'body'
      */
      rootElement: 'body',

      /**
        The `Ember.EventDispatcher` responsible for delegating events to this
        application's views.

        The event dispatcher is created by the application at initialization time
        and sets up event listeners on the DOM element described by the
        application's `rootElement` property.

        See the documentation for `Ember.EventDispatcher` for more information.

        @property eventDispatcher
        @type Ember.EventDispatcher
        @default null
      */
      eventDispatcher: null,

      /**
        The DOM events for which the event dispatcher should listen.

        By default, the application's `Ember.EventDispatcher` listens
        for a set of standard DOM events, such as `mousedown` and
        `keyup`, and delegates them to your application's `Ember.View`
        instances.

        If you would like additional bubbling events to be delegated to your
        views, set your `Ember.Application`'s `customEvents` property
        to a hash containing the DOM event name as the key and the
        corresponding view method name as the value. For example:

        ```javascript
        App = Ember.Application.create({
          customEvents: {
            // add support for the paste event
            paste: "paste"
          }
        });
        ```

        @property customEvents
        @type Object
        @default null
      */
      customEvents: null,

      // Start off the number of deferrals at 1. This will be
      // decremented by the Application's own `initialize` method.
      _readinessDeferrals: 1,

      init: function() {
        if (!this.$) { this.$ = jQuery; }
        this.__container__ = this.buildContainer();

        this.Router = this.defaultRouter();

        this._super();

        this.scheduleInitialize();

        Ember.libraries.registerCoreLibrary('Handlebars', EmberHandlebars.VERSION);
        Ember.libraries.registerCoreLibrary('jQuery', jQuery().jquery);

        if ( Ember.LOG_VERSION ) {
          Ember.LOG_VERSION = false; // we only need to see this once per Application#init

          var nameLengths = EnumerableUtils.map(Ember.libraries, function(item) {
            return get(item, "name.length");
          });

          var maxNameLength = Math.max.apply(this, nameLengths);

          Ember.debug('-------------------------------');
          Ember.libraries.each(function(name, version) {
            var spaces = new Array(maxNameLength - name.length + 1).join(" ");
            Ember.debug([name, spaces, ' : ', version].join(""));
          });
          Ember.debug('-------------------------------');
        }
      },

      /**
        Build the container for the current application.

        Also register a default application view in case the application
        itself does not.

        @private
        @method buildContainer
        @return {Ember.Container} the configured container
      */
      buildContainer: function() {
        var container = this.__container__ = Application.buildContainer(this);

        return container;
      },

      /**
        If the application has not opted out of routing and has not explicitly
        defined a router, supply a default router for the application author
        to configure.

        This allows application developers to do:

        ```javascript
        var App = Ember.Application.create();

        App.Router.map(function() {
          this.resource('posts');
        });
        ```

        @private
        @method defaultRouter
        @return {Ember.Router} the default router
      */

      defaultRouter: function() {
        if (this.Router === false) { return; }
        var container = this.__container__;

        if (this.Router) {
          container.unregister('router:main');
          container.register('router:main', this.Router);
        }

        return container.lookupFactory('router:main');
      },

      /**
        Automatically initialize the application once the DOM has
        become ready.

        The initialization itself is scheduled on the actions queue
        which ensures that application loading finishes before
        booting.

        If you are asynchronously loading code, you should call
        `deferReadiness()` to defer booting, and then call
        `advanceReadiness()` once all of your code has finished
        loading.

        @private
        @method scheduleInitialize
      */
      scheduleInitialize: function() {
        var self = this;

        if (!this.$ || this.$.isReady) {
          run.schedule('actions', self, '_initialize');
        } else {
          this.$().ready(function runInitialize() {
            run(self, '_initialize');
          });
        }
      },

      /**
        Use this to defer readiness until some condition is true.

        Example:

        ```javascript
        App = Ember.Application.create();
        App.deferReadiness();

        jQuery.getJSON("/auth-token", function(token) {
          App.token = token;
          App.advanceReadiness();
        });
        ```

        This allows you to perform asynchronous setup logic and defer
        booting your application until the setup has finished.

        However, if the setup requires a loading UI, it might be better
        to use the router for this purpose.

        @method deferReadiness
      */
      deferReadiness: function() {
        Ember.assert("You must call deferReadiness on an instance of Ember.Application", this instanceof Application);
        Ember.assert("You cannot defer readiness since the `ready()` hook has already been called.", this._readinessDeferrals > 0);
        this._readinessDeferrals++;
      },

      /**
        Call `advanceReadiness` after any asynchronous setup logic has completed.
        Each call to `deferReadiness` must be matched by a call to `advanceReadiness`
        or the application will never become ready and routing will not begin.

        @method advanceReadiness
        @see {Ember.Application#deferReadiness}
      */
      advanceReadiness: function() {
        Ember.assert("You must call advanceReadiness on an instance of Ember.Application", this instanceof Application);
        this._readinessDeferrals--;

        if (this._readinessDeferrals === 0) {
          run.once(this, this.didBecomeReady);
        }
      },

      /**
        Registers a factory that can be used for dependency injection (with
        `App.inject`) or for service lookup. Each factory is registered with
        a full name including two parts: `type:name`.

        A simple example:

        ```javascript
        var App = Ember.Application.create();
        App.Orange  = Ember.Object.extend();
        App.register('fruit:favorite', App.Orange);
        ```

        Ember will resolve factories from the `App` namespace automatically.
        For example `App.CarsController` will be discovered and returned if
        an application requests `controller:cars`.

        An example of registering a controller with a non-standard name:

        ```javascript
        var App = Ember.Application.create(),
            Session  = Ember.Controller.extend();

        App.register('controller:session', Session);

        // The Session controller can now be treated like a normal controller,
        // despite its non-standard name.
        App.ApplicationController = Ember.Controller.extend({
          needs: ['session']
        });
        ```

        Registered factories are **instantiated** by having `create`
        called on them. Additionally they are **singletons**, each time
        they are looked up they return the same instance.

        Some examples modifying that default behavior:

        ```javascript
        var App = Ember.Application.create();

        App.Person  = Ember.Object.extend();
        App.Orange  = Ember.Object.extend();
        App.Email   = Ember.Object.extend();
        App.session = Ember.Object.create();

        App.register('model:user', App.Person, {singleton: false });
        App.register('fruit:favorite', App.Orange);
        App.register('communication:main', App.Email, {singleton: false});
        App.register('session', App.session, {instantiate: false});
        ```

        @method register
        @param  fullName {String} type:name (e.g., 'model:user')
        @param  factory {Function} (e.g., App.Person)
        @param  options {Object} (optional) disable instantiation or singleton usage
      **/
      register: function() {
        var container = this.__container__;
        container.register.apply(container, arguments);
      },

      /**
        Define a dependency injection onto a specific factory or all factories
        of a type.

        When Ember instantiates a controller, view, or other framework component
        it can attach a dependency to that component. This is often used to
        provide services to a set of framework components.

        An example of providing a session object to all controllers:

        ```javascript
        var App = Ember.Application.create(),
            Session = Ember.Object.extend({ isAuthenticated: false });

        // A factory must be registered before it can be injected
        App.register('session:main', Session);

        // Inject 'session:main' onto all factories of the type 'controller'
        // with the name 'session'
        App.inject('controller', 'session', 'session:main');

        App.IndexController = Ember.Controller.extend({
          isLoggedIn: Ember.computed.alias('session.isAuthenticated')
        });
        ```

        Injections can also be performed on specific factories.

        ```javascript
        App.inject(<full_name or type>, <property name>, <full_name>)
        App.inject('route', 'source', 'source:main')
        App.inject('route:application', 'email', 'model:email')
        ```

        It is important to note that injections can only be performed on
        classes that are instantiated by Ember itself. Instantiating a class
        directly (via `create` or `new`) bypasses the dependency injection
        system.

        Ember-Data instantiates its models in a unique manner, and consequently
        injections onto models (or all models) will not work as expected. Injections
        on models can be enabled by setting `Ember.MODEL_FACTORY_INJECTIONS`
        to `true`.

        @method inject
        @param  factoryNameOrType {String}
        @param  property {String}
        @param  injectionName {String}
      **/
      inject: function() {
        var container = this.__container__;
        container.injection.apply(container, arguments);
      },

      /**
        Calling initialize manually is not supported.

        Please see Ember.Application#advanceReadiness and
        Ember.Application#deferReadiness.

        @private
        @deprecated
        @method initialize
       **/
      initialize: function() {
        Ember.deprecate('Calling initialize manually is not supported. Please see Ember.Application#advanceReadiness and Ember.Application#deferReadiness');
      },

      /**
        Initialize the application. This happens automatically.

        Run any initializers and run the application load hook. These hooks may
        choose to defer readiness. For example, an authentication hook might want
        to defer readiness until the auth token has been retrieved.

        @private
        @method _initialize
      */
      _initialize: function() {
        if (this.isDestroyed) { return; }

        // At this point, the App.Router must already be assigned
        if (this.Router) {
          var container = this.__container__;
          container.unregister('router:main');
          container.register('router:main', this.Router);
        }

        this.runInitializers();
        runLoadHooks('application', this);

        // At this point, any initializers or load hooks that would have wanted
        // to defer readiness have fired. In general, advancing readiness here
        // will proceed to didBecomeReady.
        this.advanceReadiness();

        return this;
      },

      /**
        Reset the application. This is typically used only in tests. It cleans up
        the application in the following order:

        1. Deactivate existing routes
        2. Destroy all objects in the container
        3. Create a new application container
        4. Re-route to the existing url

        Typical Example:

        ```javascript

        var App;

        run(function() {
          App = Ember.Application.create();
        });

        module("acceptance test", {
          setup: function() {
            App.reset();
          }
        });

        test("first test", function() {
          // App is freshly reset
        });

        test("first test", function() {
          // App is again freshly reset
        });
        ```

        Advanced Example:

        Occasionally you may want to prevent the app from initializing during
        setup. This could enable extra configuration, or enable asserting prior
        to the app becoming ready.

        ```javascript

        var App;

        run(function() {
          App = Ember.Application.create();
        });

        module("acceptance test", {
          setup: function() {
            run(function() {
              App.reset();
              App.deferReadiness();
            });
          }
        });

        test("first test", function() {
          ok(true, 'something before app is initialized');

          run(function() {
            App.advanceReadiness();
          });
          ok(true, 'something after app is initialized');
        });
        ```

        @method reset
      **/
      reset: function() {
        this._readinessDeferrals = 1;

        function handleReset() {
          var router = this.__container__.lookup('router:main');
          router.reset();

          run(this.__container__, 'destroy');

          this.buildContainer();

          run.schedule('actions', this, function() {
            this._initialize();
          });
        }

        run.join(this, handleReset);
      },

      /**
        @private
        @method runInitializers
      */
      runInitializers: function() {
        var initializers = get(this.constructor, 'initializers'),
            container = this.__container__,
            graph = new DAG(),
            namespace = this,
            name, initializer;

        for (name in initializers) {
          initializer = initializers[name];
          graph.addEdges(initializer.name, initializer.initialize, initializer.before, initializer.after);
        }

        graph.topsort(function (vertex) {
          var initializer = vertex.value;
          Ember.assert("No application initializer named '"+vertex.name+"'", initializer);
          initializer(container, namespace);
        });
      },

      /**
        @private
        @method didBecomeReady
      */
      didBecomeReady: function() {
        this.setupEventDispatcher();
        this.ready(); // user hook
        this.startRouting();

        if (!Ember.testing) {
          // Eagerly name all classes that are already loaded
          Ember.Namespace.processAll();
          Ember.BOOTED = true;
        }

        this.resolve(this);
      },

      /**
        Setup up the event dispatcher to receive events on the
        application's `rootElement` with any registered
        `customEvents`.

        @private
        @method setupEventDispatcher
      */
      setupEventDispatcher: function() {
        var customEvents = get(this, 'customEvents'),
            rootElement = get(this, 'rootElement'),
            dispatcher = this.__container__.lookup('event_dispatcher:main');

        set(this, 'eventDispatcher', dispatcher);
        dispatcher.setup(customEvents, rootElement);
      },

      /**
        If the application has a router, use it to route to the current URL, and
        trigger a new call to `route` whenever the URL changes.

        @private
        @method startRouting
        @property router {Ember.Router}
      */
      startRouting: function() {
        var router = this.__container__.lookup('router:main');
        if (!router) { return; }

        router.startRouting();
      },

      handleURL: function(url) {
        var router = this.__container__.lookup('router:main');

        router.handleURL(url);
      },

      /**
        Called when the Application has become ready.
        The call will be delayed until the DOM has become ready.

        @event ready
      */
      ready: K,

      /**
        @deprecated Use 'Resolver' instead
        Set this to provide an alternate class to `Ember.DefaultResolver`


        @property resolver
      */
      resolver: null,

      /**
        Set this to provide an alternate class to `Ember.DefaultResolver`

        @property resolver
      */
      Resolver: null,

      willDestroy: function() {
        Ember.BOOTED = false;
        // Ensure deactivation of routes before objects are destroyed
        this.__container__.lookup('router:main').reset();

        this.__container__.destroy();
      },

      initializer: function(options) {
        this.constructor.initializer(options);
      }
    });

    Application.reopenClass({
      initializers: {},

      /**
        Initializer receives an object which has the following attributes:
        `name`, `before`, `after`, `initialize`. The only required attribute is
        `initialize, all others are optional.

        * `name` allows you to specify under which name the initializer is registered.
        This must be a unique name, as trying to register two initializers with the
        same name will result in an error.

        ```javascript
        Ember.Application.initializer({
          name: 'namedInitializer',
          initialize: function(container, application) {
            Ember.debug("Running namedInitializer!");
          }
        });
        ```

        * `before` and `after` are used to ensure that this initializer is ran prior
        or after the one identified by the value. This value can be a single string
        or an array of strings, referencing the `name` of other initializers.

        An example of ordering initializers, we create an initializer named `first`:

        ```javascript
        Ember.Application.initializer({
          name: 'first',
          initialize: function(container, application) {
            Ember.debug("First initializer!");
          }
        });

        // DEBUG: First initializer!
        ```

        We add another initializer named `second`, specifying that it should run
        after the initializer named `first`:

        ```javascript
        Ember.Application.initializer({
          name: 'second',
          after: 'first',

          initialize: function(container, application) {
            Ember.debug("Second initializer!");
          }
        });

        // DEBUG: First initializer!
        // DEBUG: Second initializer!
        ```

        Afterwards we add a further initializer named `pre`, this time specifying
        that it should run before the initializer named `first`:

        ```javascript
        Ember.Application.initializer({
          name: 'pre',
          before: 'first',

          initialize: function(container, application) {
            Ember.debug("Pre initializer!");
          }
        });

        // DEBUG: Pre initializer!
        // DEBUG: First initializer!
        // DEBUG: Second initializer!
        ```

        Finally we add an initializer named `post`, specifying it should run after
        both the `first` and the `second` initializers:

        ```javascript
        Ember.Application.initializer({
          name: 'post',
          after: ['first', 'second'],

          initialize: function(container, application) {
            Ember.debug("Post initializer!");
          }
        });

        // DEBUG: Pre initializer!
        // DEBUG: First initializer!
        // DEBUG: Second initializer!
        // DEBUG: Post initializer!
        ```

        * `initialize` is a callback function that receives two arguments, `container`
        and `application` on which you can operate.

        Example of using `container` to preload data into the store:

        ```javascript
        Ember.Application.initializer({
          name: "preload-data",

          initialize: function(container, application) {
            var store = container.lookup('store:main');
            store.pushPayload(preloadedData);
          }
        });
        ```

        Example of using `application` to register an adapter:

        ```javascript
        Ember.Application.initializer({
          name: 'api-adapter',

          initialize: function(container, application) {
            application.register('api-adapter:main', ApiAdapter);
          }
        });
        ```

        @method initializer
        @param initializer {Object}
       */
      initializer: function(initializer) {
        // If this is the first initializer being added to a subclass, we are going to reopen the class
        // to make sure we have a new `initializers` object, which extends from the parent class' using
        // prototypal inheritance. Without this, attempting to add initializers to the subclass would
        // pollute the parent class as well as other subclasses.
        if (this.superclass.initializers !== undefined && this.superclass.initializers === this.initializers) {
          this.reopenClass({
            initializers: create(this.initializers)
          });
        }

        Ember.assert("The initializer '" + initializer.name + "' has already been registered", !this.initializers[initializer.name]);
        Ember.assert("An initializer cannot be registered without an initialize function", canInvoke(initializer, 'initialize'));

        this.initializers[initializer.name] = initializer;
      },

      /**
        This creates a container with the default Ember naming conventions.

        It also configures the container:

        * registered views are created every time they are looked up (they are
          not singletons)
        * registered templates are not factories; the registered value is
          returned directly.
        * the router receives the application as its `namespace` property
        * all controllers receive the router as their `target` and `controllers`
          properties
        * all controllers receive the application as their `namespace` property
        * the application view receives the application controller as its
          `controller` property
        * the application view receives the application template as its
          `defaultTemplate` property

        @private
        @method buildContainer
        @static
        @param {Ember.Application} namespace the application to build the
          container for.
        @return {Ember.Container} the built container
      */
      buildContainer: function(namespace) {
        var container = new Container();

        Container.defaultContainer = new DeprecatedContainer(container);

        container.set = set;
        container.resolver  = resolverFor(namespace);
        container.normalize = container.resolver.normalize;
        container.describe  = container.resolver.describe;
        container.makeToString = container.resolver.makeToString;

        container.optionsForType('component', { singleton: false });
        container.optionsForType('view', { singleton: false });
        container.optionsForType('template', { instantiate: false });
        container.optionsForType('helper', { instantiate: false });

        container.register('application:main', namespace, { instantiate: false });

        container.register('controller:basic', Controller, { instantiate: false });
        container.register('controller:object', ObjectController, { instantiate: false });
        container.register('controller:array', ArrayController, { instantiate: false });
        container.register('route:basic', Route, { instantiate: false });
        container.register('event_dispatcher:main', EventDispatcher);

        container.register('router:main',  Router);
        container.injection('router:main', 'namespace', 'application:main');

        container.register('location:auto', AutoLocation);
        container.register('location:hash', HashLocation);
        container.register('location:history', HistoryLocation);
        container.register('location:none', NoneLocation);

        container.injection('controller', 'target', 'router:main');
        container.injection('controller', 'namespace', 'application:main');

        container.injection('route', 'router', 'router:main');
        container.injection('location', 'rootURL', '-location-setting:root-url');

        // DEBUGGING
        container.register('resolver-for-debugging:main', container.resolver.__resolver__, { instantiate: false });
        container.injection('container-debug-adapter:main', 'resolver', 'resolver-for-debugging:main');
        container.injection('data-adapter:main', 'containerDebugAdapter', 'container-debug-adapter:main');
        // Custom resolver authors may want to register their own ContainerDebugAdapter with this key

        // ES6TODO: resolve this via import once ember-application package is ES6'ed
        requireModule('ember-extension-support');
        container.register('container-debug-adapter:main', ContainerDebugAdapter);

        return container;
      }
    });

    /**
      This function defines the default lookup rules for container lookups:

      * templates are looked up on `Ember.TEMPLATES`
      * other names are looked up on the application after classifying the name.
        For example, `controller:post` looks up `App.PostController` by default.
      * if the default lookup fails, look for registered classes on the container

      This allows the application to register default injections in the container
      that could be overridden by the normal naming convention.

      @private
      @method resolverFor
      @param {Ember.Namespace} namespace the namespace to look for classes
      @return {*} the resolved value for a given lookup
    */
    function resolverFor(namespace) {
      if (namespace.get('resolver')) {
        Ember.deprecate('Application.resolver is deprecated in favor of Application.Resolver', false);
      }

      var ResolverClass = namespace.get('resolver') || namespace.get('Resolver') || DefaultResolver;
      var resolver = ResolverClass.create({
        namespace: namespace
      });

      function resolve(fullName) {
        return resolver.resolve(fullName);
      }

      resolve.describe = function(fullName) {
        return resolver.lookupDescription(fullName);
      };

      resolve.makeToString = function(factory, fullName) {
        return resolver.makeToString(factory, fullName);
      };

      resolve.normalize = function(fullName) {
        if (resolver.normalize) {
          return resolver.normalize(fullName);
        } else {
          Ember.deprecate('The Resolver should now provide a \'normalize\' function', false);
          return fullName;
        }
      };

      resolve.__resolver__ = resolver;

      return resolve;
    }

    __exports__["default"] = Application;
  });
define("ember-application/system/dag",
  ["exports"],
  function(__exports__) {
    "use strict";
    function visit(vertex, fn, visited, path) {
      var name = vertex.name,
        vertices = vertex.incoming,
        names = vertex.incomingNames,
        len = names.length,
        i;
      if (!visited) {
        visited = {};
      }
      if (!path) {
        path = [];
      }
      if (visited.hasOwnProperty(name)) {
        return;
      }
      path.push(name);
      visited[name] = true;
      for (i = 0; i < len; i++) {
        visit(vertices[names[i]], fn, visited, path);
      }
      fn(vertex, path);
      path.pop();
    }

    function DAG() {
      this.names = [];
      this.vertices = {};
    }

    DAG.prototype.add = function(name) {
      if (!name) { return; }
      if (this.vertices.hasOwnProperty(name)) {
        return this.vertices[name];
      }
      var vertex = {
        name: name, incoming: {}, incomingNames: [], hasOutgoing: false, value: null
      };
      this.vertices[name] = vertex;
      this.names.push(name);
      return vertex;
    };

    DAG.prototype.map = function(name, value) {
      this.add(name).value = value;
    };

    DAG.prototype.addEdge = function(fromName, toName) {
      if (!fromName || !toName || fromName === toName) {
        return;
      }
      var from = this.add(fromName), to = this.add(toName);
      if (to.incoming.hasOwnProperty(fromName)) {
        return;
      }
      function checkCycle(vertex, path) {
        if (vertex.name === toName) {
          throw new EmberError("cycle detected: " + toName + " <- " + path.join(" <- "));
        }
      }
      visit(from, checkCycle);
      from.hasOutgoing = true;
      to.incoming[fromName] = from;
      to.incomingNames.push(fromName);
    };

    DAG.prototype.topsort = function(fn) {
      var visited = {},
        vertices = this.vertices,
        names = this.names,
        len = names.length,
        i, vertex;
      for (i = 0; i < len; i++) {
        vertex = vertices[names[i]];
        if (!vertex.hasOutgoing) {
          visit(vertex, fn, visited);
        }
      }
    };

    DAG.prototype.addEdges = function(name, value, before, after) {
      var i;
      this.map(name, value);
      if (before) {
        if (typeof before === 'string') {
          this.addEdge(name, before);
        } else {
          for (i = 0; i < before.length; i++) {
            this.addEdge(name, before[i]);
          }
        }
      }
      if (after) {
        if (typeof after === 'string') {
          this.addEdge(after, name);
        } else {
          for (i = 0; i < after.length; i++) {
            this.addEdge(after[i], name);
          }
        }
      }
    };

    __exports__["default"] = DAG;
  });
define("ember-application/system/resolver",
  ["ember-metal/core","ember-metal/property_get","ember-metal/logger","ember-runtime/system/string","ember-runtime/system/object","ember-runtime/system/namespace","ember-handlebars","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __exports__) {
    "use strict";
    /**
    @module ember
    @submodule ember-application
    */

    var Ember = __dependency1__["default"];
    // Ember.TEMPLATES, Ember.assert
    var get = __dependency2__.get;
    var Logger = __dependency3__["default"];
    var classify = __dependency4__.classify;
    var capitalize = __dependency4__.capitalize;
    var decamelize = __dependency4__.decamelize;
    var EmberObject = __dependency5__["default"];
    var Namespace = __dependency6__["default"];
    var EmberHandlebars = __dependency7__["default"];

    var Resolver = EmberObject.extend({
      /**
        This will be set to the Application instance when it is
        created.

        @property namespace
      */
      namespace: null,
      normalize: function(fullName) {
        throw new Error("Invalid call to `resolver.normalize(fullName)`. Please override the 'normalize' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      resolve: function(fullName) {
       throw new Error("Invalid call to `resolver.resolve(parsedName)`. Please override the 'resolve' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      parseName: function(parsedName) {
       throw new Error("Invalid call to `resolver.resolveByType(parsedName)`. Please override the 'resolveByType' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      lookupDescription: function(fullName) {
        throw new Error("Invalid call to `resolver.lookupDescription(fullName)`. Please override the 'lookupDescription' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      makeToString: function(factory, fullName) {
        throw new Error("Invalid call to `resolver.makeToString(factory, fullName)`. Please override the 'makeToString' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      resolveOther: function(parsedName) {
       throw new Error("Invalid call to `resolver.resolveOther(parsedName)`. Please override the 'resolveOther' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      },
      _logLookup: function(found, parsedName) {
       throw new Error("Invalid call to `resolver._logLookup(found, parsedName)`. Please override the '_logLookup' method in subclass of `Ember.Resolver` to prevent falling through to this error.");
      }
    });



    /**
      The DefaultResolver defines the default lookup rules to resolve
      container lookups before consulting the container for registered
      items:

      * templates are looked up on `Ember.TEMPLATES`
      * other names are looked up on the application after converting
        the name. For example, `controller:post` looks up
        `App.PostController` by default.
      * there are some nuances (see examples below)

      ### How Resolving Works

      The container calls this object's `resolve` method with the
      `fullName` argument.

      It first parses the fullName into an object using `parseName`.

      Then it checks for the presence of a type-specific instance
      method of the form `resolve[Type]` and calls it if it exists.
      For example if it was resolving 'template:post', it would call
      the `resolveTemplate` method.

      Its last resort is to call the `resolveOther` method.

      The methods of this object are designed to be easy to override
      in a subclass. For example, you could enhance how a template
      is resolved like so:

      ```javascript
      App = Ember.Application.create({
        Resolver: Ember.DefaultResolver.extend({
          resolveTemplate: function(parsedName) {
            var resolvedTemplate = this._super(parsedName);
            if (resolvedTemplate) { return resolvedTemplate; }
            return Ember.TEMPLATES['not_found'];
          }
        })
      });
      ```

      Some examples of how names are resolved:

      ```
      'template:post' //=> Ember.TEMPLATES['post']
      'template:posts/byline' //=> Ember.TEMPLATES['posts/byline']
      'template:posts.byline' //=> Ember.TEMPLATES['posts/byline']
      'template:blogPost' //=> Ember.TEMPLATES['blogPost']
                          //   OR
                          //   Ember.TEMPLATES['blog_post']
      'controller:post' //=> App.PostController
      'controller:posts.index' //=> App.PostsIndexController
      'controller:blog/post' //=> Blog.PostController
      'controller:basic' //=> Ember.Controller
      'route:post' //=> App.PostRoute
      'route:posts.index' //=> App.PostsIndexRoute
      'route:blog/post' //=> Blog.PostRoute
      'route:basic' //=> Ember.Route
      'view:post' //=> App.PostView
      'view:posts.index' //=> App.PostsIndexView
      'view:blog/post' //=> Blog.PostView
      'view:basic' //=> Ember.View
      'foo:post' //=> App.PostFoo
      'model:post' //=> App.Post
      ```

      @class DefaultResolver
      @namespace Ember
      @extends Ember.Object
    */
    var DefaultResolver = EmberObject.extend({
      /**
        This will be set to the Application instance when it is
        created.

        @property namespace
      */
      namespace: null,

      normalize: function(fullName) {
        var split = fullName.split(':', 2),
            type = split[0],
            name = split[1];

        Ember.assert("Tried to normalize a container name without a colon (:) in it. You probably tried to lookup a name that did not contain a type, a colon, and a name. A proper lookup name would be `view:post`.", split.length === 2);

        if (type !== 'template') {
          var result = name;

          if (result.indexOf('.') > -1) {
            result = result.replace(/\.(.)/g, function(m) { return m.charAt(1).toUpperCase(); });
          }

          if (name.indexOf('_') > -1) {
            result = result.replace(/_(.)/g, function(m) { return m.charAt(1).toUpperCase(); });
          }

          return type + ':' + result;
        } else {
          return fullName;
        }
      },


      /**
        This method is called via the container's resolver method.
        It parses the provided `fullName` and then looks up and
        returns the appropriate template or class.

        @method resolve
        @param {String} fullName the lookup string
        @return {Object} the resolved factory
      */
      resolve: function(fullName) {
        var parsedName = this.parseName(fullName),
            resolveMethodName = parsedName.resolveMethodName,
            resolved;

        if (!(parsedName.name && parsedName.type)) {
          throw new TypeError("Invalid fullName: `" + fullName + "`, must be of the form `type:name` ");
        }

        if (this[resolveMethodName]) {
          resolved = this[resolveMethodName](parsedName);
        }

        if (!resolved) {
          resolved = this.resolveOther(parsedName);
        }

        if (parsedName.root && parsedName.root.LOG_RESOLVER) {
          this._logLookup(resolved, parsedName);
        }

        return resolved;
      },
      /**
        Convert the string name of the form "type:name" to
        a Javascript object with the parsed aspects of the name
        broken out.

        @protected
        @param {String} fullName the lookup string
        @method parseName
      */
      parseName: function(fullName) {
        var nameParts = fullName.split(":"),
            type = nameParts[0], fullNameWithoutType = nameParts[1],
            name = fullNameWithoutType,
            namespace = get(this, 'namespace'),
            root = namespace;

        if (type !== 'template' && name.indexOf('/') !== -1) {
          var parts = name.split('/');
          name = parts[parts.length - 1];
          var namespaceName = capitalize(parts.slice(0, -1).join('.'));
          root = Namespace.byName(namespaceName);

          Ember.assert('You are looking for a ' + name + ' ' + type + ' in the ' + namespaceName + ' namespace, but the namespace could not be found', root);
        }

        return {
          fullName: fullName,
          type: type,
          fullNameWithoutType: fullNameWithoutType,
          name: name,
          root: root,
          resolveMethodName: "resolve" + classify(type)
        };
      },

      /**
        Returns a human-readable description for a fullName. Used by the
        Application namespace in assertions to describe the
        precise name of the class that Ember is looking for, rather than
        container keys.

        @protected
        @param {String} fullName the lookup string
        @method lookupDescription
      */
      lookupDescription: function(fullName) {
        var parsedName = this.parseName(fullName);

        if (parsedName.type === 'template') {
          return "template at " + parsedName.fullNameWithoutType.replace(/\./g, '/');
        }

        var description = parsedName.root + "." + classify(parsedName.name);
        if (parsedName.type !== 'model') { description += classify(parsedName.type); }

        return description;
      },

      makeToString: function(factory, fullName) {
        return factory.toString();
      },
      /**
        Given a parseName object (output from `parseName`), apply
        the conventions expected by `Ember.Router`

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method useRouterNaming
      */
      useRouterNaming: function(parsedName) {
        parsedName.name = parsedName.name.replace(/\./g, '_');
        if (parsedName.name === 'basic') {
          parsedName.name = '';
        }
      },
      /**
        Look up the template in Ember.TEMPLATES

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveTemplate
      */
      resolveTemplate: function(parsedName) {
        var templateName = parsedName.fullNameWithoutType.replace(/\./g, '/');

        if (Ember.TEMPLATES[templateName]) {
          return Ember.TEMPLATES[templateName];
        }

        templateName = decamelize(templateName);
        if (Ember.TEMPLATES[templateName]) {
          return Ember.TEMPLATES[templateName];
        }
      },
      /**
        Lookup the view using `resolveOther`

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveView
      */
      resolveView: function(parsedName) {
        this.useRouterNaming(parsedName);
        return this.resolveOther(parsedName);
      },
      /**
        Lookup the controller using `resolveOther`

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveController
      */
      resolveController: function(parsedName) {
        this.useRouterNaming(parsedName);
        return this.resolveOther(parsedName);
      },
      /**
        Lookup the route using `resolveOther`

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveRoute
      */
      resolveRoute: function(parsedName) {
        this.useRouterNaming(parsedName);
        return this.resolveOther(parsedName);
      },

      /**
        Lookup the model on the Application namespace

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveModel
      */
      resolveModel: function(parsedName) {
        var className = classify(parsedName.name),
            factory = get(parsedName.root, className);

         if (factory) { return factory; }
      },
      /**
        Look up the specified object (from parsedName) on the appropriate
        namespace (usually on the Application)

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveHelper
      */
      resolveHelper: function(parsedName) {
        return this.resolveOther(parsedName) || EmberHandlebars.helpers[parsedName.fullNameWithoutType];
      },
      /**
        Look up the specified object (from parsedName) on the appropriate
        namespace (usually on the Application)

        @protected
        @param {Object} parsedName a parseName object with the parsed
          fullName lookup string
        @method resolveOther
      */
      resolveOther: function(parsedName) {
        var className = classify(parsedName.name) + classify(parsedName.type),
            factory = get(parsedName.root, className);
        if (factory) { return factory; }
      },

      /**
       @method _logLookup
       @param {Boolean} found
       @param {Object} parsedName
       @private
      */
      _logLookup: function(found, parsedName) {
        var symbol, padding;

        if (found) { symbol = '[✓]'; }
        else          { symbol = '[ ]'; }

        if (parsedName.fullName.length > 60) {
          padding = '.';
        } else {
          padding = new Array(60 - parsedName.fullName.length).join('.');
        }

        Logger.info(symbol, parsedName.fullName, padding, this.lookupDescription(parsedName.fullName));
      }
    });

    __exports__.Resolver = Resolver;
    __exports__.DefaultResolver = DefaultResolver;
  });
})();

