<template>
    <div>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                <tr>
                    <th><i class="fa fa-bars"></i> Height</th>
                    <th title="How many more blocks network must mine before this block is matured"><i class="fa fa-link"></i> Maturity</th>
                    <th><i class="fa fa-unlock-alt"></i> Difficulty</th>
                    <th><i class="fa fa-paw"></i> Block Hash</th>
                    <th><i class="fa fa-clock-o"></i> Time Found</th>
                    <th><i class="fa fa-star-half-o"></i> Luck</th>
                </tr>
                </thead>
                <tbody id="blocks_rows">
                    <tr :class="rowClass(block.status)" v-for="block in blocks" :key="block.hash" :title="block.status">
                        <td> {{ block.height }} </td>
                        <td> {{ block.maturity }} </td>
                        <td> {{ block.difficulty }} </td>
                        <td> <hash-link full="true" :hash="block.hash"></hash-link> </td>
                        <td> {{ block.date }} </td>
                        <td> <span :class="block.luck<0?'luckBad':'luckGood'"> {{ block.luck }}% </span></td>
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
import config from 'config';
import HashLink from 'components/HashLink.vue';

let blockStatusClasses = {
    'pending': '',
    'unlocked': 'success',
    'orphaned': 'danger'
};

export default {
    props : ['blocks'],
    data: () => store.state,
    components: {HashLink},
    methods: {
        rowClass(status) {
            return blockStatusClasses[status];
        },
        loadMore() {
            var index = this.blocks.length - 1;
            var height;
            if (~index) height = this.blocks[index].height;
            else height = 0;
            var request = {
                height
            };
            store.requestBlocks(request);
        }
    }
};
</script>
