define("ember-runtime/tests/core/compare_test",
  ["ember-metal/utils","ember-runtime/system/object","ember-runtime/compare"],
  function(__dependency1__, __dependency2__, __dependency3__) {
    "use strict";
    var typeOf = __dependency1__.typeOf;
    var EmberObject = __dependency2__["default"];
    var compare = __dependency3__["default"];

    // test parsing of query string
    var v = [];
    module("Ember.compare()", {
      setup: function() {
        // setup dummy data
        v[0]  = null;
        v[1]  = false;
        v[2]  = true;
        v[3]  = -12;
        v[4]  = 3.5;
        v[5]  = 'a string';
        v[6]  = 'another string';
        v[7]  = 'last string';
        v[8]  = [1,2];
        v[9]  = [1,2,3];
        v[10] = [1,3];
        v[11] = {a: 'hash'};
        v[12] = EmberObject.create();
        v[13] = function (a) {return a;};
        v[14] = new Date('2012/01/01');
        v[15] = new Date('2012/06/06');
      }
    });


    // ..........................................................
    // TESTS
    //

    test("ordering should work", function() {
      for (var j=0; j < v.length; j++) {
        equal(compare(v[j],v[j]), 0, j +' should equal itself');
        for (var i=j+1; i < v.length; i++) {
          equal(compare(v[j],v[i]), -1, 'v[' + j + '] (' + typeOf(v[j]) + ') should be smaller than v[' + i + '] (' + typeOf(v[i]) + ')' );
        }

      }
    });
  });