<template>
<div>
  <Menu></Menu>

    <div class="container">
        <div id="page"></div>
    </div>

    <footer>
        <div class="text-muted">
            Powered by <a target="_blank" href="//github.com/zone117x/node-cryptonote-pool"><i class="fa fa-github"></i> node-cryptonote-pool</a>
            <span id="poolVersion"></span>
            created by Matthew Little & open sourced under the <a href="http://www.gnu.org/licenses/gpl-2.0.html">GPL</a>
        </div>
    </footer>
</div>
</template>

<script>
import Menu from './Menu.vue';

export default {
  components: {Menu}
}
</script>

