var assert = require('assert')
  , should = require('should')
  , path = require('path');

global.test = {
    root: path.resolve(__dirname, '../../')
  , testRoot: path.resolve(__dirname, '../')
};

module.exports = {
    assert: assert
  , should: should
};
