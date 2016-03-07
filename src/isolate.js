function attachFunctions(callbacks, isolate) {

  var func,
    isolateWindow = isolate.contentWindow.window;

  for (var i = 0; i < callbacks.length; i++) {
    for (func in callbacks[i]) {
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
    for (var key in args) {
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

function isScrDepsLoaded(scrDeps, scrLoaded) {

  if (scrLoaded.length === 0) {
    return false;
  }

  // checks if a script has all its dependencies meet
  if (scrDeps.length > scrLoaded.length) {
    return false;
  }

  for (var i = 0; i < scrDeps.length; i++) {
    if (scrLoaded.indexOf(scrDeps[i]) === -1) {
      return false;
    }
  }

  return true;

}

function unmarkScrDep(dep, scriptDeps, scriptsLoaded) {

  // when a script is loaded we can mark it off the each script that
  // depends on it

  if (scriptsLoaded.indexOf(dep) === -1) {
    scriptsLoaded.push(dep);
  }

  for (var key in scriptDeps) {
    var index = scriptDeps[key].indexOf(dep);
    if (index !== -1) {
      scriptDeps[key].splice(index, 1);
    }
  }

  return [scriptDeps, scriptsLoaded];
}

/*
creates a new isolation and manages dependencies
@function createIsolation
@param {number} type
@param {string} name
*/
function createIsolation(config, script, callbacks, container, error) {


  var scriptCount = 0;
  var scripts = [];
  var _name = config.name;
  var _target = config.target;
  var _params = config.parameters;
  var _dependencies = config.deps;
  var _script = script;
  var _callbacks = callbacks;
  var _container = container;
  var _promiseQ = [];
  var _inAsync = true;
  var _scriptsLoaded = [];
  var _scriptDeps = {};
  var _errorCallback = error;

  function onScriptLoad(e) {
    try {
      // Former e.path approach was not cross-browser
      var depName = e.target.getAttribute('data-dep');

      scriptCount--;
      if (scriptCount === 0) {
        _inAsync = false;
        return onDependenciesLoaded();
      } else {
        if (_scriptDeps.length !== 0) {
          var ret = unmarkScrDep(depName, _scriptDeps, _scriptsLoaded);
          _scriptDeps = ret[0];
          _scriptsLoaded = ret[1];
          tryLoadDeferredScripts();
        }
      }
    } catch (err) {
      onScriptError(err);
    }
  }

  function onScriptError() {

    if (_errorCallback) {
      _errorCallback(arguments);
    }

  }

  function onDependenciesLoaded() {
    var scriptType = typeof _script;

    switch (scriptType) {
      case "string":
        createStringSource(_script, _dependencies, _params, _callbacks,
          _container);
        break;
      case "object":
        createObjectSource(_script, _dependencies, _params, _callbacks,
          _container);
        break;
      case "array":
        createArraySource(_script, _dependencies, _params, _callbacks,
          _container);
        break;
      default:
        throw new Error("script must be an array, object or string");
    }

    invokePromises();

  }

  function invokePromises() {
    while (_promiseQ.length > 0) {
      var promise = _promiseQ.pop();
      (promise[0]).apply(_container.contentWindow.window, [promise[1],
        promise[2]
      ]);
    }
  }

  var isolate = {
    invoke: function(name, args) {

      if (!args) {
        args = [];
      }

      var promise = {
        then: function(success, error) {
          _errorCallback = error;
          if (!_inAsync) {
            try {
              var ret = (_container.contentWindow.window[name]).apply(
                _container.contentWindow.window, args);
              success(ret);
            } catch (err) {
              error(err);
            }
          } else {
            _promiseQ.push([this.then, success, error]);
          }
        }
      };

      return promise;
  },
  destroy: function() {
    var parent = _container.parentNode;
    if (parent) {
      parent.removeChild(_container);
    }
  }

  };

  function tryLoadDeferredScripts() {

    // after a script is loaded we will check if we can load
    // any scripts that have been deferred due to dependency resolution

    for (var key in _scriptDeps) {
      if (_scriptDeps[key].length === 0) {
        var index = scripts.indexOf(key);
        if (index !== -1) {
          scripts.splice(index, 1);
          var scr = scripts.splice(index, 1);
          _container.contentDocument.head.appendChild(scr[0]);
        }
      }
    }

  }

  _container.onload = function() {
    if (!config.deps) {
      _inAsync = false;
      onDependenciesLoaded();
    } else {

      if (config.depend) {
        for (var d in config.depend) {
          _scriptDeps[d] = config.depend[d];
        }
      }

      for (var k in config.deps) {

        var scr = document.createElement('script');
        scr.src = config.path + "/" + config.deps[k] + ".js";
        scr.async = false;
        scr.type = "text/javascript";
        scr.charset = "UTF-8";
        scr.setAttribute('data-dep', k);
        scr.setAttribute('data-isolation', _name);
        scr.addEventListener("load", onScriptLoad);
        scr.addEventListener("error", onScriptError);
        scriptCount++;


        if (config.depend && config.depend[k] && !isScrDepsLoaded(config.depend[
            k], _scriptsLoaded)) {
          // console.log('deferring: ' + k);
          scripts.push(k);
          scripts.push(scr);
        } else {
          _scriptsLoaded.push(k);
          _container.contentDocument.head.appendChild(scr);
        }

      }
    }
  };

  document.body.appendChild(_container);

  return isolate;
}
