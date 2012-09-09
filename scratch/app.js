var http = require('http')
  , fs = require('fs')
  , util = require('util');

function log(message) {
  fs.appendFile('./log.txt', message);
}

var httpServer = http.createServer(function(request, response) {
  var message = util.format('served by: %d\n', process.pid);
  log(message);

  setTimeout(function() {
    response.writeHead(200);
    response.end("hello world by aaaaaaaaaaa" + process.pid + "\n");
  }, 60000);
});
httpServer.on('close', function() { log(util.format('closing http server: %d\n', process.pid)); });
httpServer.on('clientError', function() { log(util.format('client error: %d\n', process.pid)); });
httpServer.listen(3000, 'localhost');
log('http server is running on localhost:3000\n');
