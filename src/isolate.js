
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
  var _instQ = [];

  function onScriptLoad(e) {
    scriptCount--;
    if (scriptCount === 0) {
      return onDependenciesLoaded();
    }
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

    return isolation;
  }

  var isolation = {
    invoke: function(name, args) {

      if (!args) {
        args = [];
      }

      return (_container.contentWindow.window[name]).apply(_container.contentWindow.window, args);
    },

  };

  if (!config.deps) {
      return onDependenciesLoaded();
  } else {

    for (var k in config.deps) {
      var scr = document.createElement('script');
      scr.src = config.path + "/" + config.deps[k] + ".js";
      scr.async = false;
      scr.type = "text/javascript";
      scr.charset = "UTF-8";
      scr.setAttribute('data-dep', k);
      scr.setAttribute('data-isolation', _name);
      scr.addEventListener("load", onScriptLoad);
      // scr.addEventListener("error", this.onScriptError);
      scripts.push(scr);
      _container.contentDocument.head.appendChild(scr);
      scriptCount++;
    }

  }

  // return isolation with functions that add to queue when onDepLoaded is run
  // pick up queue items and .  Any time a function like .addScript, .. is
  // executed run blank prototype. Test this on js fiddle.

}
