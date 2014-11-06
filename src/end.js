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

  return createContainer(config, script, callback, err);
};


// amd support
if (typeof define === "function" && define.amd) {
  define(confine);
} else {
  context.confine = confine;
}

})(this);
