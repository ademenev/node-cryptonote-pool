"use strict";

var logSystem = 'api';
var fs = require('fs');
var url = require("url");
var zlib = require('zlib');
var config = require('config');
var logger = require('./logger')(logSystem);
var apiInterfaces = require('./apiInterfaces.js')(config.daemon, config.wallet);
var redisClient = require('./redis-client');
var misc = require('./misc');
const Promise = require('bluebird');
const socketio = require('socket.io');

require('./exceptionWriter.js')(logSystem);

var redisCommands = [
    ['zremrangebyscore', config.coin + ':hashrate', '-inf', ''],
    ['zrange', config.coin + ':hashrate', 0, -1],
    ['hgetall', config.coin + ':stats'],
    ['zrange', config.coin + ':blocks:candidates', 0, -1, 'WITHSCORES'],
    ['zrevrange', config.coin + ':blocks:matured', 0, config.api.blocks - 1, 'WITHSCORES'],
    ['hgetall', config.coin + ':shares:roundCurrent'],
    ['hgetall', config.coin + ':stats'],
    ['zcard', config.coin + ':blocks:matured'],
    ['zrevrange', config.coin + ':payments:all', 0, config.api.payments - 1, 'WITHSCORES'],
    ['zcard', config.coin + ':payments:all'],
    ['keys', config.coin + ':payments:*']
];

var currentStats = "";

var minerStats = {};

var liveConnections = {};
var addresses = {};

function collectStats() {

    var startTime = Date.now();
    var redisFinished;
    var daemonFinished;

    var windowTime = (((Date.now() / 1000) - config.api.hashrateWindow) | 0).toString();
    redisCommands[0][3] = '(' + windowTime;
  
    let tasks = {
        pool: redisClient.multi()
            .zremrangebyscore(config.coin + ':hashrate', '-inf', '(' + windowTime)
            .zrange(config.coin + ':hashrate', 0, -1)
            .hgetall(config.coin + ':stats')
            .zrange(config.coin + ':blocks:candidates', 0, -1, 'WITHSCORES')
            .zrevrange(config.coin + ':blocks:matured', 0, config.api.blocks - 1, 'WITHSCORES')
            .hgetall(config.coin + ':shares:roundCurrent')
            .hgetall(config.coin + ':stats')
            .zcard(config.coin + ':blocks:matured')
            .zrevrange(config.coin + ':payments:all', 0, config.api.payments - 1, 'WITHSCORES')
            .zcard(config.coin + ':payments:all')
            .keys(config.coin + ':payments:*')
            .exec().then(redisClient.convertMultiReply).tap( () => {
                redisFinished = Date.now();
            }).then( replies => {
                var dateNowSeconds = Date.now() / 1000 | 0;
                var data = {
                    stats: replies[2],
                    blocks: replies[3].concat(replies[4]),
                    totalBlocks: parseInt(replies[7]) + (replies[3].length / 2),
                    payments: replies[8],
                    totalPayments: parseInt(replies[9]),
                    totalMinersPaid: replies[10].length - 1
                };
                var hashrates = replies[1];
                minerStats = {};

                for (var i = 0; i < hashrates.length; i++){
                    var hashParts = hashrates[i].split(':');
                    minerStats[hashParts[1]] = (minerStats[hashParts[1]] || 0) + parseInt(hashParts[0]);
                }

                var totalShares = 0;

                for (var miner in minerStats){
                    var shares = minerStats[miner];
                    totalShares += shares;
                    minerStats[miner] = getReadableHashRateString(shares / config.api.hashrateWindow);
                }

                data.miners = Object.keys(minerStats).length;

                data.hashrate = totalShares / config.api.hashrateWindow;

                data.roundHashes = 0;

                if (Object.keys(replies[5]).length) {
                    for (var miner in replies[5]){
                        if (config.poolServer.slushMining.enabled) {
                            data.roundHashes +=  parseInt(replies[5][miner]) / Math.pow(Math.E, ((data.lastBlockFound - dateNowSeconds) / config.poolServer.slushMining.weight)); //TODO: Abstract: If something different than lastBlockfound is used for scoreTime, this needs change. 
                        }
                        else {
                            data.roundHashes +=  parseInt(replies[5][miner]);
                        }
                    }
                }

                if (Object.keys(replies[6]).length) {
                    data.lastBlockFound = replies[6].lastBlockFound;
                }
                return data;
            }).catch( error => {
                logger.error('Error getting redis data %j', [error]);
                throw error;
            }),
        network: 
            apiInterfaces.rpcDaemon('getlastblockheader', {}).tap( () => {
                daemonFinished = Date.now();
            }).then( reply => {
                var blockHeader = reply.block_header;
                return {
                    difficulty: blockHeader.difficulty,
                    height: blockHeader.height,
                    timestamp: blockHeader.timestamp,
                    reward: blockHeader.reward,
                    hash:  blockHeader.hash
                };
            }).catch( error => {
                logger.error('Error getting daemon data %j', [error]);
                throw error;
            }),
        config: {
                ports: getPublicPorts(config.poolServer.ports),
                hashrateWindow: config.api.hashrateWindow,
                fee: config.blockUnlocker.poolFee,
                coin: config.coin,
                symbol: config.symbol,
                depth: config.blockUnlocker.depth,
                donation: config.blockUnlocker.devDonation,
                coreDonation: config.blockUnlocker.coreDevDonation,
                doDonations: misc.doDonations,
                version: misc.version,
                minPaymentThreshold: config.payments.minPayment,
                denominationUnit: config.payments.denomination,
                blockTime: config.poolServer.slushMining.blockTime,
                slushMiningEnabled: config.poolServer.slushMining.enabled,
                weight: config.poolServer.slushMining.weight
            }
    };
    Promise.props(tasks).tap( () => {
        logger.info('Stat collection finished: %d ms redis, %d ms daemon', [redisFinished - startTime, daemonFinished - startTime]);
    }).then( results => {
        currentStats = results;
    }).catch( error => {
        logger.error('Error collecting all stats');
    }).tap( () => {
        setTimeout(collectStats, config.api.updateInterval * 1000);
        broadcastLiveStats();
    });
}

