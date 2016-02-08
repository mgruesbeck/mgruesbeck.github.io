var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var layouts = require('metalsmith-layouts');

Metalsmith(__dirname)
    .use(markdown())
    .use(layouts({
        engine: 'hogan',
        directory: 'templates'}
        ))
    .destination('./build')
    .build(function(err) {
        if (err) throw err;
        console.log('Build finished!');
    });
