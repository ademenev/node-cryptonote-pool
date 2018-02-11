"use strict";

var logSystem = 'unlocker';
var config = require('config');
var apiInterfaces = require('./apiInterfaces.js')(config.daemon, config.wallet);
var logger = require('./logger')(logSystem);
var redisClient = require('./redis-client');
var misc = require('./misc');
const Promise = require('bluebird');

require('./exceptionWriter.js')(logSystem);

logger.info('Started');

//Use this in payment processing to get block info once batch RPC is supported
/*
var batchArray = [
    ['getblockheaderbyheight', {height: 21}],
    ['getblockheaderbyheight', {height: 22}],
    ['getblockheaderbyheight', {height: 23
    }]
];

apiInterfaces.batchRpcDaemon(batchArray, function(error, response){

});
*/


function runInterval() {
    redisClient.zrange(config.coin + ':blocks:candidates', 0, -1, 'WITHSCORES').then( results => {
        if (results.length === 0){
            logger.info('No blocks candidates in redis');
            throw new Error();
        }
        var blocks = [];
        for (var i = 0; i < results.length; i += 2) {
            var parts = results[i].split(':');
            blocks.push({
                serialized: results[i],
                height: parseInt(results[i + 1]),
                hash: parts[0],
                time: parts[1],
                difficulty: parts[2],
                shares: parts[3]
            });
        }
        return blocks;
    }).catch( error => {
        logger.error('Error trying to get pending blocks from redis %j', [error]);
        throw error;
    }).then( blocks => {
        var limit = config.blockUnlocker.batchSize || blocks.length;
        if (limit > blocks.length)
            limit = blocks.length;
        return Promise.filter(blocks.slice(0, limit), block => {
            return apiInterfaces.rpcDaemon('getblockheaderbyheight', {height: block.height}).then( result =>  {
                if (!result.block_header){
                    logger.error('Error with getblockheaderbyheight, no details returned for %s - %j', [block.serialized, result]);
                    block.unlocked = false;
                    return false;
                }
                var blockHeader = result.block_header;
                block.orphaned = blockHeader.hash === block.hash ? 0 : 1;
                block.unlocked = blockHeader.depth >= config.blockUnlocker.depth;
                block.reward = blockHeader.reward;
                return block.unlocked;
            }).catch( error => {
                logger.error('Error with getblockheaderbyheight RPC request for block %s - %j', [block.serialized, error]);
                block.unlocked = false;
                return false;
            });
        }, {concurrency: 1}).then( unlockedBlocks => [unlockedBlocks, blocks] );
    }).spread( (unlockedBlocks, blocks) => {
        if (unlockedBlocks.length === 0){
            logger.info('No pending blocks are unlocked yet (%d pending)', [blocks.length]);
            throw new Error();
        }
        return unlockedBlocks;
    }).then( blocks => {
        var redisCommands = blocks.map(function(block){
            return ['hgetall', config.coin + ':shares:round' + block.height];
        });
        return redisClient.multi(redisCommands).exec().then(redisClient.convertMultiReply).then( replies => {
            for (var i = 0; i < replies.length; i++){
                var workerShares = replies[i];
                blocks[i].workerShares = workerShares;
            };
            return blocks;
        }).catch( error => {
            logger.error('Error with getting round shares from redis %j', [error]);
            throw error;
        });
    }).then( blocks => {
        // Handle orphaned blocks
        var orphanCommands = [];
        blocks.forEach( block => {
            if (!block.orphaned) return;
            orphanCommands.push(['del', config.coin + ':shares:round' + block.height]);
            orphanCommands.push(['zrem', config.coin + ':blocks:candidates', block.serialized]);
            orphanCommands.push(['zadd', config.coin + ':blocks:matured', block.height, [
                block.hash,
                block.time,
                block.difficulty,
                block.shares,
                block.orphaned
            ].join(':')]);

            if (block.workerShares) {
                var workerShares = block.workerShares;
                Object.keys(workerShares).forEach(function (worker) {
                    orphanCommands.push(['hincrby', config.coin + ':shares:roundCurrent', worker, workerShares[worker]]);
                });
            }
        });
        if (orphanCommands.length > 0) {
            return redisClient.multi(orphanCommands).exec().then(replies => {
                return blocks;
            }).catch( error => {
                logger.error('Error with cleaning up data in redis for orphan block(s) %j', [error]);
                throw error;
            });
        } else {
            return blocks;
        }
    }).then( blocks => {
        //Handle unlocked blocks
        var unlockedBlocksCommands = [];
        var payments = {};
        var totalBlocksUnlocked = 0;
        blocks.forEach(function(block) {
            if (block.orphaned) return;
            totalBlocksUnlocked++;

            unlockedBlocksCommands.push(['del', config.coin + ':shares:round' + block.height]);
            unlockedBlocksCommands.push(['zrem', config.coin + ':blocks:candidates', block.serialized]);
            unlockedBlocksCommands.push(['zadd', config.coin + ':blocks:matured', block.height, [
                block.hash,
                block.time,
                block.difficulty,
                block.shares,
                block.orphaned,
                block.reward
            ].join(':')]);

            var feePercent = config.blockUnlocker.poolFee / 100;

            if (misc.doDonations) {
                feePercent += config.blockUnlocker.devDonation / 100;
                feePercent += config.blockUnlocker.coreDevDonation / 100;

                var devDonation = block.reward * (config.blockUnlocker.devDonation / 100);
                payments[misc.devDonationAddress] = devDonation;

                var coreDevDonation = block.reward * (config.blockUnlocker.coreDevDonation / 100);
                payments[misc.coreDevDonationAddress] = coreDevDonation;
            }

            var reward = block.reward - (block.reward * feePercent);

            if (block.workerShares) {
                var totalShares = parseInt(block.shares);
                Object.keys(block.workerShares).forEach(function (worker) {
                    var percent = block.workerShares[worker] / totalShares;
                    var workerReward = reward * percent;
                    payments[worker] = (payments[worker] || 0) + workerReward;
                });
            }
        });

        for (var worker in payments) {
            var amount = parseInt(payments[worker]);
            if (amount <= 0){
                delete payments[worker];
                continue;
            }
            unlockedBlocksCommands.push(['hincrby', config.coin + ':workers:' + worker, 'balance', amount]);
        }

        if (unlockedBlocksCommands.length === 0){
            logger.info('No unlocked blocks yet (%d pending)', [blocks.length]);
            throw new Error();
        }

        return redisClient.multi(unlockedBlocksCommands).exec().then(redisClient.convertMultiReply).then(replies => {
            logger.info('Unlocked %d blocks and update balances for %d workers', [totalBlocksUnlocked, Object.keys(payments).length]);
        }).catch( error => {
            logger.error('Error with unlocking blocks %j', [error]);
            throw error;
        });
    }).catch( error => {

    }).tap( () => {
        setTimeout(runInterval, config.blockUnlocker.interval * 1000);
    });
}

runInterval();
