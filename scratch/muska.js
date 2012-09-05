var cluster = require('cluster')
  , childProcess = require('child_process');

cluster.setupMaster({
    exec : './app.js'
  , args : []
  , silent : false
});
for(var index = 0; index < 3; index++) {
  cluster.fork();
}

cluster.on('exit', function(worker, code, signal) {
  console.log('worker ' + worker.process.pid + ' died');
  if (!worker.suicide) {
    console.log('since it was not a suicide, let it reborn!');
    cluster.fork();
  }
});

process.on('SIGUSR2', function() {
  console.log('got SIGUSR2');
  cluster.disconnect(function() {
    console.log('all killed');
  });
  //spawn('node', ['muska.js'], { cwd: __dirname });
  childProcess.execFile('node', ['muska.js'], { cwd: __dirname });
});

console.log(__dirname);
