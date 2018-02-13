<template>
    <div class="col-md-4 stats" v-if="stats.network">
        <h3>Network</h3>
        <div><i class="fa fa-tachometer"></i> Hash Rate: <span id="networkHashrate">{{ networkHashRate }}</span></div>
        <div><i class="fa fa-clock-o"></i> Block Found: <span id="networkLastBlockFound">{{ lastBlockTime }}</span></div>
        <div><i class="fa fa-unlock-alt"></i> Difficulty: <span id="networkDifficulty"> {{ stats.network.difficulty }} </span></div>
        <div><i class="fa fa-bars"></i> Blockchain Height: <span id="blockchainHeight">{{ stats.network.height }}</span></div>
        <div><i class="fa fa-money"></i> Last Reward: <span id="networkLastReward">{{ lastReward + ' ' +  stats.config.symbol }} </span></div>
        <div><i class="fa fa-paw"></i> Last Hash: <hash-link :hash="stats.network.hash"></hash-link> </div>
    </div>
</template>

<script>

import store from 'store';
import config from 'config';
import Moment from 'moment';
import HashRateFormat from 'mixins/HashRateFormat';
import IntervalFormat from 'mixins/IntervalFormat';
import CoinsFormat from 'mixins/CoinsFormat';
import HashLink from 'components/HashLink.vue';

export default {
    mixins: [HashRateFormat, IntervalFormat, CoinsFormat],
    components: { HashLink },
    data : () => store.state,
    computed: {
        lastBlockTime () {
            if (this.stats.network) {
                return this.stats.network.timestamp ? 
                    Moment(parseInt(this.stats.network.timestamp) * 1000).from(this.now)
                    : 'Never';
            }
            return "";
        },
        lastReward () {
            return this.getReadableCoins(this.stats.network.reward, 4);
        },
        blockTime () {
            return this.getReadableTime(this.stats.network.timestamp * 1000) ;
        },
        networkHashRate () {
            return this.readableHashRate(this.stats.network.difficulty / 120) +  '/sec';
        },
        poolFee () {
            var totalFee = this.stats.config.fee;
            if (this.stats.config.doDonations){
                totalFee += this.stats.config.donation;
                totalFee += this.stats.config.coreDonation;
                var feeText = [];
                if (this.stats.config.donation > 0) feeText.push(this.stats.config.donation + '% to pool dev');
                if (this.stats.config.coreDonation > 0) feeText.push(this.stats.config.coreDonation + '% to core devs');
            }
            return totalFee + '%';
        }
    }
}
</script>