function getPublicPorts(ports){
    return ports.filter( port => !port.hidden );
}

function getReadableHashRateString(hashrate){
    var i = 0;
    var byteUnits = [' H', ' KH', ' MH', ' GH', ' TH', ' PH' ];
    while (hashrate > 1000){
        hashrate = hashrate / 1000;
        i++;
    }
    return hashrate.toFixed(2) + byteUnits[i];
}

function broadcastLiveStats(address, socket) {
    (socket||io).emit('stats', currentStats);
    var redisCommands = [];
    let addressesList = address ? [address] : Object.keys(addresses);
    addressesList.forEach( address => {
        redisCommands.push(['hgetall', config.coin + ':workers:' + address]);
        redisCommands.push(['zrevrange', config.coin + ':payments:' + address, 0, config.api.payments - 1, 'WITHSCORES']);
    });
    redisClient.multi(redisCommands).exec().then(redisClient.convertMultiReply).then( replies => {
        for (var i = 0; i < addressesList.length; i++){
            var offset = i * 2;
            var address = addressesList[i];
            var stats = replies[offset];
            if (stats) {
                stats.hashrate = minerStats[address];
                (socket || io.to(address)).emit('miner_stats', {stats: stats, payments: replies[1]});
            }
        }
    }).catch ( error => {
        logger.error('Error collecting miner stats : %j', [error]);
    });
}

function handleGetPayments(request, callback) {
    var paymentKey = ':payments:all';
    if (request.address)
        paymentKey = ':payments:' + request.address;

    redisClient.zrevrangebyscore(
            config.coin + paymentKey,
            '(' + request.time,
            '-inf',
            'WITHSCORES',
            'LIMIT',
            0,
            config.api.payments
    ).then(result => {
        return result;
    }).catch( error => {
        return {error: 'query failed'};
    }).then( reply => {
        callback(reply);
    });
}

function handleGetBlocks(request, callback){
    redisClient.zrevrangebyscore(
            config.coin + ':blocks:matured',
            '(' + request.height,
            '-inf',
            'WITHSCORES',
            'LIMIT',
            0,
            config.api.blocks
    ).catch(error => {
        return {error: 'query failed'};
    }).then(callback);
}

collectStats();

function authorize(request, response){
    response.setHeader('Access-Control-Allow-Origin', '*');
    var sentPass = url.parse(request.url, true).query.password;
    if (sentPass !== config.api.password){
        response.statusCode = 401;
        response.end('invalid password');
        return;
    }
    response.statusCode = 200;
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Content-Type', 'application/json');
    return true;
}

