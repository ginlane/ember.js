define("ember-views/tests/views/instrumentation_test",
  ["ember-metal/instrumentation","ember-metal/run_loop","ember-metal/utils","ember-metal/computed","ember-views/views/view"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
    "use strict";
    var subscribe = __dependency1__.subscribe;
    var instrumentationReset = __dependency1__.reset;
    var run = __dependency2__["default"];
    var guidFor = __dependency3__.guidFor;
    var computed = __dependency4__.computed;
    var EmberView = __dependency5__.View;

    var view, beforeCalls, afterCalls;

    function confirmPayload(payload, view) {
      var objectId = guidFor(view);

      equal(payload.object, view.toString(), 'payload object equals view.toString()');
      equal(payload.containerKey, view._debugContainerKey, 'payload contains the containerKey');
      equal(payload.view, view, 'payload contains the view itself');
    }

    QUnit.module("EmberView#instrumentation", {
      setup: function () {
        beforeCalls = [];
        afterCalls  = [];

        subscribe("render", {
          before: function(name, timestamp, payload) {
            beforeCalls.push(payload);
          },

          after: function(name, timestamp, payload) {
            afterCalls.push(payload);
          }
        });

        view = EmberView.create({
          _debugContainerKey: 'suchryzsd',
          instrumentDisplay: 'asdfasdfmewj'
        });
      },

      teardown: function() {
        if (view) {
          run(view, 'destroy');
        }

        instrumentationReset();
      }
    });

    test("generates the proper instrumentation details when called directly", function() {
      var payload = {};

      view.instrumentDetails(payload);

      confirmPayload(payload, view);
    });

    test("should add ember-view to views", function() {
      run(view, 'createElement');

      confirmPayload(beforeCalls[0], view);
    });
  });