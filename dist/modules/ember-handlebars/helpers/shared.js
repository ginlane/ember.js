define("ember-handlebars/helpers/shared",
  ["ember-handlebars/ext","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var handlebarsGet = __dependency1__.handlebarsGet;

    function resolvePaths(options) {
      var ret = [],
          contexts = options.contexts,
          roots = options.roots,
          data = options.data;

      for (var i=0, l=contexts.length; i<l; i++) {
        ret.push( handlebarsGet(roots[i], contexts[i], { data: data }) );
      }

      return ret;
    }

    __exports__["default"] = resolvePaths;
  });