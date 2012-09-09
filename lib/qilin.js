var cluster = require('cluster')
  , util = require('util')
  , domain = require('domain')
  , underscore = require('underscore')
  , DoneCriteria = require('done-criteria');

var logging = require('./logging');

function Qilin(clusterArguments, qilinArguments) {
  this.clusterArguments = underscore.extend({}, clusterArguments);
  this.qilinArguments = underscore.extend({}, qilinArguments);

  this.started = false;
  this.listeners = {};
}

Qilin.prototype.setUp = function() {
  this.setUpCluster();
  this.setUpSignalHandlers();
};

Qilin.prototype.setUpCluster = function() {
  cluster.setupMaster(this.clusterArguments);

  var listener = function(worker, code, signal) {
    logging.debug(util.format('Worker[%d] died: %d', worker.id, worker.process.pid));

    if (!worker.suicide) {
      logging.info('Since it was not a suicide, let it reborn!');
      cluster.fork();
    }
  };
  cluster.on('exit', listener);
  this.addListener('exit', listener);
};

Qilin.prototype.setUpSignalHandlers = function() {
};

Qilin.prototype.start = function(callback) {
  var self = this;

  if (self.running()) {
    return callback(new Error('It has been started already'));
  }

  self.setUp();

  var workers = self.qilinArguments.workers
    , doneCriteria = new DoneCriteria(workers, callback)
    , listener = function(worker) {
        logging.info(util.format('Worker[%d] is up: %d', worker.id, worker.process.pid));
        doneCriteria.done();
      };
  cluster.on('listening', listener);
  this.addListener('listening', listener);

  var forkDomain = domain.create();
  forkDomain.on('error', function(error) {
    logging.info('Failed to start the initial workers. Shutting down.');
    logging.debug(util.inspect(error));

    self.shutdown();
  });
  forkDomain.run(function() {
    for (var index = 0; index < workers; index++) {
      logging.debug('forking');
      cluster.fork();
    }
  });
};

Qilin.prototype.running = function() {
  return this.started;
};

Qilin.prototype.killWorkers = function(callback) {
  cluster.disconnect(function() {
    return callback(null);
  });
};

Qilin.prototype.shutdown = function(callback) {
  logging.info('Shutting down');

  var self = this
    , doneCriteria = new DoneCriteria(Object.keys(cluster.workers), function() {
        self.cleanUp(callback);
      })
    , listener = function(worker, code, signal) {
        doneCriteria.done(worker.id.toString());
      };
  cluster.on('exit', listener);
  this.addListener('exit', listener);

  this.killWorkers(function(error) {
    if (error) {
      throw error;
    }
  });
};

Qilin.prototype.addListener = function(event, listener) {
  if (!this.listeners.hasOwnProperty(event)) {
    this.listeners[event] = [];
  }
  this.listeners[event].push(listener);
};

Qilin.prototype.cleanUp = function(callback) {
  var self = this;

  Object.keys(self.listeners).forEach(function(event) {
    self.listeners[event].forEach(function(listener) {
      logging.debug(util.format('Removing a listener: %s', event));
      cluster.removeListener(event, listener);
    });
  });

  this.started = false;

  return callback(null);
};

module.exports = Qilin;
