var redis = require('redis');
var config = require('./lib/configReader.js');

module.exports = redis.createClient(config.redis.port, config.redis.host, {auth_pass: config.redis.auth});
