const units = [ [60, 'second'], [60, 'minute'], [24, 'hour'],
    [7, 'day'], [4, 'week'], [12, 'month'], [1, 'year'] ];

function formatAmounts(amount, unit){
    var rounded = Math.round(amount);
    return '' + rounded + ' ' + unit + (rounded > 1 ? 's' : '');
}

export default {
    methods: {
        getReadableTime(seconds) {
            var amount = seconds;
            for (var i = 0; i < units.length; i++){
                if (amount < units[i][0])
                    return formatAmounts(amount, units[i][1]);
                amount = amount / units[i][0];
            }
            return formatAmounts(amount,  units[units.length - 1][1]);
        }
    }
};
