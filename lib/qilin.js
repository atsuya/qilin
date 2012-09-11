/**
 * qilin
 * Copyright(c) 2012 Atsuya Takagi <atsuya.takagi@gmail.com>
 * MIT Licensed
 */
var cluster = require('cluster')
  , EventEmitter = require('events').EventEmitter
  , util = require('util')
  , domain = require('domain')
  , underscore = require('underscore')
  , DoneCriteria = require('done-criteria');

var logging = require('./logging');

function Qilin(clusterArguments, qilinArguments) {
  EventEmitter.call(this);

  this.clusterArguments = underscore.extend(clusterArguments, {});
  this.qilinArguments = underscore.extend(qilinArguments, {});

  this.started = false;
  this.listeners = {};
  this.pid = null;
}

util.inherits(Qilin, EventEmitter);

Qilin.prototype.setUp = function() {
  this.setUpProcess();
  this.setUpCluster();
  this.setUpSignalHandlers();
};

Qilin.prototype.setUpProcess = function() {
  this.pid = process.pid;
};

Qilin.prototype.setUpCluster = function() {
  var self = this;

  logging.debug('setting cluster settings');
  cluster.setupMaster(self.clusterArguments);

  var listener = function(worker, code, signal) {
    logging.info(util.format('Worker[%d] died: %d', worker.id, worker.process.pid));

    if (!worker.suicide) {
      logging.info('Since it was not a suicide, let it reborn!');
      cluster.fork();
      self.emit('worker.respawn');
    }
  };
  cluster.on('exit', listener);
  self.keepListener(cluster, 'exit', listener);
};

Qilin.prototype.setUpSignalHandlers = function() {
  var self = this;

  var sigusr2Listener = function() {
    self.reload(false);
  };
  process.on('SIGUSR2', sigusr2Listener);
  self.keepListener(process, 'SIGUSR2', sigusr2Listener);
};

Qilin.prototype.start = function(callback) {
  if (this.running()) {
    return callback(new Error('It has been started already'));
  }

  this.setUp();
  this.forkWorkers(callback);
};

Qilin.prototype.running = function() {
  return this.started;
};

Qilin.prototype.killWorkers = function(force, callback) {
  if (force) {
    for (var id in cluster.workers) {
      var worker = cluster.workers[id];
      cluster.workers[id].destroy();
    }
    if (callback) {
      return callback(null);
    }
  } else {
    cluster.disconnect(function() {
      if (callback) {
        return callback(null);
      }
    });
  }
};

Qilin.prototype.forkWorkers = function(callback) {
  var self = this
    , workers = self.qilinArguments.workers
    , doneCriteria = new DoneCriteria(workers, function() {
        cluster.removeListener('listening', listener);
        if (callback) {
          callback(null);
        }
      })
    , listener = function(worker) {
        logging.info(util.format('Worker[%d] is up: %d', worker.id, worker.process.pid));
        doneCriteria.done();
      };

  cluster.on('listening', listener);

  //var forkDomain = domain.create();
  //forkDomain.on('error', function(error) {
  //  logging.info('Failed to start new workers.');
  //  logging.debug(util.inspect(error));
  //
  //  // TODO: emitting to 'error' might be too general. more specific error?
  //  self.emit('error', new Error('Failed to start new workers'));
  //});
  //forkDomain.run(function() {
  //  for (var index = 0; index < workers; index++) {
  //    logging.debug('forking');
  //    cluster.fork();
  //  }
  //});
  for (var index = 0; index < workers; index++) {
    logging.debug('forking');
    cluster.fork();
  }
};

Qilin.prototype.shutdown = function(force, callback) {
  logging.info('Shutting down');

  // TODO: catch potential error and call callback with it
  var self = this
    , doneCriteria = new DoneCriteria(Object.keys(cluster.workers), function() {
        self.cleanUp(function(error) {
          if (callback) {
            callback(error);
          }
        });
      })
    , listener = function(worker, code, signal) {
        doneCriteria.done(worker.id.toString());
      };
  cluster.on('exit', listener);
  self.keepListener(cluster, 'exit', listener);

  self.killWorkers(force);
};

Qilin.prototype.keepListener = function(target, event, listener) {
  if (!this.listeners.hasOwnProperty(event)) {
    this.listeners[event] = [];
  }
  this.listeners[event].push({ target: target, listener: listener });
};

Qilin.prototype.cleanUp = function(callback) {
  var self = this;

  Object.keys(self.listeners).forEach(function(event) {
    self.listeners[event].forEach(function(entry) {
      logging.debug(util.format('Removing a listener: %s', event));
      entry.target.removeListener(event, entry.listener);
    });
  });
  this.listeners = {};

  this.started = false;

  return callback(null);
};

Qilin.prototype.reload = function(force, callback) {
  var self = this;

  logging.info('Killing all workers');
  // it will try to kill them gracefully so this may take time. so i don't
  // wait until they are all killed.
  self.killWorkers(force);

  logging.info('forking new workers');
  self.forkWorkers(function(error) {
    self.emit('reload');
    if (callback) {
      return callback(error);
    }
  });
};

module.exports = Qilin;
