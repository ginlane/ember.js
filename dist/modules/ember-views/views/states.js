define("ember-views/views/states",
  ["ember-metal/platform","ember-metal/merge","ember-views/views/states/default","ember-views/views/states/pre_render","ember-views/views/states/in_buffer","ember-views/views/states/has_element","ember-views/views/states/in_dom","ember-views/views/states/destroying","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __exports__) {
    "use strict";
    var create = __dependency1__.create;
    var merge = __dependency2__["default"];
    var _default = __dependency3__["default"];
    var preRender = __dependency4__["default"];
    var inBuffer = __dependency5__["default"];
    var hasElement = __dependency6__["default"];
    var inDOM = __dependency7__["default"];
    var destroying = __dependency8__["default"];

    function cloneStates(from) {
      var into = {};

      into._default = {};
      into.preRender = create(into._default);
      into.destroying = create(into._default);
      into.inBuffer = create(into._default);
      into.hasElement = create(into._default);
      into.inDOM = create(into.hasElement);

      for (var stateName in from) {
        if (!from.hasOwnProperty(stateName)) { continue; }
        merge(into[stateName], from[stateName]);
      }

      return into;
    };

    var states = {
      _default: _default,
      preRender: preRender,
      inDOM: inDOM,
      inBuffer: inBuffer,
      hasElement: hasElement,
      destroying: destroying
    };

    __exports__.cloneStates = cloneStates;
    __exports__.states = states;
  });