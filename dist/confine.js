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


function attachFunctions(callbacks, isolate) {

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

  if (args) {
    for(var key in args) {
      params.push(key);
      paramValues.push(args[key]);
    }
  }

  params.push(body);
  fun = Function.constructor.apply(context, params);

  return [fun, paramValues];
}

function createStringSource(script, deps, parameters, callbacks, container) {
  var fun,
      paramValues,
      depVars = "",
      callVars = "",
      wrappedScript,
      scrFun,
      containerWindow = container.contentWindow.window;

  if (deps) {
    depVars = getVarsFromObject(deps);
  }

  if (callbacks) {
    callVars = getVarsFromArray(callbacks);
    attachFunctions(callbacks, container);
  }

  wrappedScript = depVars + callVars + script;
  scrFun = createScriptFunction(wrappedScript, parameters);
  fun = scrFun[0];
  paramValues = scrFun[1];
  return fun.apply(containerWindow, paramValues);

}

function createObjectSource(script, deps, parameters, callbacks, container) {
  var attach = script.attach,
      source = script.source,
      fun,
      paramValues,
      depVars = "",
      callVars = "",
      wrappedScript,
      scrFun,
      funRet,
      containerWindow = container.contentWindow.window;

  if (deps) {
    depVars = getVarsFromObject(deps);
  }

  if (callbacks) {
    callVars = getVarsFromArray(callbacks);
    attachFunctions(callbacks, container);
  }

  wrappedScript = depVars + callVars + source;
  scrFun = createScriptFunction(wrappedScript, parameters);
  fun = scrFun[0];
  paramValues = scrFun[1];
  funRet = fun.apply(containerWindow, paramValues);

  if (attach) {
    attachFunctions([funRet], container);
  }

  return funRet;

}

function createArraySource(script, deps, callbacks, container) {

}

/*
creates a new isolation and manages dependencies
@function createIsolation
@param {number} type
@param {string} name
*/
function createIsolation(config, script, callbacks, container) {


  var scriptCount = 0;
  var scripts = [];
  var _name = config.name;
  var _target = config.target;
  var _params  = config.parameters;
  var _dependencies = config.deps;
  var _script = script;
  var _callbacks = callbacks;
  var _container = container;
  var _promiseQ = [];
  var _inAsync = false;

  function onScriptLoad(e) {
    console.log('onScriptLoad');
    scriptCount--;
    if (scriptCount === 0) {
      _inAsync = false;
      return onDependenciesLoaded();
    }
  }

  function onScriptError() {
    console.log(arguments);
  }

  function onDependenciesLoaded() {
    var scriptType = typeof _script;

    switch(scriptType) {
      case "string":
        createStringSource(_script,_dependencies,_params, _callbacks, _container);
        break;
      case "object":
        createObjectSource(_script,_dependencies,_params, _callbacks, _container);
        break;
      case "array":
        createArraySource(_script,_dependencies,_params, _callbacks, _container);
        break;
      default:
        throw new Error("script must be an array, object or string");
    }

    invokePromises();

  }

  function invokePromises() {
    while(_promiseQ.length > 0) {
      var promise = _promiseQ.pop();
      console.log((promise[0]).apply(_container.contentWindow.window, [promise[1], promise[2]]));
    }
  }

  var isolate = {
    invoke: function(name, args) {

        if (!args) {
          args = [];
        }

        var promise = {
          then: function(success, error) {
            if (!_inAsync) {
              try {
                var ret = (_container.contentWindow.window[name]).apply(_container.contentWindow.window, args);
                success(ret);
              } catch(err) {
                error();
              }
            } else {
              _promiseQ.push([this.then, success, error]);
            }
          }
        };

        return promise;
    },

  };

  if (!config.deps) {
      onDependenciesLoaded();
  } else {
    _inAsync = true;
    for (var k in config.deps) {
      var scr = document.createElement('script');
      scr.src = config.path + "/" + config.deps[k] + ".js";
      console.log(scr.src);
      scr.async = false;
      scr.type = "text/javascript";
      scr.charset = "UTF-8";
      scr.setAttribute('data-dep', k);
      scr.setAttribute('data-isolation', _name);
      scr.addEventListener("load", onScriptLoad);
      scr.addEventListener("error", onScriptError);
      scripts.push(scr);
      _container.contentDocument.head.appendChild(scr);
      scriptCount++;
    }

  }

  // return isolation with functions that add to queue when onDepLoaded is run
  // pick up queue items and .  Any time a function like .addScript, .. is
  // executed run blank prototype. Test this on js fiddle.

  return isolate;
}


/*
@function createIframeContainer
Creates an iframe element but does not attach it to
the dom yet.
*/
function createIframeContainer(name) {

  if (document) {

    var cb = function(e) {  };

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

  container.onload = function() {

    var isolation = createIsolation(config, script, callback, container);
    return isolation;
  };

  document.body.appendChild(container);

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
