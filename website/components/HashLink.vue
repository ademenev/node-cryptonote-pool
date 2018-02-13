<template>
    <a target="_blank" :href="config.blockchainExplorer + hash" >{{text}}</a>
</template>

<script>
import store from 'store';

export default {
    props: ['hash', 'full'],
    data : () => store.state,
    computed: {
        text() {
            return this.full ? this.hash : this.hash.substr(0, 13) + '...';
        }
    }
};
</script>
