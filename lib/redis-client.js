"use strict";

var Redis = require('ioredis');
var config = require('config');

module.exports = new Redis({
    port: config.redis.port,
    host: config.redis.host,
    password: config.redis.auth
});

module.exports.convertMultiReply = (replies) => {
    return replies.map( reply => {
        if (reply[0]) throw reply[0];
        return reply[1];
    });
};

