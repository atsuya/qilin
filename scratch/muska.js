var cluster = require('cluster')
  , childProcess = require('child_process')
  , fs = require('fs')
  , util = require('util');

function log(message) {
  fs.appendFile('master.txt', message);
}

function fork() {
  for(var index = 0; index < 3; index++) {
    cluster.fork();
  }
}

function workers() {
  log('workers:\n');
  for (var id in cluster.workers) {
    var worker = cluster.workers[id];
    log(util.format('\t%d: %d\n', worker.id, worker.process.pid));
  }
}

cluster.setupMaster({
    exec : './app.js'
  , args : []
  , silent : false
});

fork();

cluster.on('exit', function(worker, code, signal) {
  log('worker ' + worker.process.pid + ' died\n');
  if (!worker.suicide) {
    log('since it was not a suicide, let it reborn!\n');
    cluster.fork();
  }
});

process.on('SIGUSR2', function() {
  log('got SIGUSR2. killing those.\n');
  workers();
  //cluster.disconnect(function() {
  //  log('all killed\n');
  //});
  for (var id in cluster.workers) {
    var worker = cluster.workers[id];
    worker.destroy();
  }
  //spawn('node', ['muska.js'], { cwd: __dirname });
  //childProcess.execFile('node', ['muska.js'], { cwd: __dirname });

  fork();
  log('forked\n');
});

process.on('SIGUSR1', function() {
  workers();
});
