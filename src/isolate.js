
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
