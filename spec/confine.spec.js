'use strict';

describe("Confine", function() {
  describe("isolate tests", function() {
    var div;

    beforeEach(function(done) {

      div = document.createElement('div');
      div.setAttribute('id', 'write');
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
        " var elem = target; a.write(elem); onFinish();", [{
          "onFinish": function() {
            done();
          }
        }]);
    });

    it("should load javascript in isolate", function() {

      var wdiv = document.getElementById('write');
      expect(wdiv.innerHTML).to.equal('<div> version 1.0.0</div>');

    });

    afterEach(function(done) {
      if (div) {
        document.body.removeChild(div);
      }

      done();

    });

  });

  describe("dependency tests", function() {
    var div;

    beforeEach(function(done) {

      div = document.createElement('div');
      div.setAttribute('id', 'write');
      document.body.appendChild(div);
      done();
    });


    it('should load dependencies in order', function(done) {

      confine({
          type: "iframe",
          path: "lib",
          name: "svg_1_isolate",
          deps: {
            b: "b/1.0/b",
            a: "a/1.0/a"
          },
          depend: {
            "b": ["a"]
          },
          parameters: {
            target: document.getElementById('write')
          }
        },
        " var elem = target; a.write(elem); onFinish();", [{
          "onFinish": function() {
            done();
          }
        }],
        function(error) {
          console.log(error);
          done();
        });

    });


    afterEach(function(done) {
      if (div) {
        document.body.removeChild(div);
      }

      done();

    });

  });
});
