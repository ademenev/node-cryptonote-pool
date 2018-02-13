import config from 'config';
import store from 'store';

export default {
    methods: {
        getReadableCoins(coins, digits, withoutSymbol) {
            var amount = (parseInt(coins || 0) / config.coinUnits).toFixed(digits || config.coinUnits.toString().length - 1);
            return amount;
        }
    }
};
