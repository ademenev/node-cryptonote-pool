<template>
<div>
        <div class="stats" >
            <h3>Your Stats & Payment History</h3>

            <div :class="'input-group' + (validAddress || !newAddress ? '' : ' has-error')">
                <input class="form-control"  v-on:keyup.enter="updateAddress" v-model.trim="newAddress" id="yourStatsInput" type="text" placeholder="Enter Your Address">
                <span class="input-group-btn"><button class="btn btn-default" type="button" id="lookUp" v-on:click.stop.prevent="updateAddress" >
                    <span><i class="fa fa-search"></i> Lookup</span>
                    <span><i class="fa fa-refresh fa-spin"></i> Searching...</span>
                </button></span>
            </div>

            <div id="addressError">{{minerStatsError}}</div>

        </div>
        <div class="stats" v-if="minerStats && !minerStatsError">
            <hr/>
            <div><i class="fa fa-key"></i> Address: <span id="yourAddressDisplay"></span>{{ minerAddress }}</div>
            <div><i class="fa fa-bank"></i> Pending Balance: <span id="yourPendingBalance">{{ balance }}</span></div>
            <div><i class="fa fa-money"></i> Total Paid: <span id="yourPaid">{{ totalPaid }}</span></div>
            <div><i class="fa fa-clock-o"></i> Last Share Submitted: <span id="yourLastShare">{{ lastShare }}</span></div>
            <div><i class="fa fa-tachometer"></i> Hash Rate: <span id="yourHashrateHolder">{{ (minerStats.stats.hashrate || '0 H') + '/sec' }}</span></div>
            <div><i class="fa fa-cloud-upload"></i> Total Hashes Submitted: <span id="yourHashes">{{ (minerStats.stats.hashes || 0) }}</span></div>

            <br>

            <h4>Payments</h4>
            <payments-list :address="minerAddress" :payments="minerStats.payments"></payments-list>
        </div>
    </div>
</template>

<script>
import store from 'store';
import config from 'config';
import PaymentsList from 'components/PaymentsList.vue';
import Moment from 'moment';
import CoinsFormat from 'mixins/CoinsFormat';

export default {
    mixins: [CoinsFormat],
    data : () => store.state,
    methods: {
        updateAddress() {
            if (this.validAddress)
                store.setMinerAddress(this.newAddress);
        }
    },
    components: {PaymentsList},
    computed: {
        validAddress() {
            return /^[1-9a-km-zA-NP-Z]{95}$/.test(this.newAddress);
        },
        lastShare () {
            return this.minerStats.stats.lastShare ? 
                Moment(parseInt(this.minerStats.stats.lastShare) * 1000).from(this.now)
                : 'Never';
        },
        totalPaid() {
            return this.getReadableCoins(this.minerStats.stats.paid);
        },
        balance() {
            return this.getReadableCoins(this.minerStats.stats.balance);
        }
    }
};
</script>