module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    concat: {
      dist: {
        src: ['src/start.js', 'src/util.js', 'src/isolate.js', 'src/container.js', 'src/end.js'],
        dest: 'dist/confine.js',
      },
    },
    // coveralls: {
    //   options: {
    //     // LCOV coverage file relevant to every target
    //     src: 'coverage-results/lcov.info',
    //
    //     // When true, grunt-coveralls will only print a warning rather than
    //     // an error, to prevent CI builds from failing unnecessarily (e.g. if
    //     // coveralls.io is down). Optional, defaults to false.
    //     force: false
    //   },
    //   target: {
    //     // Target-specific LCOV coverage file
    //     src: 'coverage-results/extra-results-*.info'
    //   },
    // },
    mocha: {
      test: {
        src: [
          'spec/*.html'
        ],
        options: {
          run: false
        }
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'dist/confine.js',
        'spec/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  // grunt.loadNpmTasks('grunt-coveralls');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['concat', 'jshint', 'mocha']);

  grunt.registerTask('default', ['test']);

};
