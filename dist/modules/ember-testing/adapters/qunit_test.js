define("ember-testing/tests/adapters/qunit_test",
  ["ember-metal/core","ember-metal/run_loop","ember-testing/adapters/qunit"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    // Ember.K
    var run = __dependency2__["default"];
    var QUnitAdapter = __dependency3__["default"];

    var adapter;

    module("ember-testing QUnitAdapter", {
      setup: function() {
        adapter = new QUnitAdapter();
      },
      teardown: function() {
        run(adapter, adapter.destroy);
      }
    });

    test("asyncStart calls stop", function() {
      var originalStop = QUnit.stop;
      try {
        QUnit.stop = function(){
          ok(true, "stop called");
        };
        adapter.asyncStart();
      } finally {
        QUnit.stop = originalStop;
      }
    });

    test("asyncEnd calls start", function() {
      var originalStart = QUnit.start;
      try {
        QUnit.start = function(){
          ok(true, "start called");
        };
        adapter.asyncEnd();
      } finally {
        QUnit.start = originalStart;
      }
    });

    test("exception causes a failing assertion", function() {
      var error = {err: 'hai'}, originalOk = window.ok;
      try {
        window.ok = function(val, msg){
          originalOk(!val, "ok is called with false");
          originalOk(msg, '{err: "hai"}');
        };
        adapter.exception(error);
      } finally {
        window.ok = originalOk;
      }
    });
  });