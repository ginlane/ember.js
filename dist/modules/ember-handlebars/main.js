define("ember-handlebars",
  ["ember-handlebars-compiler","ember-metal/core","ember-runtime/system/lazy_load","ember-handlebars/loader","ember-handlebars/ext","ember-handlebars/string","ember-handlebars/helpers/shared","ember-handlebars/helpers/binding","ember-handlebars/helpers/collection","ember-handlebars/helpers/view","ember-handlebars/helpers/unbound","ember-handlebars/helpers/debug","ember-handlebars/helpers/each","ember-handlebars/helpers/template","ember-handlebars/helpers/partial","ember-handlebars/helpers/yield","ember-handlebars/helpers/loc","ember-handlebars/controls/checkbox","ember-handlebars/controls/select","ember-handlebars/controls/text_area","ember-handlebars/controls/text_field","ember-handlebars/controls/text_support","ember-handlebars/controls","ember-handlebars/component_lookup","ember-handlebars/views/handlebars_bound_view","ember-handlebars/views/metamorph_view","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __dependency6__, __dependency7__, __dependency8__, __dependency9__, __dependency10__, __dependency11__, __dependency12__, __dependency13__, __dependency14__, __dependency15__, __dependency16__, __dependency17__, __dependency18__, __dependency19__, __dependency20__, __dependency21__, __dependency22__, __dependency23__, __dependency24__, __dependency25__, __dependency26__, __exports__) {
    "use strict";
    var EmberHandlebars = __dependency1__["default"];
    var Ember = __dependency2__["default"];
    // to add to globals

    var runLoadHooks = __dependency3__.runLoadHooks;
    var bootstrap = __dependency4__["default"];

    var normalizePath = __dependency5__.normalizePath;
    var template = __dependency5__.template;
    var makeBoundHelper = __dependency5__.makeBoundHelper;
    var registerBoundHelper = __dependency5__.registerBoundHelper;
    var resolveHash = __dependency5__.resolveHash;
    var resolveParams = __dependency5__.resolveParams;
    var getEscaped = __dependency5__.getEscaped;
    var handlebarsGet = __dependency5__.handlebarsGet;
    var evaluateUnboundHelper = __dependency5__.evaluateUnboundHelper;
    var helperMissingHelper = __dependency5__.helperMissingHelper;
    var blockHelperMissingHelper = __dependency5__.blockHelperMissingHelper;


    // side effect of extending StringUtils of htmlSafe

    var resolvePaths = __dependency7__["default"];
    var bind = __dependency8__.bind;
    var _triageMustacheHelper = __dependency8__._triageMustacheHelper;
    var resolveHelper = __dependency8__.resolveHelper;
    var bindHelper = __dependency8__.bindHelper;
    var boundIfHelper = __dependency8__.boundIfHelper;
    var unboundIfHelper = __dependency8__.unboundIfHelper;
    var withHelper = __dependency8__.withHelper;
    var ifHelper = __dependency8__.ifHelper;
    var unlessHelper = __dependency8__.unlessHelper;
    var bindAttrHelper = __dependency8__.bindAttrHelper;
    var bindAttrHelperDeprecated = __dependency8__.bindAttrHelperDeprecated;
    var bindClasses = __dependency8__.bindClasses;

    var collectionHelper = __dependency9__["default"];
    var ViewHelper = __dependency10__.ViewHelper;
    var viewHelper = __dependency10__.viewHelper;
    var unboundHelper = __dependency11__["default"];
    var logHelper = __dependency12__.logHelper;
    var debuggerHelper = __dependency12__.debuggerHelper;
    var EachView = __dependency13__.EachView;
    var GroupedEach = __dependency13__.GroupedEach;
    var eachHelper = __dependency13__.eachHelper;

    var templateHelper = __dependency14__["default"];
    var partialHelper = __dependency15__["default"];
    var yieldHelper = __dependency16__["default"];
    var locHelper = __dependency17__["default"];


    var Checkbox = __dependency18__["default"];
    var Select = __dependency19__.Select;
    var SelectOption = __dependency19__.SelectOption;
    var SelectOptgroup = __dependency19__.SelectOptgroup;
    var TextArea = __dependency20__["default"];
    var TextField = __dependency21__["default"];
    var TextSupport = __dependency22__["default"];
    var TextSupport = __dependency22__["default"];
    var inputHelper = __dependency23__.inputHelper;
    var textareaHelper = __dependency23__.textareaHelper;var ComponentLookup = __dependency24__["default"];
    var _HandlebarsBoundView = __dependency25__._HandlebarsBoundView;
    var SimpleHandlebarsView = __dependency25__.SimpleHandlebarsView;
    var _SimpleMetamorphView = __dependency26__._SimpleMetamorphView;
    var _MetamorphView = __dependency26__._MetamorphView;
    var _Metamorph = __dependency26__._Metamorph;

    /**
    Ember Handlebars

    @module ember
    @submodule ember-handlebars
    @requires ember-views
    */

    // Ember.Handlebars.Globals
    EmberHandlebars.bootstrap = bootstrap;
    EmberHandlebars.template = template;
    EmberHandlebars.makeBoundHelper = makeBoundHelper;
    EmberHandlebars.registerBoundHelper = registerBoundHelper;
    EmberHandlebars.resolveHash = resolveHash;
    EmberHandlebars.resolveParams = resolveParams;
    EmberHandlebars.resolveHelper = resolveHelper;
    EmberHandlebars.get = handlebarsGet;
    EmberHandlebars.getEscaped = getEscaped;
    EmberHandlebars.evaluateUnboundHelper = evaluateUnboundHelper;
    EmberHandlebars.bind = bind;
    EmberHandlebars.bindClasses = bindClasses;
    EmberHandlebars.EachView = EachView;
    EmberHandlebars.GroupedEach = GroupedEach;
    EmberHandlebars.resolvePaths = resolvePaths;
    EmberHandlebars.ViewHelper = ViewHelper;
    EmberHandlebars.normalizePath = normalizePath;


    // Ember Globals
    Ember.Handlebars = EmberHandlebars;
    Ember.ComponentLookup = ComponentLookup;
    Ember._SimpleHandlebarsView = SimpleHandlebarsView;
    Ember._HandlebarsBoundView = _HandlebarsBoundView;
    Ember._SimpleMetamorphView = _SimpleMetamorphView;
    Ember._MetamorphView = _MetamorphView;
    Ember._Metamorph = _Metamorph;
    Ember.TextSupport = TextSupport;
    Ember.Checkbox = Checkbox;
    Ember.Select = Select;
    Ember.SelectOption = SelectOption;
    Ember.SelectOptgroup = SelectOptgroup;
    Ember.TextArea = TextArea;
    Ember.TextField = TextField;
    Ember.TextSupport = TextSupport;

    // register helpers
    EmberHandlebars.registerHelper('helperMissing', helperMissingHelper);
    EmberHandlebars.registerHelper('blockHelperMissing', blockHelperMissingHelper);
    EmberHandlebars.registerHelper('bind', bindHelper);
    EmberHandlebars.registerHelper('boundIf', boundIfHelper);
    EmberHandlebars.registerHelper('_triageMustache', _triageMustacheHelper);
    EmberHandlebars.registerHelper('unboundIf', unboundIfHelper);
    EmberHandlebars.registerHelper('with', withHelper);
    EmberHandlebars.registerHelper('if', ifHelper);
    EmberHandlebars.registerHelper('unless', unlessHelper);
    EmberHandlebars.registerHelper('bind-attr', bindAttrHelper);
    EmberHandlebars.registerHelper('bindAttr', bindAttrHelperDeprecated);
    EmberHandlebars.registerHelper('collection', collectionHelper);
    EmberHandlebars.registerHelper("log", logHelper);
    EmberHandlebars.registerHelper("debugger", debuggerHelper);
    EmberHandlebars.registerHelper("each", eachHelper);
    EmberHandlebars.registerHelper("loc", locHelper);
    EmberHandlebars.registerHelper("partial", partialHelper);
    EmberHandlebars.registerHelper("template", templateHelper);
    EmberHandlebars.registerHelper("yield", yieldHelper);
    EmberHandlebars.registerHelper("view", viewHelper);
    EmberHandlebars.registerHelper("unbound", unboundHelper);
    EmberHandlebars.registerHelper("input", inputHelper);
    EmberHandlebars.registerHelper("textarea", textareaHelper);

    // run load hooks
    runLoadHooks('Ember.Handlebars', EmberHandlebars);

    __exports__["default"] = EmberHandlebars;
  });