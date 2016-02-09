var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var layouts = require('metalsmith-layouts');
var browserSync = require('metalsmith-browser-sync');
var handlebars = require('handlebars');
var fs = require('fs');

handlebars.registerPartial('header', fs.readFileSync(__dirname + '/templates/header.hbt').toString());
handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/templates/footer.hbt').toString());

Metalsmith(__dirname)
    .use(markdown())
    .use(browserSync({
        server : "build",
        files  : ["src/**/*.md", "src/**/*.css", "templates/**/*.hbt"]
    }))
    .use(layouts({
        engine: 'handlebars',
        directory: 'templates'}
        ))
    .destination('./build')
    .build(function(err) {
        if (err) throw err;
        console.log('Build finished!');
    });
