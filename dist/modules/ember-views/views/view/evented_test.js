define("ember-views/tests/views/view/evented_test",
  ["ember-metal/property_get","ember-metal/run_loop","ember-runtime/system/object","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var get = __dependency1__.get;
    var run = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var EmberView = __dependency4__.View;

    var view;

    module("EmberView evented helpers", {
      teardown: function() {
        run(function() {
          view.destroy();
        });
      }
    });

    test("fire should call method sharing event name if it exists on the view", function() {
      var eventFired = false;

      view = EmberView.create({
        fireMyEvent: function() {
          this.trigger('myEvent');
        },

        myEvent: function() {
          eventFired = true;
        }
      });

      run(function() {
        view.fireMyEvent();
      });

      equal(eventFired, true, "fired the view method sharing the event name");
    });

    test("fire does not require a view method with the same name", function() {
      var eventFired = false;

      view = EmberView.create({
        fireMyEvent: function() {
          this.trigger('myEvent');
        }
      });

      var listenObject = EmberObject.create({
        onMyEvent: function() {
          eventFired = true;
        }
      });

      view.on('myEvent', listenObject, 'onMyEvent');

      run(function() {
        view.fireMyEvent();
      });

      equal(eventFired, true, "fired the event without a view method sharing its name");

      run(function() {
        listenObject.destroy();
      });
    });
  });