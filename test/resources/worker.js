/**
 * qilin
 * Copyright(c) 2012 Atsuya Takagi <atsuya.takagi@gmail.com>
 * MIT Licensed
 */
var http = require('http')
  , util = require('util');

var logging = require('../../lib/logging');

var httpServer = http.createServer(function(request, response) {
  response.writeHead(200);
  response.end('qilin test server');
});
httpServer.listen(3001, 'localhost');
logging.info(util.format('worker started: %d', process.pid));
