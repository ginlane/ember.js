define("ember-runtime/tests/system/array_proxy/content_update_test",
  ["ember-metal/core","ember-metal/computed","ember-runtime/system/array_proxy"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var computed = __dependency2__.computed;
    var ArrayProxy = __dependency3__["default"];

    module("Ember.ArrayProxy - content update");

    test("The `contentArrayDidChange` method is invoked after `content` is updated.", function() {

      var proxy, observerCalled = false;

      proxy = ArrayProxy.createWithMixins({
        content: Ember.A(),

        arrangedContent: computed('content', function(key, value) {
          // setup arrangedContent as a different object than content,
          // which is the default
          return Ember.A(this.get('content').slice());
        }),

        contentArrayDidChange: function(array, idx, removedCount, addedCount) {
          observerCalled = true;
          return this._super(array, idx, removedCount, addedCount);
        }
      });

      proxy.pushObject(1);

      ok(observerCalled, "contentArrayDidChange is invoked");
    });
  });