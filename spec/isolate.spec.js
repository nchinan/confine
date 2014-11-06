'use strict';

describe('Isolate', function() {

  describe('var block', function() {

    it('should create from array', function(done) {

      var expected = "var a = this.a; var b = this.b; ";
      var actual = getVarsFromObject({
        a: undefined,
        b: undefined
      });

      expect(expected).to.equal(actual);

      done();

    });

    it('should create from array', function(done) {

      var expected = "var a = this.a; var b = this.b; ";
      var actual = getVarsFromArray([{
        a: undefined
      }, {
        b: undefined
      }]);

      expect(expected).to.equal(actual);

      done();

    });

  });

  describe('attach function', function() {

    var container;

    beforeEach(function(done) {

      container = document.createElement('iframe');
      container.setAttribute('id', 'contianer_frame');
      document.body.appendChild(container);

      done();

    });

    it('should add functions to container', function(done) {

      attachFunctions([{
        a: function() {}
      }, {
        b: function() {}
      }], container);

      assert.ok(container.contentWindow.window['a']);
      assert.ok(container.contentWindow.window['b']);

      done();
    });

    afterEach(function(done) {

      if (container) {
        document.body.removeChild(container);
      }

      done();

    });

  });

  describe('script function', function() {

    it('should create function/parameter array', function(done) {

      var expected = createScriptFunction("return a;", {
        a: 1
      });

      expect(expected[0].toString()[0]).to.equal('f');
      expect(expected[1][0]).to.equal(1);

      var ret = (expected[0]).apply(null, expected[1]);
      expect(ret).to.equal(1);

      done();

    });

  });

  describe('source function', function() {

    var container;

    beforeEach(function(done) {

      container = document.createElement('iframe');
      container.setAttribute('id', 'container_frame');
      document.body.appendChild(container);

      done();

    });

    it('should create from string', function(done) {

      var ret = createStringSource("return 1;", null, null, null,
        container);
      expect(1).to.equal(ret);

      done();

    });

    it('should create from object with attachment', function(done) {

      var ret = createObjectSource({
        attach: true,
        source: "return { a: function() { return 1;} }"
      }, null, null, null, container);

      assert.ok(container.contentWindow.window['a']);

      var val = (container.contentWindow.window['a']).apply(null, []);
      expect(1).to.equal(val);

      done();

    });

    afterEach(function(done) {

      if (container) {
        document.body.removeChild(container);
      }

      done();

    });

  });

  describe('invoke', function() {

    var container;

    beforeEach(function(done) {

      container = document.createElement('iframe');
      container.setAttribute('id', 'container_frame');
      done();
    });

    it('should return with no parameters', function(done) {

      var isolate = createIsolation({
          name: "container"
        }, {
          attach: true,
          source: "return { a: function() { return 1; } }"
        },
        null, container);

      var ret = isolate.invoke('a').then(
        function(ret) {
          expect(1).to.equal(ret);
          done();
        },
        function(err) {
          console.log(err);
          done();
        }
      );


    });

    it('should return no parameters with scripts', function(done) {

      var isolate = createIsolation({
          path: "lib",
          name: "container",
          deps: {
            a: "a/1.0/a",
          },
        }, {
          attach: true,
          source: "return { b: function() { return a.version; } }"
        },
        null, container);


      isolate.invoke('b').then(
        function(ret) {
          expect("1.0.0").to.equal(ret);
          done();
        },
        function(err) {
          expect(1).to.equal(2);
          done();
        }
      );

    });

    afterEach(function(done) {
      if (container) {
        document.body.removeChild(container);
      }

      done();

    });

  });

  describe('deferred dependency loading', function() {

    it('should know if script dependencies are loaded if it has any',
      function(done) {

        var scrDeps = ["a"],
          scrLoaded = ["a"];

        var expected = isScrDepsLoaded(scrDeps, scrLoaded);

        expect(expected).to.equal(true);

        done();

      });

    it('should know if script dependencies are loaded if it has none',
      function(done) {


        var scrDeps = [],
          scrLoaded = ["a"];

        var expected = isScrDepsLoaded(scrDeps, scrLoaded);

        expect(expected).to.equal(true);

        done();

      });

    it('should know if script dependencies aren\'t yet loaded',
      function(done) {


        var scrDeps = ["a"],
          scrLoaded = [];

        var expected = isScrDepsLoaded(scrDeps, scrLoaded);

        expect(expected).to.equal(false);

        done();

      });

    it(
      'should mark dependency as loaded and remove for dependent scripts',
      function(done) {

        var scrDeps = {
            "s": ["a"]
          },
          scrLoaded = [];

        var expected = unmarkScrDep("a", scrDeps, scrLoaded);

        expect(expected[0]["s"].length).to.equal(0);
        expect(expected[1][0]).to.equal("a");

        done();
      });



  });

});
