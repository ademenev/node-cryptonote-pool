<template>
    <main-layout>
        <h3>Contact</h3>
        <p>Email pool support at <a :href="'mailto:'+email">{{email}}</a></p>

        <h3>Chat Room</h3>
        <iframe :src="'https://kiwiirc.com/client/'+irc" style="border:0; width:100%; height:500px;"></iframe>
    </main-layout>
</template>

<script>
import config from 'config';
import MainLayout from 'components/Layout.vue';

export default {

    data() { return {}; },
    computed: {
        email: () => config.email,
        irc: () => config.irc
    },
    components: {
        MainLayout
    }

}
</script>
