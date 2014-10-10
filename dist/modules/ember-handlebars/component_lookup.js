define("ember-handlebars/component_lookup",
  ["ember-runtime/system/object","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var EmberObject = __dependency1__["default"];

    var ComponentLookup = EmberObject.extend({
      lookupFactory: function(name, container) {

        container = container || this.container;

        var fullName = 'component:' + name,
            templateFullName = 'template:components/' + name,
            templateRegistered = container && container.has(templateFullName);

        if (templateRegistered) {
          container.injection(fullName, 'layout', templateFullName);
        }

        var Component = container.lookupFactory(fullName);

        // Only treat as a component if either the component
        // or a template has been registered.
        if (templateRegistered || Component) {
          if (!Component) {
            container.register(fullName, Ember.Component);
            Component = container.lookupFactory(fullName);
          }
          return Component;
        }
      }
    });

    __exports__["default"] = ComponentLookup;
  });