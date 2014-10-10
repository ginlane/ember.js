define("ember-metal/tests/chains_test",
  ["ember-metal/utils","ember-metal/observer","ember-metal/chains","ember-metal/platform"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__) {
    "use strict";
    var META_KEY = __dependency1__.META_KEY;
    var addObserver = __dependency2__.addObserver;
    var finishChains = __dependency3__.finishChains;
    var create = __dependency4__.create;

    module("Chains");

    test("finishChains should properly copy chains from prototypes to instances", function() {
      function didChange() {}

      var obj = {};
      addObserver(obj, 'foo.bar', null, didChange);

      var childObj = create(obj);
      finishChains(childObj);

      ok(obj[META_KEY].chains !== childObj[META_KEY].chains, "The chains object is copied");
    });
  });