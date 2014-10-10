define("ember-runtime/system/container",
  ["ember-metal/property_set","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var set = __dependency1__["default"];

    var Container = requireModule('container')["default"];
    Container.set = set;

    __exports__["default"] = Container;
  });