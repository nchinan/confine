'use strict';

describe("Confine", function() {
  describe("isolate tests", function() {
    var div;

    beforeEach(function(done) {

      div = document.createElement('div');
      div.setAttribute('id','write');
      document.body.appendChild(div);


      var isolate1 = confine({
        type: "iframe",
        path: "lib",
        name: "svg_1_isolate",
        deps: {
          a: "a/1.0/a",
        },
        parameters: {
          target: document.getElementById('write')
        }
      },
      " var elem = target; console.log(elem); a.write(elem); ",
      function() {
        done();
      });
    });

    it("should load javascript in isolate", function() {

      var wdiv = document.getElementById('write');
      expect(wdiv.innerHTML).to.equal('<div> version 1.0.0</div>');

    });

    afterEach(function(done) {
      if (div) {
        document.body.removeChild(div);
      }

      if (window.confine) {
        window.confine = undefined;
      }

      done();

    });

  });
});
