
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
