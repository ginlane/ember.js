define("ember-views/system/ext",
  ["ember-metal/run_loop"],
  function(__dependency1__) {
    "use strict";
    /**
    @module ember
    @submodule ember-views
    */

    var run = __dependency1__["default"];

    // Add a new named queue for rendering views that happens
    // after bindings have synced, and a queue for scheduling actions
    // that that should occur after view rendering.
    var queues = run.queues;
    run._addQueue('render', 'actions');
    run._addQueue('afterRender', 'render');
  });