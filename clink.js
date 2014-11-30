#!/usr/bin/env node

var subarg = require('subarg');
var fastpath = require('fastpath');
var isReadable = require('is-readable-stream');
var isWritable = require('is-writable-stream');
var resolve = require('resolve');
var through = require('through2');

var argv = subarg(process.argv.slice(2));

var modules = argv._;

handlers = modules.map(function (spec) {
    var mod;
    if (spec.r) {
        mod = require(resolve.sync(spec.r || spec.require, { basedir: process.cwd() }));
    }
    var path = spec.p || spec.path;
    if (path) {
        mod = fastpath(path).evaluate(mod || global)[0];
    }
    var args = spec.a || spec.args || [];
    return isReadable(mod.prototype) || isWritable(mod.prototype) ? construct(mod, args) : mod;
});

handlers.unshift(process.stdin);
handlers.push(process.stdout);

handlers.reduce(function (a, e) {
    var source = sourceify(a);
    var sink = sinkify(e, source._readableState.objectMode);
    return source.pipe(sink);
});

function sourceify(e) {
    if (isReadable(e)) {
        return e;
    } else {
        throw "can't handle readable " + e;
    }

    return e;
}

function sinkify(e, objectMode) {
    if (isWritable(e)) {
        return e;
    } else if (e.parse && !objectMode) {
        var l = [];
        var parser = through(function (chunk, enc, cb) {
            l.push(chunk.toString());
            cb();
        }, function (cb) {
            this.push(e.parse(l.join('')));
            cb();
        });
        parser._readableState.objectMode = true;
        return parser;
    } else if (e.stringify && objectMode) {
        var stringifier = through(function (chunk, enc, cb) {
            this.push(e.stringify(chunk));
        });
        stringifier._writableState.objectMode = true;

        return stringifier;
    } else {
        throw "can't handle writable " + e;
    }
}

function construct(constructor, args) {
    function F() {
        return constructor.apply(this, args);
    }
    F.prototype = constructor.prototype;
    return new F();
}
