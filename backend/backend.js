#!/usr/bin/env node
'use strict';

var spawn = require('child_process').spawn;

var opt = {
  cwd: __dirname,
  env: (function() {
    process.env.NODE_PATH = '.';
    return process.env;
  }()),
  stdio: [process.stdin, process.stdout, process.stderr]
};

var app = spawn(process.execPath, ['bin/app.js'], opt);
