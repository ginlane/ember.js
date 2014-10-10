define("ember-extension-support",
  ["ember-metal/core","ember-extension-support/data_adapter","ember-extension-support/container_debug_adapter"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    /**
    Ember Extension Support

    @module ember
    @submodule ember-extension-support
    @requires ember-application
    */

    var Ember = __dependency1__["default"];
    var DataAdapter = __dependency2__["default"];
    var ContainerDebugAdapter = __dependency3__["default"];

    Ember.DataAdapter = DataAdapter;
    Ember.ContainerDebugAdapter = ContainerDebugAdapter;
  });