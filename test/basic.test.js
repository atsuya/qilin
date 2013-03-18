/**
 * qilin
 * Copyright(c) 2012 Atsuya Takagi <atsuya.takagi@gmail.com>
 * MIT Licensed
 */
var cp = require('child_process')
  , async = require('async');

var helper = require('./support/helper')
  , Qilin = require(global.test.root + '/lib/qilin');

describe('Qilin', function() {
  var clusterArguments = {
      exec: global.test.testRoot + '/resources/worker.js'
    , args: []
    , silent: false
  };

  it('starts up and shuts down correctly', function(done) {
    var qilin = new Qilin(clusterArguments, { workers: 3 });
    qilin.on('error', function(error) {
      throw error;
    });
    qilin.start(function(error) {
      if (error) {
        throw error;
      }

      qilin.shutdown(true, function(error) {
        if (error) {
          throw error;
        }
        done();
      });
    });
  });

  it('starts up with specified number of workers', function(done) { 
    var workers = 5
      , qilin = new Qilin(clusterArguments, { workers: workers })
      , command = 'ps axu | grep worker.js | wc -l';

    async.series([
            function(callback) {
              cp.exec(command, function(error, stdout, stderr) {
                var workers = parseInt(stdout.trim());
                callback(error, workers);
              });
            }
          , function(callback) {
              qilin.start(callback);
            }
          , function(callback) {
              cp.exec(command, function(error, stdout, stderr) {
                var workers = parseInt(stdout.trim());
                callback(error, workers);
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

          results[2].should.eql(results[0] + workers);
          done();
        }
    );
  });

  it('has appropriate process titles', function(done) {
    var workers = 3
      , qilin = new Qilin(clusterArguments, { workers: workers })
      , commandForMaster = 'ps axu | grep "(master)" | wc -l'
      , commandForWorker = 'ps axu | grep "(worker)" | wc -l';

    async.series([
            function(callback) {
              qilin.start(callback);
            }
          , function(callback) {
              cp.exec(commandForMaster, function(error, stdout, stderr) {
                var workers = parseInt(stdout.trim());
                callback(error, workers);
              });
            }
          , function(callback) {
              cp.exec(commandForWorker, function(error, stdout, stderr) {
                var workers = parseInt(stdout.trim());
                callback(error, workers);
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

          console.dir(results);
          results[1].should.eql(1);
          results[2].should.eql(workers);
          done();
        }
    );
  });
});
