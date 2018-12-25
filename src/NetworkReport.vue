<template>
    <div>
        <h1 class="ui centered header">AS {{ this.$route.params.asn }}</h1>
        <div v-if="showInput">
            <div class="row">
                <div class="column">
                    <form v-on:submit.prevent="reset">
                        <input v-model="asn" placeholder="Origin ASN"> 
                        <input v-model="starttime" placeholder="Start time"> 
                        <input v-model="endtime" placeholder="End time"> 
                        <button>Refresh</button>
                    </form>
                </div>
            </div>
        </div>

        <h2 class="ui dividing header">AS Interdependencies</h2>
        <as-dependency :asn="this.$route.params.asn" :starttime="starttime" :endtime="endtime"></as-dependency>

        <h2 class="ui dividing header">External Delays</h2>

        <h2 class="ui dividing header">Internal Delays & Forwarding Anomalies</h2>
        <in-delay-forwarding :asn="this.$route.params.asn" :starttime="starttime" :endtime="endtime"></in-delay-forwarding>

        <h2 class="ui dividing header">Network Disconnections</h2>
    </div>
</template>

<script>
import ASDependency from './ASDependency.vue'

export default {
    props: {
    },
    data () {
        return {
            showInput: false,
            asn: this.getASN(),
            starttime: '2018-10-01T00:00',//
            endtime: '2018-10-03T00:00', // 
        }
    },

    methods: {
        getASN: function(){
            return this.$route.params.asn;
        }
    },
  }
</script>

<style>
</style>
