import Moment from 'moment';
import store from 'store';
let socket = io('http://localhost:8117');
import {parsePayments, mergePayments} from 'payment-utils';
import {parseBlocks, mergeBlocks} from 'block-utils';

socket.on('connect', () => {
    if (store.state.minerAddress)
        socket.emit('address', store.state.minerAddress);
    socket.emit('refresh_stats');
    store.updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    store.updateConnectionStatus(false);
});

socket.on('reconnect', () => {
    if (store.state.minerAddress)
        socket.emit('address', store.state.minerAddress);
    socket.emit('refresh_stats');
    store.updateConnectionStatus(true);
});

socket.on('stats', (data) => {
    var payments = parsePayments(data.pool.payments);
    data.pool.payments = mergePayments(store.state.stats.pool ? store.state.stats.pool.payments : [], payments);
    var blocks = parseBlocks(data, data.pool.blocks);
    data.pool.blocks = mergeBlocks(store.state.stats.pool ? store.state.stats.pool.blocks : [], blocks);
    store.updateStats(data);
});

socket.on('miner_stats', (data) => {
    store.setMinerError(data.error);
    if (store.state.minerStatsError) return;
    var payments = parsePayments(data.payments);
    data.payments = mergePayments(store.state.minerStats ? store.state.minerStats.payments : [], payments);
    store.updateMinerStats(data);
});

export default socket;