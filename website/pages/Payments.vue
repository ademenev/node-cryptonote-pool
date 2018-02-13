<template>
  <main-layout>
      <div v-if="stats.pool">
        <div class="paymentsStatHolder">
            <span class="bg-primary">Total Payments: <span id="paymentsTotal">{{stats.pool.totalPayments}}</span></span>
            <span class="bg-info">Total Miners Paid: <span id="paymentsTotalPaid">{{stats.pool.totalMinersPaid}}</span></span>
            <span class="bg-info">Minimum Payment Threshold: <span id="paymentsMinimum">{{paymentsMinimum}} {{stats.config.symbol}}</span></span>
            <span class="bg-info">Denomination Unit: <span id="paymentsDenomination">{{paymentsDenomination}} {{stats.config.symbol}}</span></span>
        </div>

        <hr>

        <payments-list recipients="true" :payments="stats.pool.payments"></payments-list>
      </div>
  </main-layout>
</template>


<script>
import CoinsFormat from 'mixins/CoinsFormat';
import MainLayout from 'components/Layout.vue';
import PaymentsList from 'components/PaymentsList.vue';
import store from 'store';
import config from 'config';

export default {
    data: () => store.state,
    components: {
        MainLayout, PaymentsList
    },
    computed: {
        paymentsMinimum() {
            return this.getReadableCoins(this.stats.config.minPaymentThreshold, 3);
        },
        paymentsDenomination() {
            return this.getReadableCoins(this.stats.config.denominationUnit, 3);
        }
    },
    mixins: [CoinsFormat]
};
</script>

<style>
    .paymentsStatHolder > span{
        display: inline-block;
        border-radius: 5px;
        padding: 1px 9px;
        border: 1px solid #e5e5e5;
        margin: 2px;
    }
    .paymentsStatHolder > span > span{
        font-weight: bold;
    }
    #payments_rows > tr > td{
        vertical-align: middle;
        font-family: 'Inconsolata', monospace;
        font-size: 0.95em;
        text-align: center;
    }
</style>

