'use strict';

describe('Util', function() {

  describe('parse container type', function() {

    it('can parse container type when undefined', function(done) {

      var actual = parseContainerType(containerType);
      var expected = containerType.iframe;
      expect(expected).to.equal(actual);
      done();

    });

    it('can parse container type when iframe', function(done) {

      var containerType = "iframe";
      var actual = parseContainerType(containerType);
      var expected = 1;
      expect(expected).to.equal(actual);
      done();

    });

    it('can parse container type when web worker', function(done) {

      var containerType = "webworker";
      var actual = parseContainerType(containerType);
      var expected = 2;
      expect(expected).to.equal(actual);
      done();

    });

    it('returns iframe for invalid container type', function(done) {

      var containerType = "not_known";
      var actual = parseContainerType(containerType);
      var expected = 1;
      expect(expected).to.equal(actual);
      done();

    });

  });

  describe('parse config', function() {

    it('should return default when undefined', function(done) {

      var actual = parseConfig(undefined);
      var expected = {
        path: "",
        type: 1
      };
      expect(expected.path).to.equal(actual.path);
      expect(expected.type).to.equal(actual.type);

      done();
      
    });

  });

});
