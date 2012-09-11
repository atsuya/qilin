/**
 * qilin
 * Copyright(c) 2012 Atsuya Takagi <atsuya.takagi@gmail.com>
 * MIT Licensed
 */
var fs = require('fs')
  , os = require('os')
  , async = require('async')
  , http = require('http');

var helper = require('./support/helper')
  , Qilin = require(global.test.root + '/lib/qilin');

describe('Qilin', function() {
  var codeBefore = [
          "var http = require('http');"
        , "var httpServer = http.createServer(function(request, response) {"
        , "response.writeHead(200);"
        , "response.end('hello');"
        , "});"
        , "httpServer.listen(3001, 'localhost');"
      ]
    , codeAfter = [
          "var http = require('http');"
        , "var httpServer = http.createServer(function(request, response) {"
        , "response.writeHead(200);"
        , "response.end('world');"
        , "});"
        , "httpServer.listen(3001, 'localhost');"
      ]
    , filename = os.tmpDir() + 'qilin-reload.js'
    , options = {
          host: 'localhost'
        , port: 3001
        , path: '/'
        , method: 'GET'
        , headers: {
            'Connection': 'close'
          }
      };

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
        callback(null, data);
      });
    });
    request.end();
  }

  it('reloads the worker file with #reload', function(done) {
    var qilin = new Qilin(
        { exec: filename, args: [], silent: false }
      , { workers: 3 }
    );
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
              qilin.reload(true, callback);
            }
          , function(callback) {
              makeRequest(options, function(error, response) {
                response.trim().should.eql('world');
                callback(error);
              });
            }
          , function(callback) {
              qilin.shutdown(true, callback);
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
    var qilin = new Qilin(
        { exec: filename, args: [], silent: false }
      , { workers: 3 }
    );
    qilin.on('reload', function() {
      async.series([
              function(callback) {
                makeRequest(options, function(error, response) {
                  response.trim().should.eql('world');
                  callback(error);
                });
              }
            , function(callback) {
                qilin.shutdown(true, callback);
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
