define("ember-runtime/tests/mixins/copyable_test",
  ["ember-runtime/tests/suites/copyable","ember-runtime/mixins/copyable","ember-runtime/system/object","ember-metal/utils","ember-metal/property_set","ember-metal/property_get"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__) {
    "use strict";
    var CopyableTests = __dependency1__["default"];
    var Copyable = __dependency2__["default"];
    var EmberObject = __dependency3__["default"];
    var generateGuid = __dependency4__.generateGuid;
    var set = __dependency5__.set;
    var get = __dependency6__.get;

    var CopyableObject = EmberObject.extend(Copyable, {

      id: null,

      init: function() {
        this._super();
        set(this, 'id', generateGuid());
      },

      copy: function() {
        var ret = new CopyableObject();
        set(ret, 'id', get(this, 'id'));
        return ret;
      }
    });

    CopyableTests.extend({

      name: 'Copyable Basic Test',

      newObject: function() {
        return new CopyableObject();
      },

      isEqual: function(a, b) {
        if (!(a instanceof CopyableObject) || !(b instanceof CopyableObject)) return false;
        return get(a, 'id') === get(b,'id');
      }
    }).run();
  });