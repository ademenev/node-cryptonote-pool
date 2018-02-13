<template>
    <div class="col-md-4 stats" v-if="stats.pool">
        <h3>Our Pool</h3>
        <div><i class="fa fa-tachometer"></i> Hash Rate: <span id="poolHashrate">{{ poolHashRate }}</span></div>
        <div><i class="fa fa-clock-o"></i> Block Found: <span id="poolLastBlockFound">{{ lastBlockTime }}</span></div>
        <div><i class="fa fa-users"></i> Connected Miners: <span id="poolMiners">{{ stats.pool.miners }}</span></div>
        <div><i class="fa fa-gift"></i> Donations: <span id="poolDonations"></span></div>
        <div><i class="fa fa-money"></i> Total Pool Fee: <span id="poolFee">{{ poolFee }}</span></div>
        <div><i class="fa fa-history"></i> Block Found Every: <span id="blockSolvedTime">{{ blockTime }}</span> (est.)</div>
    </div>
</template>

<script>

import store from 'store';
import config from 'config';
import Moment from 'moment';
import HashRateFormat from 'mixins/HashRateFormat';
import IntervalFormat from 'mixins/IntervalFormat';

export default {
    mixins: [HashRateFormat, IntervalFormat],
    data : () => store.state,
    computed: {
        lastBlockTime () {
            if (this.stats.pool) {
                return this.stats.pool.lastBlockFound ? 
                    Moment(parseInt(this.stats.pool.lastBlockFound)).from(this.now)
                    : 'Never';
            }
            return "";
        },
        blockTime () {
            return this.getReadableTime(this.stats.network.difficulty / this.stats.pool.hashrate) ;
        },
        poolHashRate () {
            return this.readableHashRate(this.stats.pool.hashrate) +  '/sec';
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
