import Moment from 'moment';

function parsePayments(payments) {
    var result = [];
    for(var i = 0; i < payments.length; i += 2) {
        var time = payments[i + 1];
        var serializedPayment = payments[i];
        var parts = serializedPayment.split(':');
        result.push({
            date: Moment(parseInt(time)*1000).format('lll'),
            time,
            hash: parts[0],
            amount: parts[1],
            fee: parts[2],
            mixin: parts[3],
            recipients: parts[4]
        });
    }
    return result;
}

function mergePayments(source, update) {
    var unique = source.filter( (p) => !~update.findIndex(p2 => p2.hash == p.hash));
    return unique.concat(update).sort( (a,b) => b.time - a.time);
}

export { parsePayments, mergePayments };
