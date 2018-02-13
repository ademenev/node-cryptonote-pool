<template>
    <div>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th><i class="fa fa-clock-o"></i> Time Sent</th>
                        <th><i class="fa fa-paw"></i> Transaction Hash</th>
                        <th><i class="fa fa-money"></i> Amount</th>
                        <th><i class="fa fa-sitemap"></i> Mixin</th>
                        <th v-if="recipients"><i class="fa fa-group"></i> Payees</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="payment in payments" :key="payment.hash">
                        <td>{{ payment.date }}</td>
                        <td>
                            <a target="_blank" :href="config.transactionExplorer + payment.hash">{{ payment.hash }}</a>
                        </td>
                        <td>{{ getReadableCoins(payment.amount, 4, true) }}</td>
                        <td>{{ payment.mixin }}</td>
                        <td v-if="{recipients}" >{{ payment.recipients }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p class="text-center">
            <button type="button" class="btn btn-default" v-on:click="loadMore">Load More</button>
        </p>
    </div>
</template>


<script>

import store from 'store';
import CoinsFormat from 'mixins/CoinsFormat';

export default {
    props : ['payments', 'address', 'recipients'],
    data: () => store.state,
    mixins: [CoinsFormat],
    methods: {
        loadMore() {
            var index = this.payments.length - 1;
            var time;
            if (~index) time = this.payments[index].time;
            else time = 0;
            var request = {
                time,
                address: this.address
            };
            store.requestPayments(request);
        }
    }
};
</script>
