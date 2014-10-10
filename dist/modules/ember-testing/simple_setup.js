define("ember-testing/tests/simple_setup",
  ["ember-metal/core","ember-metal/run_loop","ember-views/system/jquery"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var run = __dependency2__["default"];
    var jQuery = __dependency3__["default"];

    var App;

    module('Simple Testing Setup', {
      teardown: function() {
        if (App) {
          App.removeTestHelpers();
          jQuery('#ember-testing-container, #ember-testing').remove();
          run(App, 'destroy');
          App = null;
        }
      }
    });
  });