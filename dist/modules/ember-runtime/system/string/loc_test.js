define("ember-runtime/tests/system/string/loc_test",
  ["ember-metal/core","ember-runtime/system/string"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var loc = __dependency2__.loc;

    var oldString;

    module('EmberStringUtils.loc', {
      setup: function() {
        oldString = Ember.STRINGS;
        Ember.STRINGS = {
          '_Hello World': 'Bonjour le monde',
          '_Hello %@ %@': 'Bonjour %@ %@',
          '_Hello %@# %@#': 'Bonjour %@2 %@1'
        };
      },

      teardown: function() {
        Ember.STRINGS = oldString;
      }
    });

    if (!Ember.EXTEND_PROTOTYPES && !Ember.EXTEND_PROTOTYPES.String) {
      test("String.prototype.loc is not available without EXTEND_PROTOTYPES", function() {
        ok("undefined" === typeof String.prototype.loc, 'String.prototype helper disabled');
      });
    }

    test("'_Hello World'.loc() => 'Bonjour le monde'", function() {
      equal(loc('_Hello World'), 'Bonjour le monde');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('_Hello World'.loc(), 'Bonjour le monde');
      }
    });

    test("'_Hello %@ %@'.loc('John', 'Doe') => 'Bonjour John Doe'", function() {
      equal(loc('_Hello %@ %@', ['John', 'Doe']), 'Bonjour John Doe');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('_Hello %@ %@'.loc('John', 'Doe'), 'Bonjour John Doe');
      }
    });

    test("'_Hello %@# %@#'.loc('John', 'Doe') => 'Bonjour Doe John'", function() {
      equal(loc('_Hello %@# %@#', ['John', 'Doe']), 'Bonjour Doe John');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('_Hello %@# %@#'.loc('John', 'Doe'), 'Bonjour Doe John');
      }
    });

    test("'_Not In Strings'.loc() => '_Not In Strings'", function() {
      equal(loc('_Not In Strings'), '_Not In Strings');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('_Not In Strings'.loc(), '_Not In Strings');
      }
    });
  });