var define, requireModule, require, requirejs, Ember;

(function() {
  Ember = this.Ember = this.Ember || {};
  if (typeof Ember === 'undefined') { Ember = {} };

  if (typeof Ember.__loader === 'undefined') {
    var registry = {}, seen = {};

    define = function(name, deps, callback) {
      registry[name] = { deps: deps, callback: callback };
    };

    requirejs = require = requireModule = function(name) {
      if (seen.hasOwnProperty(name)) { return seen[name]; }
      seen[name] = {};

      if (!registry[name]) {
        throw new Error("Could not find module " + name);
      }

      var mod = registry[name],
      deps = mod.deps,
      callback = mod.callback,
      reified = [],
      exports;

      for (var i=0, l=deps.length; i<l; i++) {
        if (deps[i] === 'exports') {
          reified.push(exports = {});
        } else {
          reified.push(requireModule(resolve(deps[i])));
        }
      }

      var value = callback.apply(this, reified);
      return seen[name] = exports || value;

      function resolve(child) {
        if (child.charAt(0) !== '.') { return child; }
        var parts = child.split("/");
        var parentBase = name.split("/").slice(0, -1);

        for (var i=0, l=parts.length; i<l; i++) {
          var part = parts[i];

          if (part === '..') { parentBase.pop(); }
          else if (part === '.') { continue; }
          else { parentBase.push(part); }
        }

        return parentBase.join("/");
      }
    };
    requirejs._eak_seen = registry;

    Ember.__loader = {define: define, require: require, registry: registry};
  } else {
    define = Ember.__loader.define;
    requirejs = require = requireModule = Ember.__loader.require;
  }
})();
/*!
 * @overview  Ember - JavaScript Application Framework
 * @copyright Copyright 2011-2014 Tilde Inc. and contributors
 *            Portions Copyright 2006-2011 Strobe Inc.
 *            Portions Copyright 2008-2011 Apple Inc. All rights reserved.
 * @license   Licensed under MIT license
 *            See https://raw.github.com/emberjs/ember.js/master/LICENSE
 * @version   1.6.1
 */


var JSHINTRC = {
    "predef": [
        "QUnit",
        "define",
        "console",
        "Ember",
        "DS",
        "Handlebars",
        "Metamorph",
        "RSVP",
        "require",
        "requireModule",
        "equal",
        "notEqual",
        "notStrictEqual",
        "test",
        "asyncTest",
        "testBoth",
        "testWithDefault",
        "raises",
        "throws",
        "deepEqual",
        "ok",
        "strictEqual",
        "module",
        "expect",
        "minispade",
        "expectAssertion",
        "expectDeprecation",
        "expectNoDeprecation",
        "ignoreAssertion",
        "ignoreDeprecation",

        // A safe subset of "browser:true":
        "window", "location", "document", "XMLSerializer",
        "setTimeout", "clearTimeout", "setInterval", "clearInterval"
    ],

    "node" : false,
    "browser" : false,

    "boss" : true,
    "curly": false,
    "debug": false,
    "devel": false,
    "eqeqeq": true,
    "evil": true,
    "forin": false,
    "immed": false,
    "laxbreak": false,
    "newcap": true,
    "noarg": true,
    "noempty": false,
    "nonew": false,
    "nomen": false,
    "onevar": false,
    "plusplus": false,
    "regexp": false,
    "undef": true,
    "sub": true,
    "strict": false,
    "white": false,
    "eqnull": true,
    "trailing": true
}
;
