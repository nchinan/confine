'use strict';

var confine;
(function(context) {

var isolations = [];

var containerType = {
  iframe: 1,
  webworker: 2
};


function parseContainerType(name) {

  var num = 1;

  if (!name || typeof name !== "string") {
    return num;
  }

  switch (name) {
    case "iframe":
      num = 1;
      break;
    case "webworker":
      num = 2;
      break;
    default:
      num = 1;
  }

  return num;

}


/*
Checks if the configuration supplied is
valid and returns a valid object if not valid.
@function parseConfig
@param {Object} config
@returns {Object}
*/
function parseConfig(config) {

  config = config || {};

  if (!config.path) {
    config.path = "";
  }

  config.type = parseContainerType(config.type);

  return config;

}


/*
creates a new isolation and manages dependencies
@function createIsolation
@param {number} type
@param {string} name
*/
function createIsolation(config, script, success) {


  var scriptCount = 0;
  var scripts = [];
  var _name = config.name;
  var _container;
  var _success = success;
  var _target = config.target;
  var _params  = config.parameters;
  var _dependencies = config.deps;
  var userScript = script;

  function onScriptLoad(e) {
    scriptCount--;
    if (scriptCount === 0) {
      onDependenciesLoaded();
    }
  }
  
  function onDependenciesLoaded() {

    var deps = [],
        params = [],
        paramValues = [],
        wrappedScript,
        fun,
        key,
        successCallback = "; if (this.onUserScriptLoad) { this.onUserScriptLoad(); } ",
        depString = "",
        isolate = document.getElementById(_name + "_frame"),
        isolateDoc = isolate.contentDocument,
        isolateWindow = isolate.contentWindow.window;

    for(key in _dependencies) {
      deps.push("var " + key + " = this." + key + "; ");
    }

    depString = deps.join('');

    for(key in _params) {
      params.push(key);
      paramValues.push(_params[key]);
    }

    wrappedScript = depString + userScript + successCallback;
    params.push(wrappedScript);

    fun = Function.constructor.apply(context, params);
    fun.apply(isolateWindow, paramValues);

  }

  var isolation = {
    init: function(container) {
      _container = container;
      _container.onload = this.onContainerLoad;
      document.body.appendChild(_container);

    },
    onContainerLoad: function() {
      _container.contentWindow.window.onUserScriptLoad = success;
      for (var k in config.deps) {
        var script = document.createElement('script');
        script.src = config.path + "/" + config.deps[k] + ".js";
        script.async = false;
        script.type = "text/javascript";
        script.charset = "UTF-8";
        script.setAttribute('data-dep', k);
        script.setAttribute('data-isolation', _name);
        script.addEventListener("load", onScriptLoad);
        script.addEventListener("error", this.onScriptError);
        scripts.push(script);
        _container.contentDocument.head.appendChild(script);
        scriptCount++;
      }
    }
  };

  return isolation;
}


/*
@function createIframeContainer
Creates an iframe element but does not attach it to
the dom yet.
*/
function createIframeContainer(name) {

  if (document) {
    var container = document.createElement('iframe');
    container.style.display = "none";
    container.setAttribute('data-confine-isolation', name);
    container.setAttribute('id', name + "_frame");
    return container;
  } else {
    throw new Error("document is not defined");
  }

}

/*
@function createWebworkerIsolation
@
*/
function createWebworkerContainer(name) {
  throw new Error("Webworker isolation not yet supported");
}

function createContainer(config, script, success) {

  var container;

  if (config.type === 1) {
    container = createIframeContainer(config.name);
  } else if (config.type === 2) {
    container = createWebworkerContainer(config.name);
  } else {
    throw new Error("container type not supported");
  }

  var isolation = createIsolation(config, script, success);
  isolation.init(container);

  return isolation;

}


/*
The main function to create an isolation of a script
@function confine
@param {object} config
@param {url/string} script
@param {function} err
*/
confine = function(config, script, success, err) {

  config = parseConfig(config);

  // we now want to create a new isolation and add the
  // dependencies to a queue.  A new container is create
  // when this container is loaded

  var isolation = createContainer(config, script, success);
};


// amd support
if (typeof define === "function" && define.amd)
{
  define(confine);
} else {
  context.confine = confine;
}

})(this);
