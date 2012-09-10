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

      qilin.shutdown(function(error) {
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
              qilin.shutdown(callback);
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
});
