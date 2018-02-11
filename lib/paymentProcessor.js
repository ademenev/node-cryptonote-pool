"use strict";

var logSystem = 'payments';
var fs = require('fs');
var config = require('config');
var apiInterfaces = require('./apiInterfaces.js')(config.daemon, config.wallet);
const Promise = require('bluebird');

require('./exceptionWriter.js')(logSystem);
var logger = require('./logger')(logSystem);
var redisClient = require('./redis-client');

logger.info('Started');

let rescheduleEarly = false;

function schedulePayments() {
    let timeout;
    if (rescheduleEarly) {
        logger.warn('Rescheduling payment cycle early');
        timeout = 10000;
    } else {
        let now = new Date().getTime();
        timeout = now % (config.payments.interval * 1000);
    }
    rescheduleEarly = false;
    setTimeout(runInterval, timeout);
}

function runInterval() {
    //Get worker keys
    redisClient.keys(config.coin + ':workers:*').catch( error => {
        logger.error('Error trying to get worker balances from redis %j', [error]);
        throw error;
    }).then( keys => {
        //Get worker balances
        var redisCommands = keys.map(function(k){
            return ['hget', k, 'balance'];
        });
        return redisClient.multi(redisCommands).exec().then(redisClient.convertMultiReply).then( replies =>{
            var balances = {};
            for (var i = 0; i < replies.length; i++){
                var parts = keys[i].split(':');
                var workerId = parts[parts.length - 1];
                balances[workerId] = parseInt(replies[i]) || 0

            }
            return balances;
        }).catch( error => {
            logger.error('Error with getting balances from redis %j', [error]);
            throw error;
        });
    }).then( balances => {
        //Filter workers under balance threshold for payment
        var payments = {};
        for (var worker in balances){
            var balance = balances[worker];
            if (balance >= config.payments.minPayment){
                var remainder = balance % config.payments.denomination;
                var payout = balance - remainder;
                if (payout <= 0) continue;
                if (payout > config.payments.maxPayment)
                    payout = config.payments.maxPayment;
                payments[worker] = payout;
            }
        }
        if (Object.keys(payments).length === 0){
            logger.info('No workers\' balances reached the minimum payment threshold');
            throw new Error();
        }
        var transferCommands = [];
        var transferCommandsLength = Math.ceil(Object.keys(payments).length / config.payments.maxAddresses);
        for (var i = 0; i < transferCommandsLength; i++){
            transferCommands.push({
                redis: [],
                amount : 0,
                rpc: {
                    destinations: [],
                    fee: config.payments.transferFee,
                    mixin: config.payments.mixin,
                    unlock_time: 0
                }
            });
        }
        var addresses = 0;
        var commandIndex = 0;
        for (var worker in payments){
            var amount = parseInt(payments[worker]);
            transferCommands[commandIndex].rpc.destinations.push({amount: amount, address: worker});
            transferCommands[commandIndex].redis.push(['hincrby', config.coin + ':workers:' + worker, 'balance', -amount]);
            transferCommands[commandIndex].redis.push(['hincrby', config.coin + ':workers:' + worker, 'paid', amount]);
            transferCommands[commandIndex].amount += amount;

            addresses++;
            if (addresses >= config.payments.maxAddresses){
                commandIndex++;
                addresses = 0;
            }
        }
        var timeOffset = 0;
        return Promise.filter(transferCommands, transferCmd => {
            return apiInterfaces.rpcWallet('transfer', transferCmd.rpc).then( result => {
                var now = (timeOffset++) + Date.now() / 1000 | 0;
                var txHash = result.tx_hash.replace('<', '').replace('>', '');
                transferCmd.redis.push(['zadd', config.coin + ':payments:all', now, [
                    txHash,
                    transferCmd.amount,
                    transferCmd.rpc.fee,
                    transferCmd.rpc.mixin,
                    Object.keys(transferCmd.rpc.destinations).length
                ].join(':')]);
                for (var i = 0; i < transferCmd.rpc.destinations.length; i++){
                    var destination = transferCmd.rpc.destinations[i];
                    transferCmd.redis.push(['zadd', config.coin + ':payments:' + destination.address, now, [
                        txHash,
                        destination.amount,
                        transferCmd.rpc.fee,
                        transferCmd.rpc.mixin
                    ].join(':')]);
                }
                logger.info('Payments sent via wallet daemon %j', [result]);
                return redisClient.multi(transferCmd.redis).exec().then(redisClient.convertMultiReply).then( replies => {
                    return true;
                }).catch( error => {
                    logger.error('Super critical error! Payments sent yet failing to update balance in redis, double payouts likely to happen %j', [error]);
                    logger.error('Double payments likely to be sent to %j', transferCmd.rpc.destinations);
                    return false;
                });
            }).catch( error => {
                logger.error('Error with transfer RPC request to wallet daemon %j', [error]);
                logger.error('Payments failed to send to %j', transferCmd.rpc.destinations);
                rescheduleEarly = true;
                return false;
            });
        }).then( succeeded => {
            var failedAmount = transferCommands.length - succeeded.length;
            logger.info('Payments splintered and %d successfully sent, %d failed', [succeeded.length, failedAmount]);
        });
    }).catch( error => {}).tap(() => {
        schedulePayments();
    });
}

schedulePayments();
