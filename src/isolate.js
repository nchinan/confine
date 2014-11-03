
/*
creates a new isolation and manages dependencies
@function createIsolation
@param {number} type
@param {string} name
*/
function createIsolation(deps, script, name, success) {


  var scriptCount = 0;
  var scripts = [];
  var _name = name;
  var _container;
  var _success = success;
  var userScript = script;

  function onScriptLoad(e) {
    scriptCount--;
    if (scriptCount === 0) {
      onDependenciesLoaded();
    }
  }


  function onDependenciesLoaded() {

    var isolate = document.getElementById(_name);

    var uScript = document.createElement('script');
    uScript.type = "text/javascript";
    uScript.charset = "UTF-8";

    var wrappedScript = userScript + '; this.onUserScriptLoad();';

    uScript.innerHTML = wrappedScript;
    isolate.contentDocument.head.appendChild(uScript);
  }

  var isolation = {
    init: function(container) {
      _container = container;
      _container.onload = this.onContainerLoad;
      document.body.appendChild(_container);

    },
    onContainerLoad: function() {
      _container.contentWindow.window.onUserScriptLoad = success;
      for (var k in deps) {
        var script = document.createElement('script');
        script.src = 'lib/' + deps[k] + ".js";
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
