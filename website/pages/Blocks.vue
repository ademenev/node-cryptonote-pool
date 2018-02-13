<template>
    <main-layout>
        <div v-if="stats.pool">
            <div class="blocksStatHolder">
                <span class="bg-primary">Total Blocks Mined: <span id="blocksTotal">{{stats.pool.totalBlocks}}</span></span>
                <span class="bg-info">Maturity Depth Requirement: <span id="blocksMaturityCount">{{stats.config.depth}}</span></span>
            </div>

            <hr>

            <blocks-list :blocks="stats.pool.blocks"></blocks-list>
        </div>
    </main-layout>
</template>

<script>
import CoinsFormat from 'mixins/CoinsFormat';
import MainLayout from 'components/Layout.vue';
import BlocksList from 'components/BlocksList.vue';
import store from 'store';
import config from 'config';

export default {
    data: () => store.state,
    components: {
        MainLayout, BlocksList
    }
}
</script>

<style>
    .blocksStatHolder > span{
        display: inline-block;
        border-radius: 5px;
        padding: 1px 9px;
        border: 1px solid #e5e5e5;
        margin: 2px;
    }
    .blocksStatHolder > span > span{
        font-weight: bold;
    }
    #blocks_rows > tr > td{
        vertical-align: middle;
        font-family: 'Inconsolata', monospace;
        font-size: 0.95em;
        text-align: center;
    }
    .luckGood{
        color: darkgreen;
    }
    .luckBad{
        color: darkred;
    }
</style>

