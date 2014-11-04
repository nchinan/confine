
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
