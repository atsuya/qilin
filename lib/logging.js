/**
 * qilin
 * Copyright(c) 2012 Atsuya Takagi <atsuya.takagi@gmail.com>
 * MIT Licensed
 */
var winston = require('winston');

module.exports = (function() {
  var instance = null;

  function initialize(config) {
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
          level: process.env.QILIN_LOG_LEVEL ? process.env.QILIN_LOG_LEVEL : 'info'
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
