'use strict';

describe('Container', function() {

  describe('iframe container', function() {


    it('should create iframe node', function(done) {

      assert.ok(document);
      var node = createIframeContainer("container");
      expect(node.tagName).to.equal('IFRAME');
      expect(node.getAttribute('id')).to.equal('container_frame');
      done();

    });

  });

  describe('web worker container', function() {

    it('should throw excpetion', function(done) {

      var message = "Webworker isolation not yet supported";
      expect(function() {

          createContainer({
            type: null,
            path: 2,
            name: "container",
            deps: null
          });
      }).to.throw(Error);
      done();

    });

  });

  describe('invalid container', function() {

    it('should throw excpetion', function(done) {

      var message = "Webworker isolation not yet supported";
      expect(function() {
          createContainer({
            type: null,
            path: 2,
            name: "container",
            deps: null
          });
      }).to.throw(Error);
      done();

    });

  });

});
