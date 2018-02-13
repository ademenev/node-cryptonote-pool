<template>
    <div class="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div class="container">
            <div class="navbar-header">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand"><span id="coinName" v-if="state.stats.config">{{state.stats.config.coin}}</span> Mining Pool</a>
            </div>
            <div class="collapse navbar-collapse">
                <ul class="nav navbar-nav">
                    <li v-for="item in menu_items" :key="item.id" :class="{active: state.currentRoute == item.id}">
                        <a class="hot_link" :data-page="item.id" :href="'#'+item.id">
                            <i :class="'fa fa-' + item.icon"></i> {{item.title}}
                        </a>
                    </li>
                </ul>
                <div id="stats_updated" :style="indicatorStyle">Stats Updated &nbsp;<i class="fa fa-bolt"></i></div>
                <div id="connection_lost" :class="{active: !state.connected}"><i class="fa fa-check" title="Connected to stats server"></i><i class="fa fa-times" title="Connection to stats server lost"></i></div>
            </div>

        </div>
    </div>
</template>

<script>
import store from 'store';
import routes from 'routes';



export default {
    data() {
        return {
            menu_items : routes,
            state: store.state
        };
    },
    computed: {
        indicatorStyle() {
            return {
                transition: this.state.statsUpdated ? 'opacity 100ms ease-out' : 'opacity 7000ms linear',
                opacity: this.state.statsUpdated ? 1 : 0
            }
        }
    }
}
</script>
