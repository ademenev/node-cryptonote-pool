import config from 'config';
import socket from 'socket';
import {parsePayments, mergePayments} from 'payment-utils';
import { parseBlocks, mergeBlocks } from './block-utils';
import Cookies from 'cookies';

let store = {
    updateStats(stats) {
        this.state.statsUpdated = true;
        setTimeout( () => {
            this.state.statsUpdated = false;
        }, 500);
        this.state.stats = stats;
    },
    updateMinerStats(stats) {
        this.state.minerStats = stats;
    },
    setMarketsData(marketsData) {
        this.state.marketsData = marketsData;
    },
    updateConnectionStatus(value) {
        this.state.connected = value;
    },
    setMinerAddress(address) {
        this.state.minerStats = null;
        this.state.minerAddress = address;
        Cookies.setItem('mining_address', address, Infinity);
        socket.emit('address', address);
    },
    requestPayments(request) {
        socket.emit('payments', request, (result) => {
            let payments = parsePayments(result);
            if (request.address) this.state.minerStats.payments = mergePayments(this.state.minerStats.payments, payments);
            else this.state.stats.pool.payments = mergePayments(this.state.stats.pool.payments, payments);
       });
    },
    requestBlocks(request) {
        socket.emit('blocks', request, (result) => {
            let blocks = parseBlocks(this.state.stats, result);
            this.state.stats.pool.blocks = mergeBlocks(this.state.stats.pool.blocks, blocks);
       });
    },
    setMinerError(err) {
        this.state.minerStatsError = err;
    },
    state: {
        currentRoute:  (window.location.hash || "").replace('#', ''),
        marketsData: [],
        stats: {

        },
        statsUpdated: false,
        config,
        now: new Date(),
        connected: false,
        minerStats: null,
        minerStatsError: null,
        newAddress: Cookies.getItem('mining_address') || "",
        minerAddress: Cookies.getItem('mining_address') || ""
    }
};

setInterval( () => {
    store.state.now = new Date();
}, 1000);

export default store;
