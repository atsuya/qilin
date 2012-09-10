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
    , options = {
          host: 'localhost'
        , port: 3001
        , path: '/'
        , method: 'GET'
      }
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

  function makeRequest(options, callback) {
    var request = http.request(options, function(response) {
      var data = '';
      response.on('data', function(chunk) {
        data += chunk;
      });
      response.on('end', function() {
        console.log('response: ' + data);
        callback(null, data);
      });
    });
    request.end();
  }

  it('reloads the worker file with #reload', function(done) {
    async.series([
            function(callback) {
              qilin.start(callback);
            }
          , function(callback) {
              makeRequest(options, function(error, response) {
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
              makeRequest(options, function(error, response) {
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

  it('reloads the worker file with SIGUSR2', function(done) {
    qilin.on('reload', function() {
      console.log('CALLED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      async.series([
              function(callback) {
                makeRequest(options, function(error, response) {
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
    async.series([
            function(callback) {
              qilin.start(callback);
            }
          , function(callback) {
              makeRequest(options, function(error, response) {
                response.trim().should.eql('hello');
                callback(error);
              });
            }
          , function(callback) {
              writeFile(filename, codeAfter.join(''), callback);
            }
        ]
      , function(error, results) {
          if (error) {
            throw error;
          }
          process.kill(qilin.pid, 'SIGUSR2');
        }
    );
  });
});
