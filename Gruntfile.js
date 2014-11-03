module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    mocha: {
      test: {
        src: [
          'spec/index.html'
        ],
        options: {
          run: false
        }
      }
    },
    jshint: {
      all: [
        'Gruntfile.js',
        'src/**/*.js',
        'spec/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['jshint', 'mocha']);

  grunt.registerTask('default', ['test']);

};
