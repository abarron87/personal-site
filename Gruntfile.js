module.exports = function(grunt) {
    // Load all NPM grunt tasks
    require('matchdep').filterAll('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration
    grunt.initConfig({

        meta: {
            scripts: [
                'js/**/*.js',
                'js/*.js'
            ],
            styles: [
                'less/**/*.less'
            ]
        },

        less: {
            dev: {
                files: {
                    'dev/styles.css': 'less/styles.less'
                }
            },
            live: {
                files: {
                    'live/styles.css': 'less/styles.less'
                }
            }
        },

        // Concatenate files
        concat: {
            dev: {
                files: {
                    'dev/styles.css': ['dev/styles.css'],
                    'dev/app.js': ['js/*.js'],
                    'dev/vendor.js': ['js/vendor/*.js']
                }
            },
            live: {
                files: {
                    'live/styles.css': ['live/styles.css'],
                    'live/app.js': ['<%= meta.scripts %>']
                }
            },
            demo: {
                files: {
                    'work/auto-suggest/angular/js/demo.js': ['work/auto-suggest/angular/js/app.js','work/auto-suggest/angular/js/controllers.js','work/auto-suggest/angular/js/directives.js','work/auto-suggest/angular/js/filters.js','work/auto-suggest/angular/js/services.js'],
                    'work/auto-suggest/backbone/js/demo.js': ['work/auto-suggest/backbone/js/categoryMapBuilder.js','work/auto-suggest/backbone/js/app.js','work/auto-suggest/backbone/js/collections.js','work/auto-suggest/backbone/js/models.js','work/auto-suggest/backbone/js/views.js']
                }
            }
        },

        autoprefixer: {
            dev: {
                options: {
                    browsers: ['last 8 version','ie 8', 'ie 9']
                },
                no_dest: {
                    src: 'dev/styles.css'
                }
            },
            live: {
                single_file: {
                    src: 'live/styles.css',
                    dest: 'live/styles.css'
                }
            }
        },

        postcss: {
            dev: {
                options: {
                    processors: [
                        require('autoprefixer-core')({browsers: 'last 1 version'}).postcss
                    ]
                },
                dist: {
                    src: 'dev/styles.css'
                }
            }
        },


        // Minify CSS files
        cssmin: {
            live: {
                files: {
                    'live/styles.min.css': ['live/styles.css']
                }
            }
        },

        // Minify JS files
        uglify: {
            live: {
                files: {
                    'live/app.min.js': ['live/app.js']
                }
            },
            demo: {
                files: {
                    'work/auto-suggest/angular/js/demo.min.js': ['work/auto-suggest/angular/js/demo.js'],
                    'work/auto-suggest/backbone/js/demo.min.js': ['work/auto-suggest/backbone/js/demo.js']
                }
            }
        },

        // Watch files for changes
        watch: {
            scripts: {
                files: ['<%= meta.scripts %>'],
                tasks: ['concat:dev']
            },
            styles: {
                files: ['<%= meta.styles %>'],
                tasks: ['less:dev','concat:dev']
            },
            svgs: {
                files: ['svgs/*.svg'],
                tasks: ['svgstore', 'shell:jekyllBuild']
            }
        },

        // Clean target directories
        clean: {
            dev: ['dev'],
            liveTemp: [
                'live/main.css',
                'live/styles.css',
                'live/app.js'
            ],
            all: ['dev', 'live']
        },

        // Run Jekyll commands
        jekyll: {
            dev: {
                options: {
                    serve: true,
                    // Add the --watch flag, i.e. relive on file changes
                    watch: true
                }
            },
            live: {
                options: {
                    serve: true
                }
            }
        },

        svgstore: {
            options: {
                prefix : 'shape-', // This will prefix each <g> ID
                svg: {
                    class: 'hide'
                }
            },
            default: {
                files: {
                    '_includes/svg-defs.svg': ['svgs/*.svg']
                }
            }
        },

        shell: {
            jekyllBuild: {
                command: 'jekyll build'
            }
        }//,

//        browserSync: {
////            dev: {
//                default_options: {
//                    bsFiles: {
//                        src: [
//                            "dev/*.css",
//                            "*.html"
//                        ]
//                    },
//                    options: {
//                        proxy: 'localhost:4000'
//                    }
//                }
////            }
//        }

    });

    // Compile JS & CSS, run watch to recompile on change
    grunt.registerTask('dev', function() {
        // Rebuild './dev'
        grunt.task.run([
            'clean:dev',
            'less:dev',
            'svgstore',
            'concat:dev'
        ]);

//        grunt.task.run('browserSync');
        // Watch for changes
        grunt.task.run('watch');
    });

    grunt.registerTask('demo', function(){
        grunt.task.run([
            'concat:demo',
            'uglify:demo'
        ]);
    });

    // Alias to `grunt jekyll:dev`
    grunt.registerTask('server', 'jekyll:dev');

    // Run Jekyll live with environment set to production
    grunt.registerTask('jekyll-live', function() {
        grunt.log.writeln('Setting environment variable JEKYLL_ENV=production');
        process.env.JEKYLL_ENV = 'production';
        grunt.task.run('jekyll:live');
    });

    // Compile and minify JS & CSS, run Jekyll live for production
    grunt.registerTask('live', [
        'clean:all',
        'less:live',
        'svgstore',
        'concat:live',
        //'autoprefixer:dev',
        'cssmin',
        'uglify',
        'clean:liveTemp',
        'jekyll-live'
    ]);

    grunt.registerTask('default', ['dev']);

};
