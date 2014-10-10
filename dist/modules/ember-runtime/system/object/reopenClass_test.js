define("ember-runtime/tests/system/object/reopenClass_test",
  ["ember-metal/property_get","ember-runtime/system/object"],
  function(__dependency1__, __dependency2__) {
    "use strict";
    var get = __dependency1__.get;
    var EmberObject = __dependency2__["default"];

    module('system/object/reopenClass');

    test('adds new properties to subclass', function() {

      var Subclass = EmberObject.extend();
      Subclass.reopenClass({
        foo: function() { return 'FOO'; },
        bar: 'BAR'
      });

      equal(Subclass.foo(), 'FOO', 'Adds method');
      equal(get(Subclass, 'bar'), 'BAR', 'Adds property');
    });

    test('class properties inherited by subclasses', function() {

      var Subclass = EmberObject.extend();
      Subclass.reopenClass({
        foo: function() { return 'FOO'; },
        bar: 'BAR'
      });

      var SubSub = Subclass.extend();

      equal(SubSub.foo(), 'FOO', 'Adds method');
      equal(get(SubSub, 'bar'), 'BAR', 'Adds property');
    });
  });