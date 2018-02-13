import store from 'store';
import Moment from 'moment';

function parseBlock(data, height, serializedBlock){
    var parts = serializedBlock.split(':');
    var block = {
        height: parseInt(height),
        hash: parts[0],
        time: parts[1],
        date: Moment(parseInt(parts[1])*1000).format('lll'),
        difficulty: parseInt(parts[2]),
        shares: parseInt(parts[3]),
        orphaned: parts[4],
        reward: parts[5]
    };

    block.luck = calculateLuck(data, block.difficulty, block.shares);

    var toGo = data.config.depth - (data.network.height - block.height);
    block.maturity = toGo < 1 ? '' : (toGo + ' to go');

    switch (block.orphaned) {
        case '0':
            block.status = 'unlocked';
            break;
        case '1':
            block.status = 'orphaned';
            break;
        default:
            block.status = 'pending';
            break;
    }
    return block;
}

function parseBlocks(data, blocks) {
    let result = [];
    for (var i = 0; i < blocks.length; i += 2) {
        var block = parseBlock(data, blocks[i + 1], blocks[i]);
        result.push(block);
    }
    return result;
}

function calculateLuck(data, difficulty, shares) {
    //Only an approximation to reverse the calculations done in pool.js, because the shares with their respective times are not recorded in redis
    //Approximation assumes equal pool hashrate for the whole round
    //Could potentially be replaced by storing the sum of all job.difficulty in the redis db. 
    if (data.config.slushMiningEnabled) {                                      //Uses integral calculus to calculate the average of a dynamic function
        var accurateShares = 1/data.config.blockTime * (                       //1/blockTime to get the average
            shares * data.config.weight * (                                    //Basically calculates the 'area below the graph' between 0 and blockTime
                1 - Math.pow(
                        Math.E, 
                        ((- data.config.blockTime) / data.config.weight)  //blockTime is equal to the highest possible result of (dateNowSeconds - scoreTime)
                    )
            )
        );
    }
    else {
        var accurateShares = shares;
    }

    var percent;
    if (difficulty > accurateShares){
        var percent = 100 - Math.round(accurateShares / difficulty * 100);
    } else {
        var percent = (100 - Math.round(difficulty / accurateShares * 100)) * -1;
    }
    return percent;
}

function mergeBlocks(source, update) {
    var unique = source.filter( (b) => !~update.findIndex(b2 => b2.hash == b.hash));
    return unique.concat(update).sort( (b1, b2) => b2.height - b1.height);
}

export {parseBlock, parseBlocks, mergeBlocks};