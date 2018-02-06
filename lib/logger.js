var fs = require('fs');
var util = require('util');
var dateFormat = require('dateformat');
var clc = require('cli-color');
var config = require('config');

var DEBUG = 1;
var INFO =  2;
var WARN =  3;
var ERROR = 4;
var DISABLED = 99;

var bySystem = {};

var severityColorMap = {
    DEBUG: clc.green,
    INFO: clc.blue,
    WARN: clc.yellow,
    EROR: clc.red
};

var severityLevelNames = ['debug', 'info', 'warn', 'error'];
var configSeverity = {};

['console', 'files'].forEach( (key) => {
    var level = severityLevelNames.indexOf(config.logging[key].level);
    if (~level) configSeverity[key] = level + 1;
    else configSeverity[key] = DISABLED;
})

var logDir = config.logging.files.directory;

if (!fs.existsSync(logDir)){
    try {
        fs.mkdirSync(logDir);
    }
    catch(e){
        throw e;
    }
}

var pendingWrites = {};

setInterval(function(){
    for (var fileName in pendingWrites){
        var data = pendingWrites[fileName];
        fs.appendFile(fileName, data);
        delete pendingWrites[fileName];
    }
}, config.logging.files.flushInterval * 1000);

var log = function(severity, system, text, data) {

    var logConsole = severity >= configSeverity.console;
    var logFiles = severity >= configSeverity.files;

    if (!logConsole && !logFiles) return;

    var time = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss');
    var formattedMessage = text;

    if (data) {
        data.unshift(text);
        formattedMessage = util.format.apply(null, data);
    }

    if (logConsole){
        if (config.logging.console.colors)
            console.log(severityColorMap[severity](time) + clc.white.bold(' [' + system + '] ') + formattedMessage);
        else
            console.log(time + ' [' + system + '] ' + formattedMessage);
    }

    if (logFiles) {
        var fileName = logDir + '/' + system + '_' + severity + '.log';
        var fileLine = time + ' ' + formattedMessage + '\n';
        pendingWrites[fileName] = (pendingWrites[fileName] || '') + fileLine;
    }
};


class Logger {
    
    constructor(system) {
        this.system = system;
    }
    debug (text, data) {
        log(DEBUG, this.system, text, data);
    }
    info (text, data) {
        log(INFO, this.system, text, data);
    }
    warn (text, data) {
        log(WARN, this.system, text, data);
    }
    error (text, data) {
        log(ERROR, this.system, text, data);
    }
}

module.exports = function(system) {
    if (!bySystem[system]) 
        bySystem[system] = new Logger(system);
    return bySystem[system]
}
