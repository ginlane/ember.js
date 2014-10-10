define("ember-routing/helpers/shared",
  ["ember-metal/property_get","ember-metal/array","ember-runtime/system/lazy_load","ember-runtime/controllers/controller","ember-routing/system/router","ember-handlebars/ext","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __exports__) {
    "use strict";
    var get = __dependency1__.get;
    var map = __dependency2__.map;
    var onLoad = __dependency3__.onLoad;
    var ControllerMixin = __dependency4__.ControllerMixin;
    var EmberRouter = __dependency5__["default"];
    var handlebarsResolve = __dependency6__.resolveParams;
    var handlebarsGet = __dependency6__.handlebarsGet;

    function resolveParams(context, params, options) {
      return map.call(resolvePaths(context, params, options), function(path, i) {
        if (null === path) {
          // Param was string/number, not a path, so just return raw string/number.
          return params[i];
        } else {
          return handlebarsGet(context, path, options);
        }
      });
    }

    function resolvePaths(context, params, options) {
      var resolved = handlebarsResolve(context, params, options),
          types = options.types;

      return map.call(resolved, function(object, i) {
        if (types[i] === 'ID') {
          return unwrap(object, params[i]);
        } else {
          return null;
        }
      });

      function unwrap(object, path) {
        if (path === 'controller') { return path; }

        if (ControllerMixin.detect(object)) {
          return unwrap(get(object, 'model'), path ? path + '.model' : 'model');
        } else {
          return path;
        }
      }
    }

    __exports__.resolveParams = resolveParams;
    __exports__.resolvePaths = resolvePaths;
  });