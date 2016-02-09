var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var layouts = require('metalsmith-layouts');
var browserSync = require('metalsmith-browser-sync');

Metalsmith(__dirname)
    .use(markdown())
    .use(browserSync({
        server : "build",
        files  : ["src/**/*.md", "src/**/*.css", "templates/**/*.hjs"]
    }))
    .use(layouts({
        engine: 'hogan',
        directory: 'templates'}
        ))
    .destination('./build')
    .build(function(err) {
        if (err) throw err;
        console.log('Build finished!');
    });
