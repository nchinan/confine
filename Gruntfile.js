module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    concat: {
      dist: {
        src: ['src/start.js', 'src/util.js', 'src/isolate.js', 'src/container.js', 'src/end.js'],
        dest: 'dist/confine.js',
      },
    },
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

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('test', ['concat', 'jshint', 'mocha']);

  grunt.registerTask('default', ['test']);

};
