'use strict';

var a;
(function(context) {

  var a = {

    version: "2.0.0",
    write: function(elem) {
      elem.innerHTML = "<div> version " + this.version  + "</div>";
    }

  };

  // this will create window.a
  context.a = a;

})(this);