function handleAdminStats(request, callback) {
    redisClient.multi([
        ['keys', config.coin + ':workers:*'],
        ['zrange', config.coin + ':blocks:matured', 0, -1]
    ]).exec().then(redisClient.convertMultiReply).catch( error => {
        logger.error('Error trying to get admin data from redis %j', [error]);
        throw error;
    }).spread( (workerKeys, blocks) => {
        var redisCommands = workerKeys.map( k => {
            return ['hmget', k, 'balance', 'paid'];
        });
        return redisClient.multi(redisCommands).exec()
        .then( replies => [replies, blocks])
        .catch( error => {
                logger.error('Error with getting balances from redis %j', [error]);
                throw error;
        });
    }).spread( (workerData, blocks) => {
        var stats = {
            totalOwed: 0,
            totalPaid: 0,
            totalRevenue: 0,
            totalDiff: 0,
            totalShares: 0,
            blocksOrphaned: 0,
            blocksUnlocked: 0,
            totalWorkers: 0
        };

        for (var i = 0; i < workerData.length; i++){
            stats.totalOwed += parseInt(workerData[i][0]) || 0;
            stats.totalPaid += parseInt(workerData[i][1]) || 0;
            stats.totalWorkers++;
        }

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i].split(':');
            if (block[5]) {
                stats.blocksUnlocked++;
                stats.totalDiff += parseInt(block[2]);
                stats.totalShares += parseInt(block[3]);
                stats.totalRevenue += parseInt(block[5]);
            } else {
                stats.blocksOrphaned++;
            }
        }
        return stats;
    }).then(callback)
    .catch(error => {
        callback({error: 'error collecting stats'});
    });
}

/*
var server = http.createServer(function(request, response) {

    if (request.method.toUpperCase() === "OPTIONS"){
        response.writeHead("204", "No Content", {
            "access-control-allow-origin": '*',
            "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
            "access-control-allow-headers": "content-type, accept",
            "access-control-max-age": 10, // Seconds.
            "content-length": 0
        });
        return(response.end());
    }
    var urlParts = url.parse(request.url, true);

    switch(urlParts.pathname){
        case '/stats':
            var reply = currentStatsCompressed;
            response.writeHead("200", {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'Content-Encoding': 'deflate',
                'Content-Length': reply.length
            });
            response.end(reply);
            break;
        case '/live_stats':
            response.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'Content-Encoding': 'deflate',
                'Connection': 'keep-alive'
            });
            var uid = Math.random().toString();
            liveConnections[uid] = response;
            response.on("finish", function() {
                delete liveConnections[uid];
            });
            break;
        case '/stats_address':
            handleMinerStats(urlParts, response);
            break;
        case '/get_payments':
            handleGetPayments(urlParts, response);
            break;
        case '/get_blocks':
            handleGetBlocks(urlParts, response);
            break;
        default:
            response.writeHead(404, {
                'Access-Control-Allow-Origin': '*'
            });
            response.end('Invalid API call');
            break;
    }
});
*/

var io = socketio(config.api.port);

let dropAddress = (address => {
    if (!addresses[address]) return;
    addresses[address]--;
    if (addresses[address] <= 0)
        delete addresses[address];
});

let addAddress = (address => {
    if (!addresses[address]) addresses[address] = 0;
    addresses[address]++;
});

io.origins((origin, callback)  => {
    callback(null, true);
})

io.on('connection', (socket) => {
    let myAddress = null;
    socket.on('address', (address) => {
        if (myAddress) {
            socket.leave(myAddress);
            dropAddress(myAddress);
        }
        addAddress(address);
        socket.join(address, () => {
            broadcastLiveStats(address, socket);
        });
        myAddress = address;
    });
    socket.on('payments', (request, fn) => {
        handleGetPayments(request, fn);
    });
    socket.on('blocks', (request, fn) => {
        handleGetBlocks(request, fn);
    });
    socket.on('disconnect', () => {
        if (myAddress)
            dropAddress(myAddress);
        myAddress = null;
    });
    socket.on('admin_stats', (request, callback) => {
        if (config.api.password !== request.password) {
            callback({error: 'not authorized'});
        } else {
            logger.warn('Admin authorized');
            handleAdminStats(request, callback);
        }
    });
});
