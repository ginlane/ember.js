define("ember-extension-support/tests/data_adapter_test",
  ["ember-metal/core","ember-metal/property_get","ember-metal/property_set","ember-metal/run_loop","ember-metal/observer","ember-runtime/system/object","ember-runtime/controllers/controller","ember-extension-support/data_adapter","ember-application/system/application","ember-application/system/resolver","ember-routing/ext/run_loop"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__) {
    "use strict";
    var Ember = __dependency1__["default"];
    var get = __dependency2__.get;
    var set = __dependency3__.set;
    var run = __dependency4__["default"];
    var addObserver = __dependency5__.addObserver;
    var removeObserver = __dependency5__.removeObserver;
    var EmberObject = __dependency6__["default"];
    var EmberController = __dependency7__.Controller;
    var EmberDataAdapter = __dependency8__["default"];
    var EmberApplication = __dependency9__["default"];
    var DefaultResolver = __dependency10__.DefaultResolver;

    // to create routerTransitions run loop queue

    var adapter, App, Model = EmberObject.extend();

    var DataAdapter = EmberDataAdapter.extend({
      detect: function(klass) {
        return klass !== Model && Model.detect(klass);
      }
    });

    module("Data Adapter", {
      setup:function() {
        run(function() {
          App = EmberApplication.create();
          App.toString = function() { return 'App'; };
          App.deferReadiness();
          App.__container__.register('data-adapter:main', DataAdapter);
        });
      },
      teardown: function() {
        run(function() {
          adapter.destroy();
          App.destroy();
        });
      }
    });

    test("Model types added with DefaultResolver", function() {
      App.Post = Model.extend();

      adapter = App.__container__.lookup('data-adapter:main');
      adapter.reopen({
        getRecords: function() {
          return Ember.A([1,2,3]);
        },
        columnsForType: function() {
          return [ { name: 'title', desc: 'Title'} ];
        }
      });

      run(App, 'advanceReadiness');

      var modelTypesAdded = function(types) {

        equal(types.length, 1);
        var postType = types[0];
        equal(postType.name, 'post', 'Correctly sets the name');
        equal(postType.count, 3, 'Correctly sets the record count');
        strictEqual(postType.object, App.Post, 'Correctly sets the object');
        deepEqual(postType.columns, [ {name: 'title', desc: 'Title'} ], 'Correctly sets the columns');
      };

      adapter.watchModelTypes(modelTypesAdded);
    });

    test("Model types added with custom container-debug-adapter", function() {
      var PostClass = Model.extend() ,
          StubContainerDebugAdapter = DefaultResolver.extend({
            canCatalogEntriesByType: function(type){
              return true;
            },
            catalogEntriesByType: function(type){
              return [PostClass];
            }
          });
      App.__container__.register('container-debug-adapter:main', StubContainerDebugAdapter);

      adapter = App.__container__.lookup('data-adapter:main');
      adapter.reopen({
        getRecords: function() {
          return Ember.A([1,2,3]);
        },
        columnsForType: function() {
          return [ { name: 'title', desc: 'Title'} ];
        }
      });

      run(App, 'advanceReadiness');

      var modelTypesAdded = function(types) {

        equal(types.length, 1);
        var postType = types[0];

        equal(postType.name, PostClass.toString(), 'Correctly sets the name');
        equal(postType.count, 3, 'Correctly sets the record count');
        strictEqual(postType.object, PostClass, 'Correctly sets the object');
        deepEqual(postType.columns, [ {name: 'title', desc: 'Title'} ], 'Correctly sets the columns');
      };

      adapter.watchModelTypes(modelTypesAdded);
    });

    test("Model Types Updated", function() {
      App.Post = Model.extend();

      adapter = App.__container__.lookup('data-adapter:main');
      var records = Ember.A([1,2,3]);
      adapter.reopen({
        getRecords: function() {
          return records;
        }
      });

      run(App, 'advanceReadiness');

      var modelTypesAdded = function() {
        run(function() {
          records.pushObject(4);
        });
      };

      var modelTypesUpdated = function(types) {

        var postType = types[0];
        equal(postType.count, 4, 'Correctly updates the count');
      };

      adapter.watchModelTypes(modelTypesAdded, modelTypesUpdated);

    });

    test("Records Added", function() {
      expect(8);
      var countAdded = 1;

      App.Post = Model.extend();

      var post = App.Post.create();
      var recordList = Ember.A([post]);

      adapter = App.__container__.lookup('data-adapter:main');
      adapter.reopen({
        getRecords: function() {
          return recordList;
        },
        getRecordColor: function() {
          return 'blue';
        },
        getRecordColumnValues: function() {
          return { title: 'Post ' + countAdded };
        },
        getRecordKeywords: function() {
          return ['Post ' + countAdded];
        }
      });

      var recordsAdded = function(records) {
        var record = records[0];
        equal(record.color, 'blue', 'Sets the color correctly');
        deepEqual(record.columnValues, { title: 'Post ' + countAdded }, 'Sets the column values correctly');
        deepEqual(record.searchKeywords, ['Post ' + countAdded], 'Sets search keywords correctly');
        strictEqual(record.object, post, 'Sets the object to the record instance');
      };

      adapter.watchRecords(App.Post, recordsAdded);
      countAdded++;
      post = App.Post.create();
      recordList.pushObject(post);
    });

    test("Observes and releases a record correctly", function() {
      var updatesCalled = 0;
      App.Post = Model.extend();

      var post = App.Post.create({ title: 'Post' });
      var recordList = Ember.A([post]);

      adapter = App.__container__.lookup('data-adapter:main');
      adapter.reopen({
        getRecords: function() {
          return recordList;
        },
        observeRecord: function(record, recordUpdated) {
          var self = this;
          var callback = function() {
            recordUpdated(self.wrapRecord(record));
          };
          addObserver(record, 'title', callback);
          return function() {
            removeObserver(record, 'title', callback);
          };
        },
        getRecordColumnValues: function(record) {
          return { title: get(record, 'title') };
        }
      });

      var recordsAdded = function() {
        set(post, 'title', 'Post Modified');
      };

      var recordsUpdated = function(records) {
        updatesCalled++;
        equal(records[0].columnValues.title, 'Post Modified');
      };

      var release = adapter.watchRecords(App.Post, recordsAdded, recordsUpdated);
      release();
      set(post, 'title', 'New Title');
      equal(updatesCalled, 1, 'Release function removes observers');
    });
  });