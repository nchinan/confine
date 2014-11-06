var a;
(function(context) {

  var _a = {

    version: "1.0.0",
    write: function(elem) {
      elem.innerHTML = "<div> version " + this.version + "</div>";
    }

  };

  // this will create window.a
  context.a = _a;

})(this);
