var http = require('http');

var httpServer = http.createServer(function(request, response) {
  console.log('served by: %d', process.pid);
  response.writeHead(200);
  response.end("hello world\n");
});
httpServer.listen(3000, 'localhost');
console.log('http server is running on localhost:3000');
