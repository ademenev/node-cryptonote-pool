"use strict";

var http = require('http');
const Promise = require('bluebird');

function jsonHttpRequest(host, port, data) {
    return new Promise( (resolve, reject) => {
        var options = {
            hostname: host,
            port: port,
            path: '/json_rpc',
            method: 'POST',
            headers: {
                'Content-Length': data.length,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
    
        var req = http.request(options, res => {
            var replyData = '';
            res.setEncoding('utf8');
            res.on('data', chunk => {
                replyData += chunk;
            });
            res.on('end', () => {
                try{
                    resolve(JSON.parse(replyData));
                } catch(e) {
                    reject(e);
                }
            });
        });
        req.setTimeout(3000);
        req.on('error', reject);
        req.end(data);
    });
}

function rpc(host, port, method, params) {

    var data = JSON.stringify({
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
    });
    return jsonHttpRequest(host, port, data).then(replyJson => {
        if (replyJson.error) throw replyJson.error;
        return replyJson.result;
    });
}

function batchRpc(host, port, array) {
    var rpcArray = [];
    for (var i = 0; i < array.length; i++){
        rpcArray.push({
            id: i.toString(),
            jsonrpc: "2.0",
            method: array[i][0],
            params: array[i][1]
        });
    }
    var data = JSON.stringify(rpcArray);
    return jsonHttpRequest(host, port, data);
}


module.exports = function(daemonConfig, walletConfig) {
    return {
        batchRpcDaemon: function(batchArray) {
            return batchRpc(daemonConfig.host, daemonConfig.port, batchArray);
        },
        rpcDaemon: function(method, params) {
            return rpc(daemonConfig.host, daemonConfig.port, method, params);
        },
        rpcWallet: function(method, params) {
            return rpc(walletConfig.host, walletConfig.port, method, params);
        }
    }
};