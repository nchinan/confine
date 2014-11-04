
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
