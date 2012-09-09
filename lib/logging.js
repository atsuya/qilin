var winston = require('winston');

module.exports = (function() {
  var instance = null;

  function initialize(config) {
    console.log('initialized!!!!!!!');
    console.log('debug: %s', process.env.QILIN_DEBUG ? 'debug' : 'info');

    var logger = new (winston.Logger)({
        transports: [
            new winston.transports.Console({
                level: config.level
              , colorize: true
              , timestamp: true
            })
        ]
    });
    logger.setLevels(winston.config.syslog.levels);

    return logger;
  }

  function getInstance() {
    if (!instance) {
      var config = {
          level: process.env.QILIN_DEBUG ? 'debug' : 'info'
      };
      instance = initialize(config);
    }
    return instance;
  }

  return {
      debug: function(message) {
        getInstance().debug(message);
      }
    , info: function(message) {
        getInstance().info(message);
      }
    , notice: function(message) {
        getInstance().notice(message);
      }
    , warning: function(message) {
        getInstance().warning(message);
      }
    , error: function(message) {
        getInstance().error(message);
      }
    , crit: function(message) {
        getInstance().crit(message);
      }
    , alert: function(message) {
        getInstance().alert(message);
      }
    , emerg: function(message) {
        getInstance().emerg(message);
      }
  };
}());
