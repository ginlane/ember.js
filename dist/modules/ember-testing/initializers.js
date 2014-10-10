define("ember-testing/initializers",
  ["ember-runtime/system/lazy_load"],
  function(__dependency1__) {
    "use strict";
    var onLoad = __dependency1__.onLoad;

    var name = 'deferReadiness in `testing` mode';

    onLoad('Ember.Application', function(Application) {
      if (!Application.initializers[name]) {
        Application.initializer({
          name: name,

          initialize: function(container, application){
            if (application.testing) {
              application.deferReadiness();
            }
          }
        });
      }
    });
  });