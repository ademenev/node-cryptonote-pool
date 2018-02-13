<template>
<div>
  <Menu></Menu>

    <div class="container">
        <slot></slot>
    </div>

    <footer>
        <div class="text-muted">
            Powered by <a target="_blank" href="//github.com/ademenev/node-cryptonote-pool"><i class="fa fa-github"></i> node-cryptonote-pool</a>
            <span id="poolVersion"></span>
            created by Matthew Little & open sourced under the <a href="http://www.gnu.org/licenses/gpl-2.0.html">GPL</a>,
            improved by Andrey Demenev
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

<style>
#coinName{
    text-transform: capitalize;
}
body {
    padding-top: 90px;
    padding-bottom: 80px;
    overflow-y: scroll;
}
.container{
    font-size: 1.2em;
}
#loading{
    font-size: 2em;
}
.stats {
    margin-bottom: 10px;
    margin-top: 5px;
}
.stats:last-child{
    width: auto;
}
.stats > h3 > i{
    font-size: 0.80em;
    width: 21px;
}
.stats > div{
    padding: 5px 0;
}
.stats > div > .fa {
    width: 25px;
}
.stats > div > span:first-of-type{
    font-weight: bold;
}
#stats_updated, #connection_lost{
    opacity: 0;
    float: right;
    margin-left: 30px;
    color: #e8e8e8;
    line-height: 47px;
    font-size: 0.9em;
}

#connection_lost {
    opacity: 1;
    color: green;
}


#connection_lost.active {
    color: red;
}

#connection_lost  .fa-check {
    display: inline-block;
}
#connection_lost  .fa-times {
    display: none;
}
#connection_lost.active  .fa-check {
    display: none;
}
#connection_lost.active  .fa-times {
    display: inline-block;
}


footer{
    position: fixed;
    bottom: 0;
    width: 100%;
    background-color: #444;
}

footer > div{
    margin: 10px auto;
    text-align: center;
}
</style>
