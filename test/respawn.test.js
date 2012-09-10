var cp = require('child_process');

var helper = require('./support/helper')
  , Qilin = require(global.test.root + '/lib/qilin');

describe('Qilin', function() {
  var qilin;

  beforeEach(function(done) {
    qilin = new Qilin(
        {
            exec: global.test.testRoot + '/resources/worker.js'
          , args: []
          , silent: false
        }
      , {
            workers: 3
        }
    );
    qilin.on('error', function(error) {
      throw error;
    });
    qilin.start(function(error) {
      if (error) {
        throw error;
      }
      done();
    });
  });

  afterEach(function(done) {
    qilin.shutdown(function(error) {
      if (error) {
        throw error;
      }
      done();
    });
  });

  it('respawns killed process', function(done) {
    qilin.on('worker.respawn', function() {
      done();
    });

    cp.exec('ps axu | grep worker.js', function(error, stdout, stderr) {
      if (error) {
        throw error;
      }

      var lines = stdout.split('\n');
      lines = lines.filter(function(line) {
        return line.indexOf('node') !== -1;
      });
      var values = lines[0].split(' ');
      values = values.filter(function(value) {
        return value.trim() !== '';
      });
      var pid = parseInt(values[1], 10);

      process.kill(pid);
    });
  });
});
