<template>
    <div class="ui centered grid">
        <div class="row">
        <div class="twelve wide column">
            <h1 class="ui centered header">
                <div class="content">
                {{ network.shortName }}
                </div>
                <div class="sub header">
                AS {{ this.$route.params.asn }}
                <i :class="network.cc+' flag'"></i>
                </div>
            </h1>
        </div>
        </div>
        <div v-if="showInput">
            <div class="ui twelve wide column">
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
        </div>

        <div class="twelve wide column">
            <h2 class="ui dividing header">
                <div class="content">
                    AS Interdependencies
                </div>
                <h4 class="ui top right floated header">
                    <div class="sub header">
                        <i class="ui question icon link" @click=""></i>
                        <i :class="sections.ASDependency.class" @click="switchSection('ASDependency')"></i>

                    </div>
                </h4>
            </h2>

            <div v-show="sections.ASDependency.show">
                <as-dependency :asn="Number(this.$route.params.asn)" :starttime="starttime" :endtime="endtime"></as-dependency>
            </div>
        </div>

        <div class="twelve wide column">
            <h2 class="ui dividing header">
                <div class="content">
                    External Delays
                </div>
                <h4 class="ui top right floated header">
                    <div class="sub header">
                        <i class="ui question icon link" @click=""></i>
                        <i :class="sections.ExternalDelays.class" @click="switchSection('ExternalDelays')"></i>
                    </div>
                </h4>
            </h2>

            <div v-show="sections.ExternalDelays.show">
            </div>
        </div>

        <div class="twelve wide column">
            <h2 class="ui dividing header">
                <div class="content">
                    Internal Delays & Forwarding Anomalies
                </div>
                <h4 class="ui top right floated header">
                    <div class="sub header">
                        <i class="ui question icon link" @click=""></i>
                        <i :class="sections.InternalDelayForwarding.class" @click="switchSection('InternalDelayForwarding')"></i>
                    </div>
                </h4>
            </h2>

            <div v-show="sections.InternalDelayForwarding.show">
                <in-delay-forwarding :asn="Number(this.$route.params.asn)" :starttime="starttime" :endtime="endtime"></in-delay-forwarding>
            </div>
        </div>

        <div class="twelve wide column">
            <h2 class="ui dividing header">
                <div class="content">
                    Network Disconnections
                </div>
                <h4 class="ui top right floated header">
                    <div class="sub header">
                        <i class="ui question icon link" @click=""></i>
                        <i :class="sections.NetworkDisconnections.class" @click="switchSection('NetworkDisconnections')"></i>
                    </div>
                </h4>
            </h2>

            <div v-show="sections.NetworkDisconnections.show">
                <network-disconnection :streamname="Number(this.$route.params.asn)" :starttime="starttime" :endtime="endtime"></network-disconnection>
            </div>

        </div>
    </div>
</template>

<script>
import { downloader } from './mixins/downloader'
import ASDependency from './ASDependency.vue'
import InternalDelayForwarding from './InternalDelayForwarding.vue'
import NetworkDisconnection from './NetworkDisconnection.vue'

export default {
    components: {
        "as-dependency": ASDependency,
        "in-delay-forwarding": InternalDelayForwarding,
        "network-disconnection": NetworkDisconnection,
    },
    mixins: [downloader],
    props: {
    },
    data () {
        return {
            network: {
                name: "",
                shortName: "",
                cc: ""
            },
            showInput: false,
            sections: {
                ASDependency: {
                    class: "ui chevron up icon link",
                    show: true
                },
                ExternalDelays: {
                    class: "ui chevron up icon link",
                    show: true
                },
                InternalDelayForwarding: {
                    class: "ui chevron up icon link",
                    show: true
                },
                NetworkDisconnections: {
                    class: "ui chevron up icon link",
                    show: true
                },
            },
            starttime: '2017-03-01T00:00',//
            endtime: '2017-03-07T00:00', // 
        }
    },
    created() {
        this.updateNetName()
    },
    methods: {
        switchSection: function(section){
            this.sections[section].show = !this.sections[section].show
            if(this.sections[section].show){
                this.sections[section].class =  "ui chevron up icon link"
            }
            else{
                this.sections[section].class =  "ui chevron down icon link"
            }
        },
        updateNetName(){
            this.apiGetData(
                "network/",
                {
                    number: this.$route.params.asn, 
                },
                this.updateNetNameCallback
        )
        },
        updateNetNameCallback(data){
            this.$nextTick(() => {
                this.network.name = data.results[0].name;
                var tmp = this.network.name.split(",")
                this.network.cc = tmp.pop().toLowerCase()
                this.network.shortName = tmp.join(",")
            })
        }
    },
    watch: {
        $route (to,from){
            this.updateNetName()       
        }   
    }
  }
</script>

<style>
</style>
