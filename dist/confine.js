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
    container.setAttribute('id', name);
    return container;
  } else {
    throw "document is not defined";
  }

}

/*
@function createWebworkerIsolation
@
*/
function createWebworkerContainer(name) {
  throw "Webworker isolation not yet supported";
}

function createContainer(deps, type, name, script, success) {

  var container;

  if (type === containerType.iframe) {
    container = createIframeContainer(name);
  } else if (type === containerType.webworker) {
    container = createWebworkerContainer(name);
  } else {
    throw "container type not supported";
  }

  var isolation = createIsolation(deps, script, name, success);
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

  var isolation = createContainer(config.deps, config.type, config.name, script, success);
};


// amd support
if (typeof define === "function" && define.amd)
{
  define(confine);
} else {
  context.confine = confine;
}

})(this);
