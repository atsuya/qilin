var fs = require('fs')
  , os = require('os')
  , async = require('async')
  , http = require('http');

var helper = require('./support/helper')
  , Qilin = require(global.test.root + '/lib/qilin');

describe('Qilin', function() {
  var codeBefore = [
          "var http = require('http')"
        , ", util = require('util');"
        , "var httpServer = http.createServer(function(request, response) {"
        , "response.writeHead(200);"
        , "response.end('hello');"
        , "});"
        , "httpServer.listen(3001, 'localhost');"
      ]
    , codeAfter = [
          "var http = require('http')"
        , ", util = require('util');"
        , "var httpServer = http.createServer(function(request, response) {"
        , "response.writeHead(200);"
        , "response.end('world');"
        , "});"
        , "httpServer.listen(3001, 'localhost');"
      ]
    , filename = os.tmpDir() + '/qilin-reload.js'
    , qilin = new Qilin(
          { exec: filename, args: [], silent: false }
        , { workers: 3 }
      );


  beforeEach(function(done) {
    writeFile(filename, codeBefore.join(''), function(error) {
      if (error) {
        throw error;
      }
      done();
    });
  });

  afterEach(function(done) {
    deleteFile(filename, function(error) {
      if (error) {
        throw error;
      }
      done();
    });
  });

  function writeFile(filename, code, callback) {
    fs.writeFile(filename, code, callback);
  }

  function deleteFile(filename, callback) {
    fs.unlink(filename, callback);
  }

  it('reloads the all workers', function(done) {
    var options = {
            host: 'localhost'
          , port: 3001
          , path: '/'
          , method: 'GET'
        }
      , makeRequest = function(callback) {
          var request = http.request(options, function(response) {
            var data = '';
            response.on('data', function(chunk) {
              data += chunk;
            });
            response.on('end', function() {
              callback(null, data);
            });
          });
          request.end();
        };

    async.series([
            function(callback) {
              qilin.start(callback);
            }
          , function(callback) {
              makeRequest(function(error, response) {
                response.trim().should.eql('hello');
                callback(error);
              });
            }
          , function(callback) {
              writeFile(filename, codeAfter.join(''), callback);
            }
          , function(callback) {
              qilin.reload(callback);
            }
          , function(callback) {
              makeRequest(function(error, response) {
                response.trim().should.eql('world');
                callback(error);
              });
            }
          , function(callback) {
              qilin.shutdown(callback);
            }
        ]
      , function(error, results) {
          if (error) {
            throw error;
          }
          done();
        }
    );
  });
});
