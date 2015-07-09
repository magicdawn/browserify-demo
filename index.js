var koa = require('koa');
var app = koa();
// var serve = require('koa-static');
var browserify = require('browserify');

/**
 * js
 *
 * 1. dev 环境
 *   global.json -> require bundle
 *   .js file -> 做browserify处理
 *
 * 2. production
 *   全build好
 */
app.use(function * (next) {
  var globals = require('./js/global.json');

  var b = browserify({
    basedir: __dirname + '/js'
  });

  if (this.path === '/js/global.js') {
    Object.keys(globals).forEach(function(file) {
      b.require(file, {
        expose: globals[file]
      });
    });

    this.type = 'js';
    this.status = 200;
    this.respond = false;
    b.bundle().pipe(this.res);

    // turn off koa's default respond
    return;
  } else if (this.path.indexOf('/js/page/') === 0) {
    var file = __dirname + this.path;
    b.add(file);

    var externals = Object.keys(globals).map(function(file) {
      return globals[file];
    });

    externals.forEach(function(m) {
      b.external(m);
    });

    this.type = 'js';
    this.status = 200;
    this.respond = false;
    b.bundle().pipe(this.res);
  } else {
    yield next;
  }
});

app.use(function * () {
  if (this.path === '/') {
    this.type = 'html';
    this.status = 200;
    this.body = require('fs').createReadStream(__dirname + '/public/index.html');
    return;
  } else {
    yield next;
  }
});

app.listen(3000);