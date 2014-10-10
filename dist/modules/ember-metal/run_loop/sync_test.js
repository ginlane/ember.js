define("ember-metal/tests/run_loop/sync_test",
  ["ember-metal/run_loop"],
  function(__dependency1__) {
    "use strict";
    var run = __dependency1__["default"];

    module('system/run_loop/sync_test');

    test('sync() will immediately flush the sync queue only', function() {
      var cnt = 0;

      run(function() {

        function cntup() { cnt++; }

        function syncfunc() {
          if (++cnt<5) run.schedule('sync', syncfunc);
          run.schedule('actions', cntup);
        }

        syncfunc();

        equal(cnt, 1, 'should not run action yet') ;
        run.sync();

        equal(cnt, 5, 'should have run sync queue continuously');
      });

      equal(cnt, 10, 'should flush actions now too');

    });

    test('calling sync() outside a run loop does not cause an error', function() {
      expect(0);

      run.sync();
    });
  });