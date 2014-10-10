define("ember-runtime/tests/system/string/fmt_string",
  ["ember-metal/core","ember-runtime/system/string"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var fmt = __dependency2__.fmt;

    module('EmberStringUtils.fmt');

    if (!Ember.EXTEND_PROTOTYPES && !Ember.EXTEND_PROTOTYPES.String) {
      test("String.prototype.fmt is not modified without EXTEND_PROTOTYPES", function() {
        ok("undefined" === typeof String.prototype.fmt, 'String.prototype helper disabled');
      });
    }

    test("'Hello %@ %@'.fmt('John', 'Doe') => 'Hello John Doe'", function() {
      equal(fmt('Hello %@ %@', ['John', 'Doe']), 'Hello John Doe');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('Hello %@ %@'.fmt('John', 'Doe'), 'Hello John Doe');
      }
    });

    test("'Hello %@2 %@1'.fmt('John', 'Doe') => 'Hello Doe John'", function() {
      equal(fmt('Hello %@2 %@1', ['John', 'Doe']), 'Hello Doe John');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('Hello %@2 %@1'.fmt('John', 'Doe'), 'Hello Doe John');
      }
    });

    test("'%@08 %@07 %@06 %@05 %@04 %@03 %@02 %@01'.fmt('One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight') => 'Eight Seven Six Five Four Three Two One'", function() {
      equal(fmt('%@08 %@07 %@06 %@05 %@04 %@03 %@02 %@01', ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight']), 'Eight Seven Six Five Four Three Two One');

      if (Ember.EXTEND_PROTOTYPES) {
        equal('%@08 %@07 %@06 %@05 %@04 %@03 %@02 %@01'.fmt('One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'), 'Eight Seven Six Five Four Three Two One');
      }
    });

    test("'data: %@'.fmt({id: 3}) => 'data: {id: 3}'", function() {
      equal(fmt('data: %@', [{id: 3}]), 'data: {id: 3}');
      if (Ember.EXTEND_PROTOTYPES) {
        equal('data: %@'.fmt({id: 3}), 'data: {id: 3}');
      }
    });
  });