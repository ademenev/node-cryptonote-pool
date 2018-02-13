<template>
  <main-layout>
    <div id="siteInfo">
        <!-- Description or information about this pool -->
    </div>

    <div class="row">
        <network-stats></network-stats>
        <pool-stats></pool-stats>
        <markets></markets>

    </div>

    <hr>

    <div id="miningProfitCalc">
        <h3>Estimate Mining Profits</h3>
        <div id="calcHashHolder">
            <div class="input-group">
                <input type="number" v-model="rate" class="form-control" id="calcHashRate" placeholder="Enter Your Hash Rate">
                <div class="input-group-btn">
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" id="calcHashDropdown">
                        <span id="calcHashUnit">{{currentUnit}}</span> <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right" role="menu">
                        <li><a href="#" data-mul="0" v-on:click.prevent="recalcProfit">H/s</a></li>
                        <li><a href="#" data-mul="1" v-on:click.prevent="recalcProfit">kH/s</a></li>
                        <li><a href="#" data-mul="2" v-on:click.prevent="recalcProfit">MH/s</a></li>
                    </ul>
                </div>
                <span class="input-group-addon">=</span>
                <span class="input-group-addon" id="calcHashResultsHolder"><span>{{profit}}</span> <span id="calcHashSymbol"></span>/day</span>
            </div>
        </div>
    </div>

    <hr>
    <miner-stats></miner-stats>
  </main-layout>
</template>


<script>
  import MainLayout from 'components/Layout.vue';
  import Markets from 'components/Markets.vue';
  import PoolStats from 'components/PoolStats.vue';
  import NetworkStats from 'components/NetworkStats.vue';
  import MinerStats from 'components/MinerStats.vue';

  import store from 'store';
  import config from 'config';

  var units = [
      'H/s',
      'kH/s',
      'MH/s'
  ];
  var data = {
      mul: 1,
      rate: '',
      state: store.state
  }

  export default {
    components: {
      MainLayout, Markets, PoolStats, NetworkStats, MinerStats
    },
    data() {return data},
    props: ['stats'],
    methods: {
        recalcProfit(e) {
            data.mul = parseInt(e.target.getAttribute('data-mul'));
        }
    },
    computed: {
        currentUnit() {
            return units[data.mul];
        },
        profit() {
            try {
                var rateUnit = Math.pow(1000, data.mul);
                var inp2 = parseFloat(data.rate) * rateUnit;
                var resl = ( data.state.stats.network.reward / config.coinUnits) / ((data.state.stats.network.difficulty / inp2) / 86400  );
                if (!isNaN(resl)) {
                    return Math.round(resl * 100) / 100;
                }
            }
            catch(e){  }
        }
    }
};
</script>

<style>
    #networkLastReward{
        text-transform: uppercase;
    }
    #lastHash{
        font-family: 'Inconsolata', monospace;
        font-size: 0.8em;
    }
    #poolDonations{
        font-size: 0.75em;
    }
    #miningProfitCalc{
        margin: 35px 0;
    }
    #calcHashDropdown{
        border-radius: 0;
        border-left: 0;
        border-right: 0;
    }
    #calcHashHolder{
        width: 590px;
        max-width: 100%;
    }
    #calcHashRate{
        z-index: inherit;
        font-family: 'Inconsolata', monospace;
    }
    #calcHashAmount{
        font-family: 'Inconsolata', monospace;
    }
    #calcHashResultsHolder{
        min-width: 145px;
        max-width: 145px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    #yourStatsInput{
        z-index: inherit;
        font-family: 'Inconsolata', monospace;
    }
    #yourAddressDisplay > span {
        font-family: 'Inconsolata', monospace;
    }
    #lookUp > span:nth-child(2){
        display: none;
    }
    #yourAddressDisplay{
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
        font-family: 'Inconsolata', monospace;
        font-size: 0.9em;
    }
    #addressError{
        color: red;
    }


    #payments_rows > tr > td{
        vertical-align: middle;
        font-family: 'Inconsolata', monospace;
        font-size: 0.95em;
        text-align: center;
    }
    #payments_rows > tr > td:nth-child(2){
        text-align: left;
    }

</style>
