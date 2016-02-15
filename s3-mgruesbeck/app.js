var Metalsmith = require('metalsmith');
var markdown = require('metalsmith-markdown');
var layouts = require('metalsmith-layouts');
var collections = require('metalsmith-collections');
var permalinks = require('metalsmith-permalinks');
var browserSync = require('metalsmith-browser-sync');
var handlebars = require('handlebars');
var fs = require('fs');

handlebars.registerPartial('header', fs.readFileSync(__dirname + '/src/templates/header.hbt').toString());
handlebars.registerPartial('footer', fs.readFileSync(__dirname + '/src/templates/footer.hbt').toString());

Metalsmith(__dirname)
    .use(markdown())
    .use(permalinks({
        pattern: 'articles/:title'
    }))
    .use(collections({
        articles: {
            pattern: 'articles/*.md',
            sortBy: 'date',
            reverse: true
        }
    }))
    .use(layouts({
        engine: 'handlebars',
        directory: 'src/templates'
    }))
    .use(browserSync({
        server: 'build',
        files: ['src/**/*.md', 'src/**/*.css', 'templates/**/*.hbt']
    }))
    .destination('./build')
    .build(function(err) {
        if (err) throw err;
        console.log('Build finished!');
    });
