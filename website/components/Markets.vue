<template>

    <div class="col-md-4 stats">
        <h3 id="marketHeader">Market</h3>
        <div :key="item.ticker.base+'.'+item.ticker.target" v-for="item in marketsData" class="marketTicker">
            {{item.ticker.base}} :
            <span>{{item.ticker.price}} {{item.ticker.target}}</span>
        </div>

        <div v-if="marketsData[0]" class="marketFooter">
            Updated: 
            <span id="marketLastUpdated">{{ updateTime }}</span>
        </div>
        <div class="marketFooter">Powered by <a target="_blank" href="https://www.cryptonator.com/">Cryptonator</a></div>
    </div>
</template>

<script>

import store from 'store';
import config from 'config';
import Moment from 'moment';

let intervalMarketPolling = setInterval(updateMarkets, 300000); //poll market data every 5 minutes
let xhrMarketGets = {};
updateMarkets();

function updateMarkets(){
    let completedFetches = 0;
    let marketsData = [];
    for (let i = 0; i < config.cryptonatorWidget.length; i++){
        (function(i){
            xhrMarketGets[config.cryptonatorWidget[i]] = $.get('https://api.cryptonator.com/api/ticker/' + config.cryptonatorWidget[i], function(data){
                marketsData[i] = data;
                completedFetches++;
                if (completedFetches !== config.cryptonatorWidget.length) return;
                marketsData.forEach( (item) => {
                    var price = parseFloat(item.ticker.price);
                    if (price > 1) price = Math.round(price * 100) / 100;
                    else price = item.ticker.price;
                    item.ticker.price = price;
                });
                store.setMarketsData(marketsData);
            }, 'json');
        })(i);
    }
}


export default {
    data : () => store.state,
    computed: {
        updateTime () {
            if (this.marketsData[0]) return Moment(this.marketsData[0].timestamp * 1000).from(this.now);
            return "";
        }
    }
}

</script>

<style>
    .marketFooter{
        font-size: 10px;
        opacity: 0.6;
    }
</style>