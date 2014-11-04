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
function createIsolation(config, script, callbacks) {


  var scriptCount = 0;
  var scripts = [];
  var _name = config.name;
  var _container;
  var _target = config.target;
  var _params  = config.parameters;
  var _dependencies = config.deps;
  var _script = script;
  var _callbacks = callbacks;

  function onScriptLoad(e) {
    scriptCount--;
    if (scriptCount === 0) {
      onDependenciesLoaded();
    }
  }

  function attachCallbacks(callbacks, isolate) {

    var func,
        isolateWindow = isolate.contentWindow.window;

    for(var i = 0; i < callbacks.length; i++) {
      for(func in callbacks[i]) {
        if (!isolateWindow[func]) {
          isolateWindow[func] = callbacks[i][func];
        }
      }
    }

  }

  function getVarsFromArray(vars) {
    var arr = [],
      key;

    for (var i = 0; i < vars.length; i++) {
      for (key in vars[i]) {
        arr.push("var " + key + " = this." + key + "; ");
      }
    }

    return arr.join('');
  }

  function getVarsFromObject(vars) {
    var arr = [],
      key;

    for (key in vars) {
      arr.push("var " + key + " = this." + key + "; ");
    }

    return arr.join('');
  }

  function createScriptFunction(body, args) {
    var params = [],
        paramValues = [],
        fun;

    for(var key in args) {
      params.push(key);
      paramValues.push(args[key]);
    }

    params.push(body);
    fun = Function.constructor.apply(context, params);

    return [fun, paramValues];
  }

  function createStringSource(script, deps, parameters, callbacks, isolate) {
    var fun,
        paramValues,
        depVars = "",
        callVars = "",
        wrappedScript,
        scrFun,
        isolateWindow = isolate.contentWindow.window;

    if (deps) {
      depVars = getVarsFromObject(deps);
    }

    if (callbacks) {
      callVars = getVarsFromArray(callbacks);
      attachCallbacks(callbacks, isolate);
    }

    wrappedScript = depVars + callVars + script;
    scrFun = createScriptFunction(wrappedScript, parameters);
    fun = scrFun[0];
    paramValues = scrFun[1];
    fun.apply(isolateWindow, paramValues);

  }

  function createObjectSource(script, deps, callbacks, isolate) {

  }

  function createArraySource(script, deps, callbacks, isolate) {

  }

  function onDependenciesLoaded() {
    var isolate = document.getElementById(_name + "_frame"),
        scriptType = typeof _script;

    switch(scriptType) {
      case "string":
        createStringSource(_script,_dependencies,_params, _callbacks, isolate);
        break;
      case "object":
        createObjectSource(_script,_dependencies,_params, _callbacks, isolate);
        break;
      case "array":
        createArraySource(_script,_dependencies,_params, _callbacks, isolate);
        break;
      default:
        throw new Error("script must be an array, object or string");
    }

  }

  var isolation = {
    init: function(container) {
      _container = container;
      _container.onload = this.onContainerLoad;
      document.body.appendChild(_container);

    },
    onContainerLoad: function() {
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

function createContainer(config, script, callback) {

  var container;

  if (config.type === 1) {
    container = createIframeContainer(config.name);
  } else if (config.type === 2) {
    container = createWebworkerContainer(config.name);
  } else {
    throw new Error("container type not supported");
  }

  var isolation = createIsolation(config, script, callback);
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
confine = function(config, script, callback, err) {

  config = parseConfig(config);

  // we now want to create a new isolation and add the
  // dependencies to a queue.  A new container is create
  // when this container is loaded

  var isolation = createContainer(config, script, callback);
};


// amd support
if (typeof define === "function" && define.amd)
{
  define(confine);
} else {
  context.confine = confine;
}

})(this);
